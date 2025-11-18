import { Module } from '@nestjs/common';
import { AwsS3Service } from './s3/s3.service';

@Module({
  controllers: [],
  providers: [AwsS3Service],
  exports: [AwsS3Service],
})
export class AwsModule {}