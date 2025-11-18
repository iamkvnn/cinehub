import { Column, Entity, ManyToOne } from "typeorm";
import { PosterType } from "../const/poster.const";
import { Film } from "src/module/film/entity/film.entity";
import { BaseEntity } from "src/core/base/base.entity";

@Entity()
export class Poster extends BaseEntity {
    @Column()
    url: string;

    @Column()
    key: string;

    @Column({ type: 'enum', enum: PosterType })
    type: PosterType;

    @Column()
    filmId: string;

    @ManyToOne(() => Film, (film) => film.posters, { onDelete: 'CASCADE' })
    film: Film;
}