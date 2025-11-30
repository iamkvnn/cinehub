import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Film } from '../entity/film.entity';
import { Genre } from '../entity/genre.entity';
import { VideoService } from 'src/module/media/service/video.service';
import { CreateFilmDto, UpdateFilmDto } from '../dto/film.dto';
import { Director } from '../entity/director';
import { Actor } from '../entity/actor';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { FilmQueryDto } from '../dto/film-query.dto';

@Injectable()
export class FilmService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,
    private readonly videoService: VideoService,
  ) {}

  async create(dto: CreateFilmDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const filmRepo = manager.getRepository(Film);
        const genreRepo = manager.getRepository(Genre);
        const directorRepo = manager.getRepository(Director);
        const actorRepo = manager.getRepository(Actor);

        const genres = dto.genres
          ? await genreRepo.find({ where: { id: In(dto.genres) } })
          : [];
        if (genres.length !== (dto.genres?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const directors = dto.directors
          ? await directorRepo.find({ where: { id: In(dto.directors) } })
          : [];
        if (directors.length !== (dto.directors?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const actors = dto.actors
          ? await actorRepo.find({ where: { id: In(dto.actors) } })
          : [];
        if (actors.length !== (dto.actors?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const film = filmRepo.create({
          ...dto,
          genres,
          directors,
          actors,
        });

        return filmRepo.save(film);
      });
    } catch (error) {
      handleDbExceptions(error);
    }
  }


  async find(query: FilmQueryDto): Promise<[Film[], number]> {
    const qb = this.filmRepo
      .createQueryBuilder('film')
      .leftJoinAndSelect('film.posters', 'poster')
      .leftJoinAndSelect('film.genres', 'genre')
      .leftJoinAndSelect('film.directors', 'director')
      .leftJoinAndSelect('film.actors', 'actor');

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`film.${key}`, value);
      });
    }

    if (query.search) {
      qb.andWhere('(film.title LIKE :search OR film.originalTitle LIKE :search OR film.englishTitle LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.genreId) {
      qb.andWhere('genre.id = :genreId', { genreId: query.genreId });
    }

    if (query.directorId) {
      qb.andWhere('director.id = :directorId', { directorId: query.directorId });
    }

    if (query.actorId) {
      qb.andWhere('actor.id = :actorId', { actorId: query.actorId });
    }

    if (query.releaseYear) {
      qb.andWhere('YEAR(film.releaseDate) = :releaseYear', {
        releaseYear: query.releaseYear,
      });
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
    
    const [films, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [films, count];
  }

  async findOne(id: string) {
    const film = await this.filmRepo.findOne({ where: { id }, relations: ['posters', 'genres', 'directors', 'actors'] });
    if (!film) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    return film;
  }

  async update(id: string, dto: UpdateFilmDto) {
    try {
      return this.dataSource.transaction(async (manager) => {
        const filmRepo = manager.getRepository(Film);
        const genreRepo = manager.getRepository(Genre);
        const directorRepo = manager.getRepository(Director);
        const actorRepo = manager.getRepository(Actor);
        const film = await filmRepo.findOne({ where: { id } });
        if (!film) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);

        const genres = dto.genres
          ? await genreRepo.find({ where: { id: In(dto.genres) } })
          : [];
        if (genres.length !== (dto.genres?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }
        const directors = dto.directors
          ? await directorRepo.find({ where: { id: In(dto.directors) } })
          : [];
        if (directors.length !== (dto.directors?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }
        const actors = dto.actors
          ? await actorRepo.find({ where: { id: In(dto.actors) } })
          : [];
        if (actors.length !== (dto.actors?.length || 0)) {
          throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        Object.assign(film, dto, { genres, directors, actors });
        return filmRepo.save(film);
      });
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async remove(id: string) {
    await this.filmRepo.delete(id);
  }

  async uploadVideo(filmId: string, file: Express.Multer.File) {
    await this.videoService.saveVideo(filmId, file);
  }

  async deleteVideo(filmId: string) {
    await this.videoService.deleteVideo(`videos/${filmId}`);
  }
}
