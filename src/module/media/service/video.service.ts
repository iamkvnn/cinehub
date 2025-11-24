import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { AwsS3Service } from 'src/module/aws/service/s3.service';
import { ConfigService } from '@nestjs/config';
import { TransformService } from './transform.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from 'src/module/film/entity/video.entity';
import { VideoStatus } from 'src/module/film/const/const';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class VideoService {
  private uploadCache = new Map();
  private readonly outputDir: string;
  private readonly cloudFrontDomain: string;
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly awsS3Service: AwsS3Service,
    private readonly configService: ConfigService,
    private readonly transformService: TransformService,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
  ) {
    this.outputDir = path.join(process.cwd(), this.configService.get<string>("videos.outputDir", "/tmp/videos"));
    this.cloudFrontDomain = this.configService.get<string>('cloudfront.domain', '');
  }

  async saveVideo(
    filmId: string,
    file: Express.Multer.File,
  ): Promise<Video> {
    const video = await this.videoRepo.save({
      filmId,
      key: `videos/${filmId}`,
      url: `${this.cloudFrontDomain}/videos/${filmId}/master.m3u8`,
      status: VideoStatus.PROCESSING,
    });
    this.handleVideoProcessing(filmId, file);
    return video;
  }

  async handleVideoProcessing(filmId: string, file: Express.Multer.File) {
    try {
      const videoDir = path.join(this.outputDir, filmId);
      if (fs.existsSync(videoDir)) {
        fs.rmSync(videoDir, { recursive: true, force: true });
        await this.deleteVideo(`videos/${filmId}`);
      }
      await mkdir(videoDir, { recursive: true });
      const filePath = path.join(videoDir, `tmp.mp4`);
      await writeFile(filePath, file.buffer);

      const hlsOutputDir = path.join(videoDir, 'hls');
      const transformSuccess = await this.transformService.convertToHLS(filePath, hlsOutputDir);

      if (!transformSuccess) {
        throw new Error("Video transformation failed.");
      }

      await this.awsS3Service.uploadHLSToS3(
        hlsOutputDir,
        `videos/${filmId}`,
      );

      const videoResolution = this.transformService.getVideoResolution(filePath);

      await this.videoRepo.update({ filmId }, {
        status: VideoStatus.READY,
        maxResolution: videoResolution.width,
      });
      fs.rmSync(videoDir, { recursive: true, force: true });
    } catch (err) {
      await this.deleteVideo(`videos/${filmId}`);
      this.logger.error(`Failed to save video for filmId ${filmId}: ${err?.message || err}`);
    }
  }

  async handleChunkUpload(data: {
    filmId: string;
    chunkIndex: number;
    totalChunks: number;
    chunk: string;
  }) {
    const { filmId, chunkIndex, totalChunks, chunk } = data;
    if (!this.uploadCache.has(filmId)) {
      this.uploadCache.set(filmId, {
        chunks: new Array(totalChunks),
        receivedChunks: 0,
        createdAt: Date.now(),
      });
    }

    const session = this.uploadCache.get(filmId);

    session.chunks[chunkIndex] = Buffer.from(chunk, 'base64');
    session.receivedChunks++;
    this.cleanupOldSessions();

    return {
      filmId,
      receivedChunks: session.receivedChunks,
      totalChunks,
      complete: session.receivedChunks === totalChunks,
    };
  }

  async completeChunkedUpload(filmId: string) {
    const session = this.uploadCache.get(filmId);

    if (!session) {
      throw new BadRequestException('Upload session not found');
    }

    if (session.receivedChunks !== session.chunks.length) {
      throw new BadRequestException('Not all chunks received');
    }

    const completeFile = Buffer.concat(session.chunks.filter(Boolean));
    const result = await this.saveVideo(
      filmId,
      {
        buffer: completeFile,
        mimetype: 'video/mp4',
        originalname: 'uploaded.mp4',
        size: completeFile.length,
      } as any,
    );
    this.uploadCache.delete(filmId);

    return result;
  }

  private cleanupOldSessions() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [filmId, session] of this.uploadCache.entries()) {
      if (session.createdAt < oneHourAgo) {
        this.uploadCache.delete(filmId);
      }
    }
  }

  async cancelChunkedUpload(filmId: string) {
    this.uploadCache.delete(filmId);
  }

  async deleteVideo(videoKey: string) {
    this.awsS3Service.deleteHLSFromS3(videoKey);
    await this.videoRepo.delete({ key: videoKey });
  }
}