import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDirectorDto, UpdateDirectorDto } from '../dto/director.dto';
import { handleDbExceptions } from 'src/common/utils/handle-db-exception';
import { PaginatedApiQuery } from 'src/common/dto';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { Director } from '../entity/director';
import { ImageService } from 'src/module/media/service/image.service';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    private readonly imageService: ImageService,
  ) {}

  async find(query: PaginatedApiQuery): Promise<[Director[], number]> {
    const { limit, page, search, sort } = query;
    const qb = this.directorRepository.createQueryBuilder('director');

    if (search) {
      qb.where('director.name LIKE :name', { name: `%${search}%` });
    }

    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`director.${key}`, value);
      });
    }

    qb.skip((page - 1) * limit).take(limit);
    return await qb.getManyAndCount();
  }

  async findOne(id: string): Promise<Director> {
    const director = await this.directorRepository.findOneBy({ id });
    if (!director) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    return director;
  }

  async create(dto: CreateDirectorDto, file?: Express.Multer.File): Promise<Director> {
    try {
      let photoUrl: string | undefined;
      let photoKey: string | undefined;
      if (file) {
        const image = await this.imageService.uploadImage(file);
        photoUrl = image.url;
        photoKey = image.key;
      }
      return await this.directorRepository.save({ ...dto, photoUrl, photoKey });
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async update(
    id: string,
    dto: UpdateDirectorDto,
    file?: Express.Multer.File,
  ): Promise<Director> {
    try {
      const director = await this.findOne(id);
      if (file) {
        if (director.photoKey) {
          this.imageService.deleteImage(director.photoKey);
        }
        const image = await this.imageService.uploadImage(file);
        director.photoUrl = image.url;
        director.photoKey = image.key;
      }
      Object.assign(director, dto);
      return await this.directorRepository.save(director);
    } catch (error) {
      handleDbExceptions(error);
    }
  }

  async delete(id: string): Promise<void> {
    const director = await this.findOne(id);
    await this.directorRepository.remove(director);
  }
}
