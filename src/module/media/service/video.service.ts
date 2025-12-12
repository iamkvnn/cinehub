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
import { ERROR_MESSAGES } from 'src/common/const/const';
import { Episode } from 'src/module/film/entity/episode';

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
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
  ) {
    this.outputDir = path.join(process.cwd(), this.configService.get<string>("videos.outputDir", "/tmp"));
    this.cloudFrontDomain = this.configService.get<string>('aws.cloudfront.domain', '');
  }

  async findOne(filmId: string, season?: number, episode?: number): Promise<Video> {
    const video = await this.videoRepo.findOne({
      where: {
        filmId,
        episode: {
          number: episode,
          season: {
            number: season
          }
        }
      },
      relations: { episode: { season: true } }
    });
    if (!video) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return video;
  }

  async saveVideo(
    filmId: string,
    file: Express.Multer.File,
    season?: number,
    episode?: number,
  ): Promise<Video> {
    let existingVideo: Video | null = null;
    try {
      existingVideo = await this.findOne(filmId, season, episode);
    }
    catch (err) {}
    if (existingVideo) {
      throw new BadRequestException(ERROR_MESSAGES.EXISTS);
    }
    
    let episodeEntity: Episode | undefined;
    let key = `videos/${filmId}` + (season !== undefined && episode !== undefined ? `/ss${season}ep${episode}` : '');
    if (season !== undefined && episode !== undefined) {
      episodeEntity = await this.episodeRepo.findOne({
        where: {
          number: episode,
          season: {
            number: season,
            filmId: filmId,
          }
        },
        relations: { season: true }
      }) || undefined;
    }
    const video = await this.videoRepo.save({
      filmId,
      episode: episodeEntity,
      key: key,
      url: `${this.cloudFrontDomain}/${key}/master.m3u8`,
      status: VideoStatus.PROCESSING,
    });
    this.handleVideoProcessing(video, file);
    return video;
  }

  async handleVideoProcessing(video: Video, file: Express.Multer.File) {
    try {
      const videoDir = path.join(this.outputDir, video.key);
      if (fs.existsSync(videoDir)) {
        fs.rmSync(videoDir, { recursive: true, force: true });
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
        video.key,
      );

      const videoResolution = this.transformService.getVideoResolution(filePath);

      await this.videoRepo.update({ filmId: video.filmId, episodeId: video.episode?.id }, {
        status: VideoStatus.READY,
        maxResolution: videoResolution.height,
      });
      fs.rmSync(videoDir, { recursive: true, force: true });
    } catch (err) {
      await this.deleteVideo(video.filmId, video.episode?.season?.number, video.episode?.number);
      this.logger.error(`Failed to save video for filmId ${video.filmId} ss${video.episode?.season?.number} ep${video.episode?.number}: ${err?.message || err}`);
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

  async deleteVideo(filmId: string, season?: number, episode?: number) {
    const entity = await this.findOne(filmId, season, episode);
    this.awsS3Service.deleteHLSFromS3(entity.key);
    await this.videoRepo.remove(entity);
  }
}