import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from './entity/film.entity';
import { Genre } from './entity/genre.entity';
import { FilmController } from './controller/film.controller';
import { FilmService } from './service/film.service';
import { MediaModule } from '../media/media.module';
import { Video } from './entity/video.entity';
import { Actor } from './entity/actor';
import { Director } from './entity/director';
import { Episode } from './entity/episode';
import { Season } from './entity/season';
import { ActorService } from './service/actor.service';
import { DirectorService } from './service/director.service';
import { SeasonService } from './service/season.service';
import { EpisodeService } from './service/episode.service';
import { ActorController } from './controller/actor.controller';
import { DirectorController } from './controller/director.controller';
import { SeasonController } from './controller/season.controller';
import { EpisodeController } from './controller/episode.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Film, Genre, Video, Actor, Director, Season, Episode]),
    MediaModule,
  ],
  controllers: [FilmController, EpisodeController, SeasonController, DirectorController, ActorController],
  providers: [FilmService, EpisodeService, SeasonService, DirectorService, ActorService],
  exports: [FilmService, EpisodeService, SeasonService, DirectorService, ActorService],
})
export class FilmModule {}
