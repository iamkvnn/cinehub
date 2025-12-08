import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThanOrEqual, Repository } from "typeorm";
import { handleDbExceptions } from "src/common/utils/handle-db-exception";
import { PaginatedApiQuery } from "src/common/dto";
import { ERROR_MESSAGES } from "src/common/const/const";
import { Season } from "../entity/season";
import { CreateSeasonDto, UpdateSeasonDto } from "../dto/season.dto";
import { FilmService } from "./film.service";

@Injectable()
export class SeasonService {
    constructor(
        @InjectRepository(Season)
        private readonly repository: Repository<Season>,
        private readonly filmService: FilmService,
    ) {}

    async find(filmId: string, query: PaginatedApiQuery): Promise<[Season[], number]> {
        await this.filmService.findOne(filmId);
        const { limit, page, search, sort } = query;
        const qb = this.repository.createQueryBuilder('s')
            .where('s.filmId = :filmId', { filmId });

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

    async findOne(filmId: string, id: string): Promise<Season> {
        const entity = await this.repository.findOneBy({ id, filmId });
        if (!entity) {
            throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
        }
        return entity;
    }

    async create(filmId: string, dto: CreateSeasonDto): Promise<Season> {
        try {
            await this.filmService.findOne(filmId);
            return await this.repository.save({
                ...dto,
                filmId,
                number: await this.countByFilmId(filmId) + 1,
            });
        } catch (error) {
            handleDbExceptions(error);
        }
    }

    async countByFilmId(filmId: string): Promise<number> {
        return await this.repository.count({ where: { filmId } });
    }

    async update(filmId: string, id: string, dto: UpdateSeasonDto): Promise<Season> {
        try {
            const entity = await this.findOne(filmId, id);
            Object.assign(entity, dto);
            return await this.repository.save(entity);
        } catch (error) {
            handleDbExceptions(error);
        }
    }

    async delete(filmId: string, id: string): Promise<void> {
        const entity = await this.findOne(filmId, id);
        await this.repository.delete({
            filmId: entity.filmId,
            number: MoreThanOrEqual(entity.number),
        })
    }
}