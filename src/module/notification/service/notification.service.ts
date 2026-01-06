import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationEntity } from '../entity/notification.entity';
import { UserNotificationEntity } from '../entity/user-notification.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  SendNotificationDto,
} from '../dto';
import {
  NotificationStatus,
  NotificationTargetType,
  NotificationType,
} from '../const/notification.const';
import { ERROR_MESSAGES } from 'src/common/const/const';

// Interface for returning notification with user-specific status
export interface NotificationWithStatus {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  metadata?: Record<string, any>;
  status: NotificationStatus;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Find notifications for a specific user with their read status
   */
  async find(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<[NotificationWithStatus[], number]> {
    const queryBuilder = this.userNotificationRepository
      .createQueryBuilder('un')
      .leftJoinAndSelect('un.notification', 'notification')
      .where('un.userId = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('un.status = :status', { status: query.status });
    }

    const [userNotifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const data: NotificationWithStatus[] = userNotifications.map((un) => ({
      id: un.notification.id,
      title: un.notification.title,
      content: un.notification.content,
      type: un.notification.type,
      targetType: un.notification.targetType,
      metadata: un.notification.metadata,
      status: un.status,
      readAt: un.readAt,
      createdAt: un.notification.createdAt,
      updatedAt: un.notification.updatedAt,
    }));

    return [data, total];
  }

  /**
   * Find a single notification by ID
   */
  async findOne(id: string): Promise<NotificationEntity> {
    const entity = await this.notificationRepository.findOne({
      where: { id },
      relations: ['sender', 'userNotifications'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return entity;
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(
    userId: string,
    dto: SendNotificationDto,
    senderId?: string,
  ): Promise<NotificationEntity> {
    // Create the notification
    const notification = this.notificationRepository.create({
      title: dto.title,
      content: dto.content,
      type: dto.type || NotificationType.SYSTEM,
      targetType: NotificationTargetType.SINGLE,
      metadata: dto.metadata,
      senderId,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Create user_notification record
    const userNotification = this.userNotificationRepository.create({
      userId,
      notificationId: savedNotification.id,
      status: NotificationStatus.UNREAD,
    });
    await this.userNotificationRepository.save(userNotification);

    return savedNotification;
  }

  /**
   * Send notification to multiple users (group)
   */
  async sendToUsers(
    userIds: string[],
    dto: SendNotificationDto,
    senderId?: string,
  ): Promise<NotificationEntity> {
    // Create the notification
    const notification = this.notificationRepository.create({
      title: dto.title,
      content: dto.content,
      type: dto.type || NotificationType.SYSTEM,
      targetType: NotificationTargetType.GROUP,
      metadata: dto.metadata,
      senderId,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Create user_notification records for all users
    const userNotifications = userIds.map((userId) =>
      this.userNotificationRepository.create({
        userId,
        notificationId: savedNotification.id,
        status: NotificationStatus.UNREAD,
      }),
    );
    await this.userNotificationRepository.save(userNotifications);

    return savedNotification;
  }

  /**
   * Broadcast notification to all active users
   */
  async broadcast(
    dto: CreateNotificationDto,
    senderId?: string,
  ): Promise<NotificationEntity> {
    // Create the notification
    const notification = this.notificationRepository.create({
      title: dto.title,
      content: dto.content,
      type: dto.type || NotificationType.SYSTEM,
      targetType: NotificationTargetType.BROADCAST,
      metadata: dto.metadata,
      senderId,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Get all active users
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id'],
    });

    // Create user_notification records for all users in batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const userNotifications = batch.map((user) =>
        this.userNotificationRepository.create({
          userId: user.id,
          notificationId: savedNotification.id,
          status: NotificationStatus.UNREAD,
        }),
      );
      await this.userNotificationRepository.save(userNotifications);
    }

    return savedNotification;
  }

  /**
   * Legacy create method - sends to single user
   * @deprecated Use sendToUser instead
   */
  async create(dto: SendNotificationDto): Promise<NotificationEntity> {
    if (dto.userId) {
      return this.sendToUser(dto.userId, dto);
    }
    // If no userId, create as broadcast
    return this.broadcast(dto);
  }

  /**
   * Legacy createBroadcast method
   * @deprecated Use broadcast instead
   */
  async createBroadcast(dto: CreateNotificationDto): Promise<NotificationEntity> {
    return this.broadcast(dto);
  }

  /**
   * Mark specific notifications as read for a user
   */
  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await this.userNotificationRepository.update(
      {
        userId,
        notificationId: In(notificationIds),
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.userNotificationRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.userNotificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  /**
   * Delete a notification for a specific user (soft delete from user's view)
   */
  async delete(userId: string, notificationId: string): Promise<void> {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { userId, notificationId },
    });
    if (!userNotification) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.userNotificationRepository.delete({
      userId,
      notificationId,
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllByUser(userId: string): Promise<void> {
    await this.userNotificationRepository.delete({ userId });
  }
}
