import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Film } from './film.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Film, (film) => film.category)
  films: Film[];
}
