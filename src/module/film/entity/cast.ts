import { BaseEntity } from 'src/core/base/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Actor } from './actor';
import { Film } from './film.entity';

@Entity()
export class Cast extends BaseEntity {
  @Column()
  character: string;

  @ManyToOne(() => Actor, (actor) => actor.casts, { onDelete: 'CASCADE' })
  actor: Actor;

  @ManyToOne(() => Film, (film) => film.casts, { onDelete: 'CASCADE' })
  film: Film;
}
