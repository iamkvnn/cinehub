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
import { BroadcastNotificationDto, SendNotificationDto } from '../dto';

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
   * Gửi thông báo đến một user cụ thể
   */
  async sendToUser(userId: string, dto: SendNotificationDto) {
    const notification = await this.notificationService.create({
      ...dto,
      userId,
    });

    const userRoom = NOTIFICATION_ROOMS.userRoom(userId);
    this.server
      .to(userRoom)
      .emit(NOTIFICATION_EVENTS.NOTIFICATION, notification);
    this.logger.log(`Sent notification to user ${userId}`);

    return notification;
  }

  /**
   * Broadcast thông báo đến một room
   */
  async broadcastToRoom(dto: BroadcastNotificationDto) {
    const notification = await this.notificationService.createBroadcast(dto);

    this.server
      .to(dto.room)
      .emit(NOTIFICATION_EVENTS.NOTIFICATION_BROADCAST, notification);
    this.logger.log(`Broadcasted notification to room: ${dto.room}`);

    return notification;
  }

  /**
   * Broadcast thông báo đến tất cả users
   */
  async broadcastToAll(dto: SendNotificationDto) {
    const notification = await this.notificationService.createBroadcast(dto);

    this.server
      .to(NOTIFICATION_ROOMS.ALL_USERS)
      .emit(NOTIFICATION_EVENTS.NOTIFICATION_BROADCAST, notification);
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
