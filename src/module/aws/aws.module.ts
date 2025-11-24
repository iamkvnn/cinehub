import { Module } from '@nestjs/common';
import { AwsS3Service } from './service/s3.service';
import { CloudFrontService } from './service/cloudfront.service';

@Module({
  controllers: [],
  providers: [AwsS3Service, CloudFrontService],
  exports: [AwsS3Service, CloudFrontService],
})
export class AwsModule {}