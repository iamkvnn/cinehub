import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from '../entity/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';
import { UserService } from 'src/module/user/service/user.service';
import { FilmService } from 'src/module/film/service/film.service';
import { EpisodeService } from 'src/module/film/service/episode.service';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { PaginatedApiQuery } from 'src/common/dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
    private readonly userService: UserService,
    private readonly filmService: FilmService,
    private readonly episodeService: EpisodeService,
  ) {}

  async find(
    filmId: string,
    query: PaginatedApiQuery,
  ): Promise<[Review[], number]> {
    return await this.repository.findAndCount({
      where: { filmId },
      relations: ['author', 'comments'],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    await this.filmService.findOne(dto.filmId);
    const user = await this.userService.findById(userId);
    return await this.repository.save({
      ...dto,
      author: user,
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const entity = await this.findOne(id);
    if (entity.authorId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    Object.assign(entity, dto);
    return await this.repository.save(entity);
  }

  async delete(userId: string, id: string): Promise<void> {
    const entity = await this.findOne(id);
    if (entity.authorId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.repository.delete({ id });
  }
}
