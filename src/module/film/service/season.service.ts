import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { PaginatedApiQuery } from 'src/common/dto';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { Season } from '../entity/season';
import { CreateSeasonDto, UpdateSeasonDto } from '../dto/season.dto';
import { FilmService } from './film.service';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event';
import { SeasonCreatedPayload } from 'src/module/notification/dto';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly repository: Repository<Season>,
    private readonly filmService: FilmService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async find(
    filmId: string,
    query: PaginatedApiQuery,
  ): Promise<[Season[], number]> {
    await this.filmService.findOne(filmId);
    const { limit, page, search, sort } = query;
    const qb = this.repository
      .createQueryBuilder('s')
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

  async findOne(filmId: string, season: number): Promise<Season> {
    const entity = await this.repository.findOne({
      where: { number: season, filmId },
      relations: ['film'],
    });
    if (!entity) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(filmId: string, dto: CreateSeasonDto): Promise<Season> {
    try {
      const film = await this.filmService.findOne(filmId);
      const seasonNumber = (await this.countByFilmId(filmId)) + 1;

      const savedSeason = await this.repository.save({
        ...dto,
        filmId,
        number: seasonNumber,
      });

      // Emit season.created event for notification
      this.eventEmitter.emit(NOTIFICATION_EVENT_NAMES.SEASON_CREATED, {
        filmId: film.id,
        filmTitle: film.title,
        seasonId: savedSeason.id,
        seasonNumber: savedSeason.number,
        seasonTitle: undefined, // Season entity doesn't have title
        timestamp: new Date(),
      } as SeasonCreatedPayload);

      return savedSeason;
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async countByFilmId(filmId: string): Promise<number> {
    return await this.repository.count({ where: { filmId } });
  }

  async update(
    filmId: string,
    season: number,
    dto: UpdateSeasonDto,
  ): Promise<Season> {
    try {
      const entity = await this.findOne(filmId, season);
      Object.assign(entity, dto);
      return await this.repository.save(entity);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async delete(filmId: string, season: number): Promise<void> {
    const entity = await this.findOne(filmId, season);
    await this.repository.delete({
      filmId: entity.filmId,
      number: MoreThanOrEqual(entity.number),
    });
  }
}
