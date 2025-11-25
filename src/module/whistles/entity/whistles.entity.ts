import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';

/**
 * Whistles Entity
 * Quản lý danh sách phim yêu thích của người dùng
 * Hỗ trợ soft delete với createdAt, updatedAt, deletedAt
 */
@Entity('whistles')
export class WhistlesEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => Film, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'film_id' })
  film: Film;
}
