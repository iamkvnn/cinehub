import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../entity/comment.entity';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UserService } from 'src/module/user/service/user.service';
import { FilmService } from 'src/module/film/service/film.service';
import { EpisodeService } from 'src/module/film/service/episode.service';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { CommentQueryDto } from '../dto/comment-query.dto';
import { ReviewService } from 'src/module/review/service/review.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    private readonly userService: UserService,
    private readonly filmService: FilmService,
    private readonly episodeService: EpisodeService,
    private readonly reviewService: ReviewService,
  ) {}

  async find(query: CommentQueryDto): Promise<[Comment[], number]> {
    const where: FindOptionsWhere<Comment> = {
      filmId: query.filmId,
      reviewId: query.reviewId,
      parentId: query.parentId || IsNull(),
    };

    return await this.repository.findAndCount({
      where,
      relations: ['author', 'replies'],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Comment> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(userId: string, dto: CreateCommentDto): Promise<Comment> {
    dto.season && dto.episode
      ? await this.episodeService.findOne(dto.filmId, dto.season, dto.episode)
      : await this.filmService.findOne(dto.filmId);
    dto.parentId && (await this.findOne(dto.parentId));
    dto.reviewId && (await this.reviewService.findOne(dto.reviewId));
    const user = await this.userService.findById(userId);
    return await this.repository.save({
      ...dto,
      author: user,
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
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
