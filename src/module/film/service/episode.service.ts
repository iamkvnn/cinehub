import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { PaginatedApiQuery } from 'src/common/dto';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { Episode } from '../entity/episode';
import { CreateEpisodeDto, UpdateEpisodeDto } from '../dto/episode.dto';
import { SeasonService } from './season.service';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event';
import { EpisodeCreatedPayload } from 'src/module/notification/dto';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private readonly repository: Repository<Episode>,
    private readonly seasonService: SeasonService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async find(
    filmId: string,
    season: number,
    query: PaginatedApiQuery,
  ): Promise<[Episode[], number]> {
    const seasonEntity = await this.seasonService.findOne(filmId, season);
    const { limit, page, search, sort } = query;
    const qb = this.repository
      .createQueryBuilder('s')
      .where('s.seasonId = :seasonId', { seasonId: seasonEntity.id });

    if (search) {
      qb.where('s.number LIKE :number', { number: `%${search}%` });
    }
    qb.addOrderBy('s.number', 'ASC');

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

  async findOne(
    filmId: string,
    season: number,
    number: number,
  ): Promise<Episode> {
    const entity = await this.repository.findOne({
      where: { season: { number: season, film: { id: filmId } }, number },
      relations: ['season', 'season.film'],
    });
    if (!entity) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(
    filmId: string,
    season: number,
    dto: CreateEpisodeDto,
  ): Promise<Episode> {
    try {
      const seasonEntity = await this.seasonService.findOne(filmId, season);
      const episodeNumber = (await this.countBySeasonId(seasonEntity.id)) + 1;

      const savedEpisode = await this.repository.save({
        ...dto,
        seasonId: seasonEntity.id,
        number: episodeNumber,
      });

      // Emit episode.created event for notification
      this.eventEmitter.emit(NOTIFICATION_EVENT_NAMES.EPISODE_CREATED, {
        filmId: seasonEntity.film.id,
        filmTitle: seasonEntity.film.title,
        seasonId: seasonEntity.id,
        seasonNumber: seasonEntity.number,
        episodeId: savedEpisode.id,
        episodeNumber: savedEpisode.number,
        episodeTitle: undefined, // Episode entity doesn't have title
        timestamp: new Date(),
      } as EpisodeCreatedPayload);

      return savedEpisode;
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async countBySeasonId(seasonId: string): Promise<number> {
    return await this.repository.count({ where: { seasonId } });
  }

  async update(
    filmId: string,
    season: number,
    number: number,
    dto: UpdateEpisodeDto,
  ): Promise<Episode> {
    try {
      const entity = await this.findOne(filmId, season, number);
      Object.assign(entity, dto);
      return await this.repository.save(entity);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async delete(filmId: string, season: number, number: number): Promise<void> {
    const entity = await this.findOne(filmId, season, number);
    await this.repository.delete({
      seasonId: entity.seasonId,
      number: MoreThanOrEqual(entity.number),
    });
  }
}
