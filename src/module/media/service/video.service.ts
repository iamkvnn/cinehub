// src/modules/upload/upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
// import * as ffmpeg from 'ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { AwsS3Service } from 'src/module/aws/s3/s3.service';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class VideoService {
  private uploadCache = new Map();

  constructor(
    private readonly awsS3Service: AwsS3Service,
    //@InjectQueue('transcode') private transcodeQueue: Queue,
  ) {}

//   async validateVideoFile(file: Express.Multer.File): Promise<boolean> {
//     const tempPath = `/tmp/${uuidv4()}.tmp`;
    
//     try {
//       await writeFile(tempPath, file.buffer);

//       return new Promise((resolve) => {
//         ffmpeg.ffprobe(tempPath, (err, metadata) => {
//           if (err) {
//             resolve(false);
//             return;
//           }

//           // Kiểm tra có video stream không
//           const hasVideo = metadata.streams.some(
//             (stream) => stream.codec_type === 'video',
//           );

//           // Kiểm tra codec hợp lệ
//           const validCodecs = ['h264', 'hevc', 'vp9', 'av1'];
//           const videoStream = metadata.streams.find(s => s.codec_type === 'video');
//           const hasValidCodec = videoStream && validCodecs.includes(videoStream.codec_name);

//           // Kiểm tra duration hợp lệ (ít nhất 1 giây)
//           const hasValidDuration = metadata.format.duration > 1;

//           resolve(hasVideo && hasValidCodec && hasValidDuration);
//         });
//       });
//     } finally {
//       // Cleanup
//       try {
//         await unlink(tempPath);
//       } catch {}
//     }
//   }

  async processUpload(
    file: Express.Multer.File,
  ) {
    
    const videoId = crypto.randomUUID();
    const fileExtension = path.extname(file.originalname);
    const originalKey = `videos/${videoId}/original${fileExtension}`;

    await this.awsS3Service.uploadFile(file, originalKey);

    // const videoMetadata = await this.extractVideoMetadata(file.buffer);

    // const video = await this.saveVideoToDatabase({
    //   id: videoId,
    //   title: metadata.title,
    //   description: metadata.description,
    //   originalKey,
    //   originalFilename: file.originalname,
    //   fileSize: file.size,
    //   duration: videoMetadata.duration,
    //   width: videoMetadata.width,
    //   height: videoMetadata.height,
    //   status: 'uploaded',
    // });

    // await this.transcodeQueue.add('transcode-video', {
    //   videoId,
    //   originalKey,
    //   resolutions: this.determineResolutions(videoMetadata.height),
    // });

    return {
      videoId,
      status: 'processing',
      message: 'Video uploaded successfully and is being processed',
    };
  }

//   private async extractVideoMetadata(buffer: Buffer): Promise<any> {
//     const tempPath = `/tmp/${crypto.randomUUID()}.tmp`;
//     await writeFile(tempPath, buffer);

//     return new Promise((resolve, reject) => {
//       ffmpeg.ffprobe(tempPath, async (err, metadata) => {
//         await unlink(tempPath);

//         if (err) {
//           reject(err);
//           return;
//         }

//         const videoStream = metadata.streams.find(
//           (s) => s.codec_type === 'video',
//         );

//         resolve({
//           duration: metadata.format.duration,
//           width: videoStream?.width,
//           height: videoStream?.height,
//           codec: videoStream?.codec_name,
//           bitrate: metadata.format.bit_rate,
//         });
//       });
//     });
//   }

  private determineResolutions(originalHeight: number): string[] {
    const resolutions: string[] = [];
    
    if (originalHeight >= 1080) {
      resolutions.push('1080p', '720p', '480p', '360p');
    } else if (originalHeight >= 720) {
      resolutions.push('720p', '480p', '360p');
    } else if (originalHeight >= 480) {
      resolutions.push('480p', '360p');
    } else {
      resolutions.push('360p');
    }

    return resolutions;
  }

  async handleChunkUpload(data: {
    uploadId: string;
    chunkIndex: number;
    totalChunks: number;
    chunk: string;
  }) {
    const { uploadId, chunkIndex, totalChunks, chunk } = data;
    if (!this.uploadCache.has(uploadId)) {
      this.uploadCache.set(uploadId, {
        chunks: new Array(totalChunks),
        receivedChunks: 0,
        createdAt: Date.now(),
      });
    }

    const session = this.uploadCache.get(uploadId);

    session.chunks[chunkIndex] = Buffer.from(chunk, 'base64');
    session.receivedChunks++;
    this.cleanupOldSessions();

    return {
      uploadId,
      receivedChunks: session.receivedChunks,
      totalChunks,
      complete: session.receivedChunks === totalChunks,
    };
  }

  async completeChunkedUpload(uploadId: string) {
    const session = this.uploadCache.get(uploadId);

    if (!session) {
      throw new BadRequestException('Upload session not found');
    }

    if (session.receivedChunks !== session.chunks.length) {
      throw new BadRequestException('Not all chunks received');
    }

    const completeFile = Buffer.concat(session.chunks.filter(Boolean));

    // const isValid = await this.validateVideoFile({
    //   buffer: completeFile,
    //   mimetype: 'video/mp4',
    //   originalname: 'uploaded.mp4',
    // } as any);

    // if (!isValid) {
    //   this.uploadCache.delete(uploadId);
    //   throw new BadRequestException('Invalid video file');
    // }

    const result = await this.processUpload(
      {
        buffer: completeFile,
        mimetype: 'video/mp4',
        originalname: 'uploaded.mp4',
        size: completeFile.length,
      } as any,
    );

    // Cleanup
    this.uploadCache.delete(uploadId);

    return result;
  }

  private cleanupOldSessions() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [uploadId, session] of this.uploadCache.entries()) {
      if (session.createdAt < oneHourAgo) {
        this.uploadCache.delete(uploadId);
      }
    }
  }

  async cancelChunkedUpload(uploadId: string) {
    this.uploadCache.delete(uploadId);
  }

  async deleteVideo(videoKey: string) {
    await this.awsS3Service.deleteFile(videoKey);
  }
}