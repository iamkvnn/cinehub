import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';

/**
 * Watch History Entity
 * Quản lý lịch sử xem phim của người dùng
 * Hỗ trợ soft delete với createdAt, updatedAt, deletedAt
 */
@Entity('watch_history')
export class WatchHistoryEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => Film, { onDelete: 'CASCADE' })
  film: Film;

  @Column({ type: 'int', default: 0 })
  watchedDuration: number;

  @Column({ type: 'int', default: 0 })
  totalDuration: number;
}
