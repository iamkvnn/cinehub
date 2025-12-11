import { Module } from '@nestjs/common';
import { ReviewController } from './controller/review.controller';
import { ReviewService } from './service/review.service';
import { ReviewReactionService } from './service/review-reaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entity/review.entity';
import { ReviewReaction } from './entity/review-reaction.entity';
import { ReviewReport } from './entity/review-report.entity';
import { FilmModule } from '../film/film.module';
import { UserModule } from '../user/user.module';

@Module({  
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReaction, ReviewReport]), 
    FilmModule, 
    UserModule
  ],
  exports: [ReviewService],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewReactionService],
})
export class ReviewModule {}