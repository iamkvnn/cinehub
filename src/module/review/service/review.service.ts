import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from '../entity/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';
import { UserService } from 'src/module/user/service/user.service';
import { FilmService } from 'src/module/film/service/film.service';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { PaginatedApiQuery } from 'src/common/dto';
import { Film } from 'src/module/film/entity/film.entity';
import { UserRole } from 'src/module/user/const/user.const';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
    private readonly userService: UserService,
    private readonly filmService: FilmService,
  ) {}

  async find(query: PaginatedApiQuery): Promise<[Review[], number]> {
    const qb = this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.author', 'author')
      .leftJoinAndSelect('review.reports', 'reports')
      .leftJoinAndSelect('reports.user', 'user');

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        qb.addOrderBy(`review.${key}`, value === 'ASC' ? 'ASC' : 'DESC');
      });
    }

    const [reviews, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [reviews, count];
  }

  async findByFilmId(
    filmId: string,
    query: PaginatedApiQuery,
  ): Promise<[Review[], number]> {
    const qb = this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.author', 'author')
      .leftJoinAndSelect('review.reports', 'reports')
      .leftJoinAndSelect('reports.user', 'user')
      .where('review.filmId = :filmId', { filmId });

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        qb.addOrderBy(`review.${key}`, value === 'ASC' ? 'ASC' : 'DESC');
      });
    }

    const [reviews, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [reviews, count];
  }

  async findOne(id: string): Promise<Review> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['author', 'reports', 'reports.user'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const film = await this.filmService.findOne(dto.filmId);
    const user = await this.userService.findById(userId);

    const newUserRating = await this.calculateNewUserRating(
      film,
      dto.rating,
    );
   
    await this.filmService.updateRating(dto.filmId, newUserRating);

    return await this.repository.save({
      ...dto,
      author: user,
    });
  }

  private async calculateNewUserRating(
    currentFilm: Film,
    newReviewRating: number,
    action: 'create' | 'update' | 'delete' = 'create',
    oldReviewRating?: number,
  ): Promise<number> {
    const currentCount = await this.repository.count({ where: { filmId: currentFilm.id } });
    const totalRating = currentFilm.userRating * currentCount;
    if (action === 'update' && oldReviewRating !== undefined) {
      const newTotalRating = totalRating - oldReviewRating + newReviewRating;
      return parseFloat((newTotalRating / currentCount).toFixed(1));
    } else if (action === 'delete' && oldReviewRating !== undefined) {
      if (currentCount <= 1) {
        return 0;
      }
      const newTotalRating = totalRating - oldReviewRating;
      return parseFloat((newTotalRating / (currentCount - 1)).toFixed(1));
    } else {
      const newTotalRating = totalRating + newReviewRating;
      return parseFloat((newTotalRating / (currentCount + 1)).toFixed(1));
    }
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
    if (dto.rating !== entity.rating) {
      const film = await this.filmService.findOne(entity.filmId);
      const newUserRating = await this.calculateNewUserRating(
        film,
        dto.rating,
        'update',
        entity.rating,
      );
      await this.filmService.updateRating(entity.filmId, newUserRating);
    }
    Object.assign(entity, dto);
    return await this.repository.save(entity);
  }

  async delete(userId: string, id: string): Promise<void> {
    const entity = await this.findOne(id);
    const user = await this.userService.findById(userId);
    if (entity.authorId !== userId && user.role !== UserRole.ADMIN) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    const film = await this.filmService.findOne(entity.filmId);
    const newUserRating = await this.calculateNewUserRating(
      film,
      entity.rating,
      'delete',
      entity.rating,
    );
    await this.filmService.updateRating(entity.filmId, newUserRating);
    await this.repository.delete({ id });
  }
}
