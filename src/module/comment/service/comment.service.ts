import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../entity/comment.entity';
import { FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UserService } from 'src/module/user/service/user.service';
import { FilmService } from 'src/module/film/service/film.service';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { CommentQueryDto } from '../dto/comment-query.dto';
import { ReviewService } from 'src/module/review/service/review.service';
import { PaginatedApiQuery } from 'src/common/dto';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event';
import type { CommentRepliedPayload } from 'src/module/notification/dto';
import { UserRole } from 'src/module/user/const/user.const';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    private readonly userService: UserService,
    private readonly filmService: FilmService,
    private readonly reviewService: ReviewService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async find(query: PaginatedApiQuery): Promise<[Comment[], number]> {
    const qb = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('comment.reports', 'reports')
      .leftJoinAndSelect('reports.user', 'user');

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`comment.${key}`, value);
      });
    }

    if (query.search) {
      qb.andWhere('(comment.content LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [comments, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [comments, count];
  }

  async findByFilmId(
    filmId: string,
    query: CommentQueryDto,
  ): Promise<[Comment[], number]> {
    const where: FindOptionsWhere<Comment> = {
      reviewId: query.reviewId,
      parentId: query.parentId || IsNull(),
      filmId,
    };

    return await this.repository.findAndCount({
      where,
      relations: ['author', 'replies', 'reports', 'reports.user'],
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
    // Validate film/episode exists
    const film = await this.filmService.findOne(dto.filmId);

    // Validate parent comment if replying
    let parentComment: Comment | null = null;
    if (dto.parentId) {
      parentComment = await this.findOne(dto.parentId);
    }

    // Validate review if commenting on review
    dto.reviewId && (await this.reviewService.findOne(dto.reviewId));

    const user = await this.userService.findById(userId);
    const savedComment = await this.repository.save({
      ...dto,
      author: user,
    });

    // Emit comment.replied event if this is a reply
    if (parentComment && parentComment.authorId !== userId) {
      this.eventEmitter.emit(NOTIFICATION_EVENT_NAMES.COMMENT_REPLIED, {
        commentId: savedComment.id,
        parentCommentId: parentComment.id,
        parentCommentAuthorId: parentComment.authorId,
        filmId: dto.filmId,
        filmTitle: film.title,
        replyAuthorId: userId,
        replyAuthorName: user.name || user.email,
        replyContent: dto.content,
        timestamp: new Date(),
      } as CommentRepliedPayload);
    }

    return savedComment;
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
    const user = await this.userService.findById(userId);
    if (entity.authorId !== userId && user.role !== UserRole.ADMIN) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.repository.delete({ id });
  }
}
