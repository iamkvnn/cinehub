import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchHistoryEntity } from './entity/watch-history.entity';
import { WatchHistoryService } from './service/watch-history.service';
import { WatchHistoryController } from './controller/watch-history.controller';
import { UserModule } from '../user/user.module';
import { FilmModule } from '../film/film.module';

@Module({
  imports: [TypeOrmModule.forFeature([WatchHistoryEntity]), UserModule, FilmModule],
  providers: [WatchHistoryService],
  controllers: [WatchHistoryController],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
