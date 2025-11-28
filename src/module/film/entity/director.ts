import { BaseEntity } from "src/core/base/base.entity";
import { Gender } from "src/module/user/const/user.const";
import { Column, Entity, ManyToMany } from "typeorm";
import { Film } from "./film.entity";

@Entity()
export class Director extends BaseEntity {
    @Column()
    name: string;

    @Column({ enum: Gender, type: 'enum', nullable: true })
    gender: Gender;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ nullable: true })
    birthDate: Date;

    @Column({ nullable: true })
    nationality: string;

    @Column({ nullable: true })
    photoUrl: string;

    @ManyToMany(() => Film, (film) => film.directors, { eager: false, cascade: false })
    films: Film[];
}