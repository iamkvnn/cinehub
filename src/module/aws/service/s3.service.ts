import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as fs from 'fs';
import * as path from 'path';
import { CloudFrontService } from './cloudfront.service';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudFrontService: CloudFrontService,
  ) {
    this.bucketName = this.configService.get<string>('aws.s3.bucketName', '');
    this.region = this.configService.get<string>('aws.s3.region', '');
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKey', ''),
        secretAccessKey: this.configService.get<string>('aws.secretKey', ''),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    try {
      this.logger.log(`Uploading file to S3 with key: ${key}`);
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await this.s3.send(new PutObjectCommand(params));
      this.logger.log(`File uploaded to S3 with key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Error uploading file to S3 with key: ${key}`,
        (error as Error).stack,
      );
    }
  }

  async deleteFile(key: string) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };
    try{
      this.logger.log(`Deleting file from S3 with key: ${key}`);
      await this.s3.send(new DeleteObjectCommand(params));
      await this.cloudFrontService.invalidateCache([`/${key}`]);
      this.logger.log(`File deleted from S3 with key: ${key}`);
    }
    catch(error){
      this.logger.error(
        `Error deleting file from S3 with key: ${key}`,
        (error as Error).stack,
      );
    }
  }

  async uploadHLSToS3(localDir: string, remotePrefix: string) {
    this.logger.log(`Uploading HLS files to S3 from local directory: ${localDir} to remote prefix: ${remotePrefix}`);
    if (!fs.existsSync(localDir)) {
      throw new Error('Local HLS folder not found: ' + localDir);
    }

    try {
      const files = this.getAllFiles(localDir);

      for (const filePath of files) {
        const fileContent = fs.readFileSync(filePath);

        const relativePath = path
          .relative(localDir, filePath)
          .replace(/\\/g, '/');

        const key = `${remotePrefix}/${relativePath}`;

        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: fileContent,
            ContentType: this.getContentType(filePath),
          }),
        );
      }
      this.logger.log(`Successfully uploaded HLS files to S3 from local directory: ${localDir} to remote prefix: ${remotePrefix}`);
    }
    catch(error){
      this.logger.error(
        `Error uploading HLS files to S3 from local directory: ${localDir}`,
        (error as Error).stack,
      );
    }
  }

  async getHLSFile(key: string): Promise<string | undefined> {
    const params = {
      Bucket: this.bucketName,
      Key: key + '/master.m3u8',
    };

    const data = await this.s3.send(new GetObjectCommand(params));
    return data.Body?.transformToString();
  }

  private getAllFiles(dir: string, files: string[] = []): string[] {
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    });
    return files;
  }

  private getContentType(file: string) {
    if (file.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (file.endsWith('.ts')) return 'video/mp2t';
    if (file.endsWith('.mp4')) return 'video/mp4';
    return 'application/octet-stream';
  }

  async deleteHLSFromS3(folder: string) {
    this.logger.log(`Deleting HLS files from S3 in folder: ${folder}`);
    const prefix = folder.endsWith('/') ? folder : folder + '/';
    let continuationToken: string | undefined = undefined;
    let deletedTotal = 0;

    do {
      const listResp = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = listResp.Contents || [];

      if (objects.length === 0) break;

      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key! })),
        },
      };

      await this.s3.send(new DeleteObjectsCommand(deleteParams));

      deletedTotal += objects.length;
      continuationToken = listResp.NextContinuationToken;
    } while (continuationToken);
    if (deletedTotal > 0) {
      await this.cloudFrontService.invalidateCache([`/${prefix}*`]);
    }
    this.logger.log(`Deleted ${deletedTotal} objects from S3 in folder: ${folder}`);
  }
}
