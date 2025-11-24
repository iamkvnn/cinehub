import { BaseEntity } from "src/core/base/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { VideoStatus } from "../const/const";
import { Film } from "./film.entity";

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

    @OneToOne(() => Film, (film) => film.video, { onDelete: 'CASCADE' })
    film: Film;
}