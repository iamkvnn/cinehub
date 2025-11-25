import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';
import { WatchHistoryEntity } from './entity/watch-history.entity';
import { WatchHistoryService } from './service/watch-history.service';
import { WatchHistoryController } from './controller/watch-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, Film, WatchHistoryEntity])],
  providers: [WatchHistoryService],
  controllers: [WatchHistoryController],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
