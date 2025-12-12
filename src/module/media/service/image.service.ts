import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { AwsS3Service } from 'src/module/aws/service/s3.service';
import { ImageDto } from '../dto/dto';

@Injectable()
export class ImageService {
  private readonly cloudFrontDomain: string;
  constructor(
    private readonly awsS3Service: AwsS3Service,
    private readonly configService: ConfigService,
  ) {
    this.cloudFrontDomain = this.configService.get<string>(
      'aws.cloudfront.domain',
      '',
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<ImageDto> {
    const imageId = crypto.randomUUID();
    const fileExtension = path.extname(file.originalname);
    const originalKey = `images/${imageId}${fileExtension}`;
    await this.awsS3Service.uploadFile(file, originalKey);
    return {
      url: `${this.cloudFrontDomain}/${originalKey}`,
      key: originalKey,
    };
  }

  async deleteImage(imageKey: string) {
    await this.awsS3Service.deleteFile(imageKey);
  }
}
