import { BaseEntity } from 'src/core/base/base.entity';
import { Film } from 'src/module/film/entity/film.entity';
import { Review } from 'src/module/review/entity/review.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity()
export class Comment extends BaseEntity {
  @Column()
  content: string;

  @Column({ default: 0 })
  totalLikes: number;

  @Column({ default: 0 })
  totalDislikes: number;

  @Column({ nullable: true })
  season?: number;

  @Column({ nullable: true })
  episode?: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  parentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @Column({ type: 'varchar', length: 36 })
  authorId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: UserEntity;

  @Column({ type: 'varchar', length: 36 })
  filmId: string;

  @ManyToOne(() => Film, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId' })
  film: Film;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewId?: string;

  @ManyToOne(() => Review, (review) => review.comments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'reviewId' })
  review: Review;
}
