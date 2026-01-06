import { BaseEntity } from 'src/core/base/base.entity';
import { Gender } from 'src/module/user/const/user.const';
import { Column, Entity, ManyToMany } from 'typeorm';
import { Film } from './film.entity';

@Entity()
export class Director extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ enum: Gender, type: 'enum', nullable: true })
  gender?: Gender;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ nullable: true })
  nationality?: string;

  @Column({ nullable: true })
  photoUrl?: string;
  
  @Column({ nullable: true })
  photoKey?: string;

  @ManyToMany(() => Film, (film) => film.directors, { cascade: false })
  films: Film[];
}
