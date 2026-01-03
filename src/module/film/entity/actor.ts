import { BaseEntity } from 'src/core/base/base.entity';
import { Gender } from 'src/module/user/const/user.const';
import { Column, Entity, OneToMany } from 'typeorm';
import { Cast } from './cast';

@Entity()
export class Actor extends BaseEntity {
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

  @OneToMany(() => Cast, (cast) => cast.actor, { cascade: true })
  casts: Cast[];
}
