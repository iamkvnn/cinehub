import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { NotificationEntity } from '../entity/notification.entity';
import { UserNotificationEntity } from '../entity/user-notification.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import {
  AdminHistoryQueryDto,
  AdminNotificationType,
  AdminUsersQueryDto,
} from '../dto/admin-notification.dto';
import {
  NotificationStatus,
  NotificationTargetType,
  NotificationType,
} from '../const/notification.const';
import { UserRole } from 'src/module/user/const/user.const';

export interface AdminNotificationPayload {
  title: string;
  message: string;
  type?: AdminNotificationType;
  data?: any;
}

export interface AdminCreateNotificationDto {
  title: string;
  content: string;
  type?: AdminNotificationType;
  targetUserId?: string;
  senderId?: string;
  metadata?: Record<string, any>;
}

interface SSEClient {
  id: string;
  res: Response;
}

@Injectable()
export class AdminNotificationService {
  private clients: Map<string, SSEClient> = new Map();

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Add client to SSE subscribers
   */
  addClient(clientId: string, res: Response): void {
    this.clients.set(clientId, { id: clientId, res });
    console.log(
      `[SSE] Client connected: ${clientId}. Total clients: ${this.clients.size}`,
    );
  }

  /**
   * Remove client from SSE subscribers
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(
      `[SSE] Client disconnected: ${clientId}. Total clients: ${this.clients.size}`,
    );
  }

  /**
   * Send notification to a specific client
   */
  sendToClient(
    clientId: string,
    notification: AdminNotificationPayload,
  ): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      const data = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...notification,
      };
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    }
    return false;
  }

  /**
   * Broadcast notification to all SSE clients
   */
  broadcast(notification: AdminNotificationPayload): number {
    const data = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification,
    };
    const message = `data: ${JSON.stringify(data)}\n\n`;

    let sentCount = 0;
    this.clients.forEach((client) => {
      try {
        client.res.write(message);
        sentCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, error);
        this.removeClient(client.id);
      }
    });

    console.log(`[SSE] Broadcast notification to ${sentCount} clients`);
    return sentCount;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get list of connected client IDs
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Save notification to database (using new many-to-many schema)
   */
  async saveNotification(
    dto: AdminCreateNotificationDto,
  ): Promise<NotificationEntity> {
    // Map admin notification type to NotificationType enum
    const typeMapping: Record<string, NotificationType> = {
      info: NotificationType.INFO,
      success: NotificationType.SUCCESS,
      warning: NotificationType.WARNING,
      error: NotificationType.ERROR,
    };

    // Determine target type
    const targetType = dto.targetUserId
      ? NotificationTargetType.SINGLE
      : NotificationTargetType.BROADCAST;

    // Create notification record
    const notification = this.notificationRepository.create({
      title: dto.title,
      content: dto.content,
      type: typeMapping[dto.type || 'info'] || NotificationType.INFO,
      targetType,
      senderId: dto.senderId,
      metadata: {
        ...dto.metadata,
        adminType: dto.type || 'info',
      },
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Create user_notification record if targeting specific user
    if (dto.targetUserId) {
      const userNotification = this.userNotificationRepository.create({
        userId: dto.targetUserId,
        notificationId: savedNotification.id,
        status: NotificationStatus.UNREAD,
      });
      await this.userNotificationRepository.save(userNotification);
    }

    return savedNotification;
  }

  /**
   * Get notification history with pagination
   */
  async getHistory(query: AdminHistoryQueryDto): Promise<{
    data: {
      notification: NotificationEntity;
      sender?: { id: string; name: string; email: string };
      targetUsers?: { id: string; name: string }[];
    }[];
    meta: { total: number; page: number; limit: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .leftJoinAndSelect('notification.userNotifications', 'userNotifications')
      .leftJoinAndSelect('userNotifications.user', 'targetUser')
      .orderBy('notification.createdAt', 'DESC');

    if (query.type) {
      queryBuilder.andWhere(
        "JSON_UNQUOTE(JSON_EXTRACT(notification.metadata, '$.adminType')) = :type",
        {
          type: query.type,
        },
      );
    }

    if (query.targetUserId) {
      queryBuilder.andWhere('userNotifications.userId = :targetUserId', {
        targetUserId: query.targetUserId,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform data with sender and target users
    const dataWithSender = data.map((notification) => {
      const sender = notification.sender
        ? {
            id: notification.sender.id,
            name: notification.sender.name,
            email: notification.sender.email,
          }
        : undefined;

      const targetUsers = notification.userNotifications?.map((un) => ({
        id: un.user?.id,
        name: un.user?.name,
      }));

      return { notification, sender, targetUsers };
    });

    return {
      data: dataWithSender,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get users list for notification targeting (only regular users, not admins)
   */
  async getUsersForSelection(query: AdminUsersQueryDto): Promise<{
    data: { id: string; name: string; email: string }[];
    meta: { total: number; page: number; limit: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email'])
      .where('user.role = :role', { role: UserRole.USER })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .orderBy('user.name', 'ASC');

    if (query.search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
      meta: { total, page, limit },
    };
  }

  /**
   * Validate user exists
   */
  async validateUserExists(
    userId: string,
  ): Promise<{ id: string; name: string; email: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.USER },
      select: ['id', 'name', 'email'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return { id: user.id, name: user.name, email: user.email };
  }

  /**
   * Delete a notification (soft delete - removes user_notification records)
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    // Delete associated user_notification records first
    await this.userNotificationRepository.delete({
      notificationId: notificationId,
    });

    // Then delete the notification itself
    await this.notificationRepository.remove(notification);
  }
}
