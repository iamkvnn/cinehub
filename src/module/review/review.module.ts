import { Module } from '@nestjs/common';
import { ReviewController } from './controller/review.controller';
import { ReviewService } from './service/review.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entity/review.entity';
import { FilmModule } from '../film/film.module';
import { UserModule } from '../user/user.module';

@Module({  
  imports: [TypeOrmModule.forFeature([Review]), FilmModule, UserModule],
  exports: [ReviewService],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}