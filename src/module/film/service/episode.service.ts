import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThanOrEqual, Repository } from "typeorm";
import { handleDbExceptions } from "src/common/utils/handle-db-exception";
import { PaginatedApiQuery } from "src/common/dto";
import { ERROR_MESSAGES } from "src/common/const/const";
import { Episode } from "../entity/episode";
import { CreateEpisodeDto, UpdateEpisodeDto } from "../dto/episode.dto";
import { SeasonService } from "./season.service";

@Injectable()
export class EpisodeService {
    constructor(
        @InjectRepository(Episode)
        private readonly repository: Repository<Episode>,
        private readonly seasonService: SeasonService,
    ) {}

    async find(filmId: string, seasonId: string, query: PaginatedApiQuery): Promise<[Episode[], number]> {
        await this.seasonService.findOne(filmId, seasonId);
        const { limit, page, search, sort } = query;
        const qb = this.repository.createQueryBuilder('s')
            .where('s.seasonId = :seasonId', { seasonId });

        if (search) {
            qb.where('s.number LIKE :number', { number: `%${search}%` });
        }

        if (sort) {
            Object.entries(sort).forEach(([key, value]) => {
                if (value !== 'ASC' && value !== 'DESC') {
                throw new BadRequestException(
                    `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
                );
                }
                qb.addOrderBy(`s.${key}`, value);
            });
        }

        qb.skip((page - 1) * limit).take(limit);
        return await qb.getManyAndCount();
    }

    async findOne(filmId: string, seasonId: string, id: string): Promise<Episode> {
        await this.seasonService.findOne(filmId, seasonId);
        const entity = await this.repository.findOneBy({ id, seasonId });
        if (!entity) {
            throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
        }
        return entity;
    }

    async create(filmId: string, seasonId: string, dto: CreateEpisodeDto): Promise<Episode> {
        try {
            await this.seasonService.findOne(filmId, seasonId);
            return await this.repository.save({
                ...dto,
                seasonId,
                number: await this.countBySeasonId(seasonId) + 1,
            });
        } catch (error) {
            handleDbExceptions(error);
        }
    }

    async countBySeasonId(seasonId: string): Promise<number> {
        return await this.repository.count({ where: { seasonId } });
    }

    async update(filmId: string, seasonId: string, id: string, dto: UpdateEpisodeDto): Promise<Episode> {
        try {
            const entity = await this.findOne(filmId, seasonId, id);
            Object.assign(entity, dto);
            return await this.repository.save(entity);
        } catch (error) {
            handleDbExceptions(error);
        }
    }

    async delete(filmId: string, seasonId: string, id: string): Promise<void> {
        const entity = await this.findOne(filmId, seasonId, id);
        await this.repository.delete({
            seasonId: entity.seasonId,
            number: MoreThanOrEqual(entity.number),
        })
    }
}