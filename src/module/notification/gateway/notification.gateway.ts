import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../service/notification.service';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_ROOMS,
} from '../const/notification.const';
import {
  BroadcastNotificationDto,
  CreateNotificationDto,
  SendNotificationDto,
} from '../dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly notificationService: NotificationService) {}

  afterInit() {
    this.logger.log('Notification WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Auto-join the 'all_users' room
    void client.join(NOTIFICATION_ROOMS.ALL_USERS);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client tham gia vào một room cụ thể
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.JOIN_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    void client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Client rời khỏi một room
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    void client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left', room };
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.MARK_AS_READ)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; notificationIds: string[] },
  ) {
    await this.notificationService.markAsRead(
      data.userId,
      data.notificationIds,
    );
    this.logger.log(
      `Marked ${data.notificationIds.length} notifications as read for user ${data.userId}`,
    );
    return { success: true };
  }

  /**
   * Gửi thông báo đến một user cụ thể (SINGLE)
   */
  async sendToUser(
    userId: string,
    dto: SendNotificationDto,
    senderId?: string,
  ) {
    // Save to DB with many-to-many relationship
    const notification = await this.notificationService.sendToUser(
      userId,
      dto,
      senderId,
    );

    // Emit to user's room via WebSocket
    const userRoom = NOTIFICATION_ROOMS.userRoom(userId);
    this.server.to(userRoom).emit(NOTIFICATION_EVENTS.NOTIFICATION, {
      ...notification,
      status: 'UNREAD',
    });
    this.logger.log(`Sent notification to user ${userId}`);

    return notification;
  }

  /**
   * Gửi thông báo đến một nhóm users (GROUP)
   */
  async sendToUsers(
    userIds: string[],
    dto: SendNotificationDto,
    senderId?: string,
  ) {
    // Save to DB with many-to-many relationship
    const notification = await this.notificationService.sendToUsers(
      userIds,
      dto,
      senderId,
    );

    // Emit to each user's room via WebSocket
    for (const userId of userIds) {
      const userRoom = NOTIFICATION_ROOMS.userRoom(userId);
      this.server.to(userRoom).emit(NOTIFICATION_EVENTS.NOTIFICATION, {
        ...notification,
        status: 'UNREAD',
      });
    }
    this.logger.log(`Sent notification to ${userIds.length} users`);

    return notification;
  }

  /**
   * Broadcast thông báo đến một room cụ thể
   */
  async broadcastToRoom(dto: BroadcastNotificationDto, senderId?: string) {
    const notification = await this.notificationService.broadcast(
      dto,
      senderId,
    );

    this.server.to(dto.room).emit(NOTIFICATION_EVENTS.NOTIFICATION_BROADCAST, {
      ...notification,
      status: 'UNREAD',
    });
    this.logger.log(`Broadcasted notification to room: ${dto.room}`);

    return notification;
  }

  /**
   * Broadcast thông báo đến tất cả users (BROADCAST)
   */
  async broadcastToAll(dto: CreateNotificationDto, senderId?: string) {
    // Save to DB - creates user_notifications for all users
    const notification = await this.notificationService.broadcast(
      dto,
      senderId,
    );

    // Emit to all connected clients
    this.server
      .to(NOTIFICATION_ROOMS.ALL_USERS)
      .emit(NOTIFICATION_EVENTS.NOTIFICATION_BROADCAST, {
        ...notification,
        status: 'UNREAD',
      });
    this.logger.log('Broadcasted notification to all users');

    return notification;
  }

  /**
   * Gửi event thông báo realtime (không lưu DB)
   */
  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.log(`Emitted event ${event} to room: ${room}`);
  }

  /**
   * Gửi event đến tất cả connected clients
   */
  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Emitted event ${event} to all clients`);
  }
}
