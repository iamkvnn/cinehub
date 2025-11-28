import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany
} from 'typeorm';
import { Genre } from './genre.entity';
import { BaseEntity } from 'src/core/base/base.entity';
import { Poster } from 'src/module/poster/entity/poster.entity';
import { Video } from './video.entity';
import { WhistlesEntity } from 'src/module/whistles/entity/whistles.entity';
import { WatchHistoryEntity } from 'src/module/watch-history/entity/watch-history.entity';
import { AgeLimit, FilmStatus, FilmType } from '../const/const';
import { Director } from './director';
import { Actor } from './actor';
import { Season } from './season';

@Entity()
export class Film extends BaseEntity {
  @Column()
  title: string;

  @Column()
  originalTitle: string;

  @Column()
  englishTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'float', default: 0 })
  userRating: number;

  @Column({ type: 'enum', enum: AgeLimit, default: AgeLimit.ALL })
  ageLimit: AgeLimit;

  @Column()
  country: string;

  @Column()
  imdbRating: number;

  @ManyToMany(() => Director, (director) => director.films, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  directors: Director[];

  @ManyToMany(() => Actor, (actor) => actor.films, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  actors: Actor[];

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date | null;

  @Column({ type: 'enum', enum: FilmStatus, default: FilmStatus.UPCOMING })
  status: FilmStatus;

  @Column({ type: 'enum', enum: FilmType, default: FilmType.MOVIE })
  type: FilmType;

  @ManyToMany(() => Genre, (genre) => genre.films, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  genres: Genre[];

  @OneToMany(() => Poster, (poster) => poster.film, {
    eager: true,
    cascade: true,
    orphanedRowAction: 'delete',
  })
  posters: Poster[];

  @OneToMany(() => Video, (video) => video.film, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  videos: Video[];

  @OneToMany(() => WhistlesEntity, (whistle) => whistle.film, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  whistles: WhistlesEntity[];

  @OneToMany(() => WatchHistoryEntity, (history) => history.film, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  watchHistory: WatchHistoryEntity[];

  @OneToMany(() => Season, (season) => season.film, { cascade: true, orphanedRowAction: 'delete' })
  seasons: Season[];
}
