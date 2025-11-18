import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  
  constructor(
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('s3.bucketName', '');
    this.region = this.configService.get<string>('s3.region', ''); 
    this.s3 = new S3Client({
        region: this.region,
        credentials: {
            accessKeyId: this.configService.get<string>('s3.accessKey', ''),
            secretAccessKey: this.configService.get<string>('s3.secretKey', ''),
        },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(params));
  }

  async deleteFile(key: string) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    await this.s3.send(new DeleteObjectCommand(params));
  }
}