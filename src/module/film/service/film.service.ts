import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from '../entity/film.entity';
import { Category } from '../entity/category.entity';
import { CreateFilmDto } from '../dto/request/create-film.dto';
import { UpdateFilmDto } from '../dto/request/update-film.dto';
import { PaginatedApiQuery } from 'src/common/dto';
import { FilmResponseDto } from '../dto/response/film.dto';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class FilmService {
  constructor(
    @InjectRepository(Film)
    private filmRepo: Repository<Film>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateFilmDto): Promise<FilmResponseDto> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) throw new NotFoundException('Category not found');

    const film = this.filmRepo.create({
      ...dto,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
      category,
    });

    const savedFilm = this.filmRepo.save(film);
    return plainToInstance(FilmResponseDto, savedFilm, {
      excludeExtraneousValues: true,
    });
  }
  async findMostViewed(query: PaginatedApiQuery): Promise<[Film[], number]> {
    const qb = this.filmRepo.createQueryBuilder('film');
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

  async findOne(id: string): Promise<FilmResponseDto> {
    const film = await this.filmRepo.findOne({ where: { id } });
    if (!film) throw new NotFoundException('Film not found');
    film.views++;
    await this.filmRepo.save(film);
    return plainToInstance(FilmResponseDto, film, {
      excludeExtraneousValues: true,
    });
  }
  async update(id: string, dto: UpdateFilmDto): Promise<FilmResponseDto> {
    const film = await this.filmRepo.findOne({ where: { id } });
    if (!film) throw new NotFoundException('Film not found');

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      film.category = category;
    }

    Object.assign(film, dto);
    const updatedFilm = this.filmRepo.save(film);
    return plainToInstance(FilmResponseDto, updatedFilm, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    return this.filmRepo.delete(id);
  }
}
