import { BaseEntity } from 'src/core/base/base.entity';
import { Comment } from 'src/module/comment/entity/comment.entity';
import { Film } from 'src/module/film/entity/film.entity';
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
export class Review extends BaseEntity {
  @Column()
  content: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalLikes: number;

  @Column({ default: 0 })
  totalDislikes: number;

  @OneToMany(() => Comment, (comment) => comment.review, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments: Comment[];

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
}
