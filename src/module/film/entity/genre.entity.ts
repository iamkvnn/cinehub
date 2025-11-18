import { Column, Entity, ManyToMany } from 'typeorm';
import { Film } from './film.entity';
import { BaseEntity } from 'src/core/base/base.entity';

@Entity()
export class Genre extends BaseEntity {
  @Column()
  name: string;

  @ManyToMany(() => Film, (film) => film.genres)
  films: Film[];
}
