import { BaseEntity } from 'src/core/base/base.entity';
import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { Season } from './season';
import { Video } from './video.entity';

@Entity()
export class Episode extends BaseEntity {
  @Column()
  number: number;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate?: Date;

  @Column({ type: 'varchar', length: 36 })
  seasonId: string;

  @ManyToOne(() => Season, (season) => season.episodes, { onDelete: 'CASCADE' })
  season: Season;

  @OneToOne(() => Video, (video) => video.episode)
  video: Video;
}
