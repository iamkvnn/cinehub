import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from './entity/film.entity';
import { Category } from './entity/category.entity';
import { FilmController } from './controller/film.controller';
import { FilmService } from './service/film.service';

@Module({
  imports: [TypeOrmModule.forFeature([Film, Category])],
  controllers: [FilmController],
  providers: [FilmService],
  exports: [FilmService],
})
export class FilmModule {}
