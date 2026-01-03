import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { Film } from '../entity/film.entity';
import { Genre } from '../entity/genre.entity';
import { VideoService } from 'src/module/media/service/video.service';
import { CreateFilmDto, UpdateFilmDto } from '../dto/film.dto';
import { Director } from '../entity/director';
import { Actor } from '../entity/actor';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { FilmQueryDto } from '../dto/film-query.dto';
import { Cast } from '../entity/cast';
import { FilmStatus, FilmType } from '../const/const';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event';
import {
  FilmCreatedPayload,
  FilmUpdatedPayload,
} from 'src/module/notification/dto';

@Injectable()
export class FilmService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,
    private readonly videoService: VideoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateFilmDto) {
    try {
      const savedFilm = await this.dataSource.transaction(async (manager) => {
        const filmRepo = manager.getRepository(Film);
        const genreRepo = manager.getRepository(Genre);
        const directorRepo = manager.getRepository(Director);
        const actorRepo = manager.getRepository(Actor);

        const genres = dto.genres
          ? await genreRepo.find({ where: { id: In(dto.genres) } })
          : undefined;
        if (genres?.length !== dto.genres?.length) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const directors = dto.directors
          ? await directorRepo.find({ where: { id: In(dto.directors) } })
          : undefined;
        if (directors?.length !== dto.directors?.length) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        let casts: DeepPartial<Cast>[] | undefined = undefined;
        if (dto.casts) {
          const actors = await actorRepo.find({
            where: { id: In(dto.casts.map((c) => c.actorId)) },
          });
          if (actors.length !== dto.casts.length) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
          }
          casts = dto.casts.map((c) => ({
            character: c.character,
            actor: {
              id: c.actorId,
            },
          }));
        }

        const film = filmRepo.create({
          ...dto,
          genres,
          directors,
          casts,
        });

        return filmRepo.save(film);
      });

      // Emit film.created event for notification
      if (savedFilm) {
        const film = await this.findOne(savedFilm.id);
        this.eventEmitter.emit(NOTIFICATION_EVENT_NAMES.FILM_CREATED, {
          filmId: film.id,
          filmTitle: film.title,
          filmType: film.type,
          status: film.status,
          posterUrl: film.posters?.[0]?.url,
          genres: film.genres?.map((g) => g.name),
          description: film.description,
          timestamp: new Date(),
        } as FilmCreatedPayload);
      }

      return savedFilm;
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async find(query: FilmQueryDto): Promise<[Film[], number]> {
    const qb = this.filmRepo.createQueryBuilder('film')
      .leftJoin('film.genres', 'genre')
      .leftJoin('film.directors', 'director')
      .leftJoin('film.casts', 'cast')
      .leftJoin('cast.actor', 'actor')
      .select('film.id');
    if (query.search) {
      qb.andWhere(
        '(film.title LIKE :search OR film.originalTitle LIKE :search OR film.englishTitle LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.genreSlug) {
      qb.andWhere('genre.slug = :genreSlug', { genreSlug: query.genreSlug });
    }

    if (query.directorId) {
      qb.andWhere('director.id = :directorId', { directorId: query.directorId });
    }

    if (query.actorId) {
      qb.andWhere('actor.id = :actorId', { actorId: query.actorId });
    }

    if (query.releaseYear) {
      qb.andWhere('YEAR(film.releaseDate) = :releaseYear', { releaseYear: query.releaseYear });
    }

    if (query.country) {
      qb.andWhere('film.country = :country', { country: query.country });
    }

    if (query.status) {
      qb.andWhere('film.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('film.type = :type', { type: query.type });
    }

    if (query.ageLimit) {
      qb.andWhere('film.ageLimit = :ageLimit', { ageLimit: query.ageLimit });
    }

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
          qb.addOrderBy(`film.${key}`, value as 'ASC' | 'DESC');
          qb.addSelect(`film.${key}`);
      });
    }

    const [filmsIds, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    if (count === 0) {
      return [[], 0];
    }

    const ids = filmsIds.map((f) => f.id);

    const films = await this.filmRepo.createQueryBuilder('film')
      .leftJoinAndSelect('film.posters', 'poster')
      .leftJoinAndSelect('film.genres', 'genre')
      .leftJoinAndSelect('film.directors', 'director')
      .leftJoinAndSelect('film.casts', 'cast')
      .leftJoinAndSelect('cast.actor', 'actor')
      .whereInIds(ids)
      .getMany();

    const sortedFilms = ids.map(id => films.find(f => f.id === id)!);

    return [sortedFilms, count];
  }

  async findOne(id: string) {
    const film = await this.filmRepo.findOne({
      where: { id },
      relations: [
        'posters',
        'genres',
        'directors',
        'casts',
        'casts.actor',
        'seasons',
      ],
    });
    if (!film) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    return film;
  }

  async update(id: string, dto: UpdateFilmDto) {
    try {
      // Get current film state to check for status change
      const currentFilm = await this.findOne(id);
      const previousStatus = currentFilm.status;

      const savedFilm = await this.dataSource.transaction(async (manager) => {
        const filmRepo = manager.getRepository(Film);
        const genreRepo = manager.getRepository(Genre);
        const directorRepo = manager.getRepository(Director);
        const actorRepo = manager.getRepository(Actor);
        const film = await filmRepo.findOne({ where: { id } });
        if (!film) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);

        const genres = dto.genres
          ? await genreRepo.find({ where: { id: In(dto.genres) } })
          : undefined;
        if (genres?.length !== dto.genres?.length) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }
        const directors = dto.directors
          ? await directorRepo.find({ where: { id: In(dto.directors) } })
          : undefined;
        if (directors?.length !== dto.directors?.length) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        let casts: DeepPartial<Cast>[] | undefined = undefined;
        if (dto.casts) {
          const actors = await actorRepo.find({
            where: { id: In(dto.casts.map((c) => c.actorId)) },
          });
          if (actors.length !== dto.casts.length) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
          }
          casts = dto.casts.map((c) => ({
            character: c.character,
            actor: {
              id: c.actorId,
            },
          }));
        }

        Object.assign(film, dto, { genres, directors, casts });
        return filmRepo.save(film);
      });

      // Emit film.published event if status changed to RELEASING
      if (
        savedFilm &&
        dto.status &&
        dto.status === FilmStatus.RELEASING &&
        previousStatus !== FilmStatus.RELEASING
      ) {
        const film = await this.findOne(savedFilm.id);
        this.eventEmitter.emit(NOTIFICATION_EVENT_NAMES.FILM_PUBLISHED, {
          filmId: film.id,
          filmTitle: film.title,
          filmType: film.type,
          previousStatus,
          newStatus: dto.status,
          posterUrl: film.posters?.[0]?.url,
          timestamp: new Date(),
        } as FilmUpdatedPayload);
      }

      return savedFilm;
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async remove(id: string) {
    await this.filmRepo.delete(id);
  }

  async uploadVideo(
    filmId: string,
    file: Express.Multer.File,
    season?: number,
    episode?: number,
  ) {
    await this.findOne(filmId);
    await this.verifyFilmType(filmId, season, episode);
    await this.videoService.saveVideo(filmId, file, season, episode);
  }

  async deleteVideo(filmId: string, season?: number, episode?: number) {
    await this.verifyFilmType(filmId, season, episode);
    await this.videoService.deleteVideo(filmId, season, episode);
  }

  async incrementViewCount(filmId: string): Promise<void> {
    await this.filmRepo.increment({ id: filmId }, 'views', 1);
  }

  async verifyFilmType(filmId: string, season?: number, episode?: number) {
    const film = await this.findOne(filmId);
    if (
      (film.type === FilmType.SERIES && (!season || !episode)) ||
      (film.type === FilmType.MOVIE && (season || episode))
    ) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
    }
  }
}
