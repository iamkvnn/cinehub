import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from '../entity/film.entity';
import { CreateFilmDto } from '../dto/request/create-film.dto';
import { UpdateFilmDto } from '../dto/request/update-film.dto';
import { PaginatedApiQuery } from 'src/common/dto';
import { Genre } from '../entity/genre.entity';
import { VideoService } from 'src/module/media/service/video.service';
import { PaginatedFilmByReleaseQuery } from '../dto/request/paginated-film-query.dto';
@Injectable()
export class FilmService {
  constructor(
    @InjectRepository(Film)
    private filmRepo: Repository<Film>,

    @InjectRepository(Genre)
    private genreRepo: Repository<Genre>,

    private readonly videoService: VideoService,
  ) {}

  async create(dto: CreateFilmDto) {
    // const category = await this.categoryRepo.findOne({
    //   where: { id: dto.categoryId },
    // });

    // if (!category) throw new NotFoundException('Category not found');

    const film = this.filmRepo.create({
      ...dto,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
      // category,
    });

    return this.filmRepo.save(film);
  }
  async findMostViewed(query: PaginatedApiQuery): Promise<[Film[], number]> {
    const qb = this.filmRepo
      .createQueryBuilder('film')
      .leftJoinAndSelect('film.genres', 'genre')
      .leftJoinAndSelect('film.posters', 'poster');
    qb.orderBy('film.views', 'DESC');
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
    const [films, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [films, count];
  }

  async findByReleaseDate(
    query: PaginatedFilmByReleaseQuery,
  ): Promise<[Film[], number]> {
    const qb = this.filmRepo
      .createQueryBuilder('film')
      .leftJoinAndSelect('film.genres', 'genre')
      .leftJoinAndSelect('film.posters', 'poster')
      .orderBy('film.releaseDate', query.releaseSort || 'DESC');

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

    const [films, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [films, count];
  }

  async findOne(id: string) {
    const film = await this.filmRepo.findOne({ where: { id } });
    if (!film) throw new NotFoundException('Film not found');
    return film;
  }

  async update(id: string, dto: UpdateFilmDto) {
    const film = await this.filmRepo.findOne({ where: { id } });
    if (!film) throw new NotFoundException('Film not found');

    // if (dto.categoryId) {
    //   const category = await this.categoryRepo.findOne({
    //     where: { id: dto.categoryId },
    //   });
    //   if (!category) throw new NotFoundException('Category not found');
    //   film.category = category;
    // }

    Object.assign(film, dto);
    return this.filmRepo.save(film);
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
