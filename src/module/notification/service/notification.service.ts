import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { NotificationEntity } from '../entity/notification.entity';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  SendNotificationDto,
} from '../dto';
import {
  NotificationStatus,
  NotificationType,
} from '../const/notification.const';
import { ERROR_MESSAGES } from 'src/common/const/const';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {}

  async find(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<[NotificationEntity[], number]> {
    const where: FindOptionsWhere<NotificationEntity> = {
      userId,
    };

    if (query.status) {
      where.status = query.status as NotificationStatus;
    }

    return await this.repository.findAndCount({
      where,
      relations: ['user'],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<NotificationEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  async create(dto: SendNotificationDto): Promise<NotificationEntity> {
    const notification = this.repository.create({
      ...dto,
      type: dto.type || NotificationType.SYSTEM,
      status: NotificationStatus.UNREAD,
      isBroadcast: !dto.userId,
    });
    return await this.repository.save(notification);
  }

  async createBroadcast(
    dto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = this.repository.create({
      ...dto,
      type: dto.type || NotificationType.SYSTEM,
      status: NotificationStatus.UNREAD,
      isBroadcast: true,
      userId: undefined,
    });
    return await this.repository.save(notification);
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await this.repository.update(
      {
        id: In(notificationIds),
        userId,
      },
      { status: NotificationStatus.READ },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    const entity = await this.findOne(id);
    if (entity.userId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.repository.delete({ id });
  }

  async deleteAllByUser(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }
}
