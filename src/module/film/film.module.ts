import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from './entity/film.entity';
import { Genre } from './entity/genre.entity';
import { FilmController } from './controller/film.controller';
import { FilmService } from './service/film.service';
import { MediaModule } from '../media/media.module';
import { Video } from './entity/video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Film, Genre, Video]),
    MediaModule,
  ],
  controllers: [FilmController],
  providers: [FilmService],
  exports: [FilmService],
})
export class FilmModule {}
