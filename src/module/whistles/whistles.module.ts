import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';
import { WhistlesEntity } from './entity/whistles.entity';
import { WhistlesService } from './service/whistles.service';
import { WhistlesController } from './controller/whistles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, Film, WhistlesEntity])],
  providers: [WhistlesService],
  controllers: [WhistlesController],
  exports: [WhistlesService],
})
export class WhistlesModule {}
