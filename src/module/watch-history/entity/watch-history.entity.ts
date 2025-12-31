import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, ManyToOne, Column } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';

@Entity('watch_history')
export class WatchHistoryEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 36 })
  filmId: string;

  @ManyToOne(() => Film, { onDelete: 'CASCADE' })
  film: Film;

  @Column({nullable: true })
  season?: number;

  @Column({nullable: true })
  episode?: number;

  @Column({ type: 'int', default: 0 })
  watchedDuration: number;
}
