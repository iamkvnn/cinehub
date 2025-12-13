import { Module } from '@nestjs/common';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';
import { CommentReactionService } from './service/comment-reaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { CommentReaction } from './entity/comment-reaction.entity';
import { CommentReport } from './entity/comment-report.entity';
import { FilmModule } from '../film/film.module';
import { UserModule } from '../user/user.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentReaction, CommentReport]),
    FilmModule,
    UserModule,
    ReviewModule,
  ],
  exports: [],
  controllers: [CommentController],
  providers: [CommentService, CommentReactionService],
})
export class CommentModule {}
