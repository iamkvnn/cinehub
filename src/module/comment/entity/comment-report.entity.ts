import { BaseEntity } from 'src/core/base/base.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Comment } from './comment.entity';
import { ReportReason, ReportStatus } from '../const/const';

@Entity()
@Unique(['userId', 'commentId'])
export class CommentReport extends BaseEntity {
  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

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
