import { BaseEntity } from 'src/core/base/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { VideoStatus } from '../const/const';
import { Film } from './film.entity';
import { Episode } from './episode';

@Entity()
export class Video extends BaseEntity {
  @Column()
  url: string;

  @Column()
  key: string;

  @Column({ nullable: true })
  maxResolution: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: VideoStatus })
  status: VideoStatus;

  @Column()
  filmId: string;

  @ManyToOne(() => Film, (film) => film.videos, { onDelete: 'CASCADE' })
  film: Film;

  @OneToOne(() => Episode, (episode) => episode.video, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'episodeId' })
  episode: Episode;
}
