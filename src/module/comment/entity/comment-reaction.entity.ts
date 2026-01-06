import { BaseEntity } from 'src/core/base/base.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Comment } from './comment.entity';
import { ReactionType } from '../const/const';

@Entity()
@Unique(['userId', 'commentId'])
export class CommentReaction extends BaseEntity {
  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 36 })
  commentId: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}
