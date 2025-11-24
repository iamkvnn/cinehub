import { Module } from '@nestjs/common';
import { ImageService } from './service/image.service';
import { VideoService } from './service/video.service';
import { AwsModule } from '../aws/aws.module';
import { TransformService } from './service/transform.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '../film/entity/video.entity';

@Module({
  imports: [AwsModule, TypeOrmModule.forFeature([Video])],
  controllers: [],
  providers: [ImageService, VideoService, TransformService],
  exports: [ImageService, VideoService, TransformService],
})
export class MediaModule {}