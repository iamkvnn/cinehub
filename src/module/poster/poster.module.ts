import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PosterService } from './service/poster.service';
import { FilmModule } from '../film/film.module';
import { PosterController } from './controller/poster.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poster } from './entity/poster.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poster]), MediaModule, FilmModule],
  controllers: [PosterController],
  providers: [PosterService],
  exports: [],
})
export class PosterModule {}