import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from '../entity/actor';
import { Repository } from 'typeorm';
import { CreateActorDto, UpdateActorDto } from '../dto/actor.dto';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { PaginatedApiQuery } from 'src/common/dto';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { ImageService } from '../../media/service/image.service';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    private readonly imageService: ImageService,
  ) {}

  async find(query: PaginatedApiQuery): Promise<[Actor[], number]> {
    const { limit, page, search, sort } = query;
    const qb = this.actorRepository.createQueryBuilder('actor');

    if (search) {
      qb.where('actor.name LIKE :name', { name: `%${search}%` });
    }

    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`actor.${key}`, value);
      });
    }

    qb.skip((page - 1) * limit).take(limit);
    return await qb.getManyAndCount();
  }

  async findOne(id: string): Promise<Actor> {
    const actor = await this.actorRepository.findOneBy({ id });
    if (!actor) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return actor;
  }

  async create(dto: CreateActorDto, file?: Express.Multer.File): Promise<Actor> {
    try {
      let photoUrl: string | undefined;
      let photoKey: string | undefined;
      if (file) {
        const image = await this.imageService.uploadImage(file);
        photoUrl = image.url;
        photoKey = image.key;
      }
      return await this.actorRepository.save({ ...dto, photoUrl, photoKey });
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async update(
    id: string,
    dto: UpdateActorDto,
    file?: Express.Multer.File,
  ): Promise<Actor> {
    try {
      const actor = await this.findOne(id);
      if (file) {
        if (actor.photoKey) {
          this.imageService.deleteImage(actor.photoKey);
        }
        const image = await this.imageService.uploadImage(file);
        actor.photoUrl = image.url;
        actor.photoKey = image.key;
      }
      Object.assign(actor, dto);
      return await this.actorRepository.save(actor);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async delete(id: string): Promise<void> {
    const actor = await this.findOne(id);
    await this.actorRepository.remove(actor);
  }
}
