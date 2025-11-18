import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Genre } from './genre.entity';
import { BaseEntity } from 'src/core/base/base.entity';
import { Poster } from 'src/module/poster/entity/poster.entity';

@Entity()
export class Film extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date | null;

  @ManyToMany(() => Genre, (genre) => genre.films, {
    cascade: true,
  })
  @JoinTable()
  genres: Genre[];

  @OneToMany(() => Poster, (poster) => poster.film, { eager: true, cascade: true, orphanedRowAction: 'delete' })
  posters: Poster[];
}
