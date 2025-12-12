import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { FilmModule } from '../film/film.module';
import { MediaModule } from '../media/media.module';
import { StreamController } from './controller/steam.controller';
import { StreamService } from './service/stream.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AwsModule, FilmModule, MediaModule, UserModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [],
})
export class StreamModule {}
