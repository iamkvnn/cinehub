import { Module } from '@nestjs/common';
import { ImageService } from './service/image.service';
import { VideoService } from './service/video.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [],
  providers: [ImageService, VideoService],
  exports: [ImageService, VideoService],
})
export class MediaModule {}