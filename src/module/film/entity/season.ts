import { BaseEntity } from "src/core/base/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { SeasonStatus } from "../const/const";
import { Episode } from "./episode";
import { Film } from "./film.entity";

@Entity()
export class Season extends BaseEntity {
    @Column()
    number: number;

    @Column({ type: 'timestamp', nullable: true })
    releaseDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate?: Date;

    @Column({ type: 'enum', enum: SeasonStatus, default: SeasonStatus.UPCOMING })
    status: SeasonStatus;

    @OneToMany(() => Episode, episode => episode.season, { cascade: true, orphanedRowAction: 'delete' })
    episodes: Episode[];

    @Column({ type: 'varchar', length: 36 })
    filmId: string;

    @ManyToOne(() => Film, film => film.seasons, { onDelete: 'CASCADE' })
    film: Film;
}