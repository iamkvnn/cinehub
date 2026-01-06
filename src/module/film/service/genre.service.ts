import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { PaginatedApiQuery } from 'src/common/dto';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { Genre } from '../entity/genre.entity';
import { CreateGenreDto, UpdateGenreDto } from '../dto/genre.dto';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async find(query: PaginatedApiQuery): Promise<[Genre[], number]> {
    const { limit, page, search, sort } = query;
    const qb = this.genreRepository.createQueryBuilder('genre');

    if (search) {
      qb.where('genre.name LIKE :name', { name: `%${search}%` });
    }

    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`genre.${key}`, value);
      });
    }

    qb.skip((page - 1) * limit).take(limit);
    return await qb.getManyAndCount();
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.genreRepository.findOneBy({ id });
    if (!genre) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return genre;
  }

  async create(dto: CreateGenreDto): Promise<Genre> {
    try {
      return await this.genreRepository.save(dto);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async update(id: string, dto: UpdateGenreDto): Promise<Genre> {
    try {
      const genre = await this.findOne(id);
      Object.assign(genre, dto);
      return await this.genreRepository.save(genre);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async delete(id: string): Promise<void> {
    const genre = await this.findOne(id);
    await this.genreRepository.remove(genre);
  }
}
