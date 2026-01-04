import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { randomUUID } from 'crypto';
import { NotificationService } from '../service/notification.service';
import { NotificationGateway } from '../gateway/notification.gateway';
import { JwtAuthGuard } from 'src/common/guard';
import { User } from 'src/common/decorator/user.decorator';
import { AdminNotificationService } from '../service/admin-notification.service';
import {
  AdminSendNotificationDto,
  AdminHistoryQueryDto,
  AdminUsersQueryDto,
  AdminNotificationType,
} from '../dto/admin-notification.dto';
import { NotificationType } from '../const/notification.const';

@Controller('admin/notifications')
@ApiTags('Admin Notifications')
export class AdminNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  /**
   * SSE endpoint - Client subscribe to receive real-time notifications
   * GET /admin/notifications/subscribe
   */
  @Get('subscribe')
  @ApiOperation({ summary: 'Subscribe to SSE notifications (Admin)' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Optional client ID',
  })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  subscribe(
    @Query('clientId') clientId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Generate unique client ID if not provided
    const id = clientId || randomUUID();

    // Add client to SSE subscribers
    this.adminNotificationService.addClient(id, res);

    // Send connection confirmation
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        clientId: id,
        message: 'Successfully connected to notification stream',
      })}\n\n`,
    );

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      this.adminNotificationService.removeClient(id);
    });
  }

  /**
   * Broadcast notification to all connected SSE clients
   * POST /admin/notifications/broadcast
   */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast notification to all connected clients' })
  @ApiResponse({ status: 200, description: 'Notification broadcasted' })
  async broadcast(
    @User('id') senderId: string,
    @Body() dto: AdminSendNotificationDto,
  ) {
    // Save to database
    const savedNotification =
      await this.adminNotificationService.saveNotification({
        title: dto.title,
        content: dto.message,
        type: dto.type,
        senderId,
        metadata: dto.data,
      });

    // Broadcast via SSE
    const sentCount = this.adminNotificationService.broadcast({
      title: dto.title,
      message: dto.message,
      type: dto.type,
      data: dto.data,
    });

    return {
      success: true,
      message: `Notification sent to ${sentCount} clients`,
      data: {
        id: savedNotification.id,
        sentCount,
        notification: {
          title: dto.title,
          message: dto.message,
          type: dto.type,
        },
      },
    };
  }

  /**
   * Broadcast notification to all users via WebSocket (Socket.IO)
   * POST /admin/notifications/broadcast-to-all
   */
  @Post('broadcast-to-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Broadcast notification to all users via WebSocket',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification broadcasted to all users',
  })
  async broadcastToAll(
    @User('id') senderId: string,
    @Body() dto: AdminSendNotificationDto,
  ) {
    // Map admin notification type to NotificationType
    const typeMapping: Record<string, NotificationType> = {
      [AdminNotificationType.INFO]: NotificationType.INFO,
      [AdminNotificationType.SUCCESS]: NotificationType.SUCCESS,
      [AdminNotificationType.WARNING]: NotificationType.WARNING,
      [AdminNotificationType.ERROR]: NotificationType.ERROR,
    };
    const notificationType =
      typeMapping[dto.type || AdminNotificationType.INFO] ||
      NotificationType.INFO;

    // Broadcast via WebSocket (this saves to DB with many-to-many for all users)
    const notification = await this.notificationGateway.broadcastToAll(
      {
        title: dto.title,
        content: dto.message,
        type: notificationType,
        metadata: dto.data,
      },
      senderId,
    );

    return {
      success: true,
      message: 'Notification broadcasted to all users',
      data: {
        id: notification.id,
        notification: {
          title: dto.title,
          message: dto.message,
          type: dto.type,
        },
      },
    };
  }

  /**
   * Send notification to a specific client (SSE)
   * POST /admin/notifications/send/:clientId
   */
  @Post('send/:clientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification to a specific SSE client' })
  @ApiParam({ name: 'clientId', description: 'Target client ID' })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async sendToClient(
    @User('id') senderId: string,
    @Param('clientId') clientId: string,
    @Body() dto: AdminSendNotificationDto,
  ) {
    // Save to database
    const savedNotification =
      await this.adminNotificationService.saveNotification({
        title: dto.title,
        content: dto.message,
        type: dto.type,
        targetUserId: clientId,
        senderId,
        metadata: dto.data,
      });

    // Send via SSE
    const sent = this.adminNotificationService.sendToClient(clientId, {
      title: dto.title,
      message: dto.message,
      type: dto.type,
      data: dto.data,
    });

    if (sent) {
      return {
        success: true,
        message: `Notification sent to client ${clientId}`,
        data: {
          id: savedNotification.id,
          notification: {
            title: dto.title,
            message: dto.message,
            type: dto.type,
          },
        },
      };
    } else {
      return {
        success: false,
        message: `Client ${clientId} not found`,
      };
    }
  }

  /**
   * Get list of connected SSE clients
   * GET /admin/notifications/clients
   */
  @Get('clients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of connected SSE clients' })
  @ApiResponse({ status: 200, description: 'List of connected clients' })
  getClients() {
    const clients = this.adminNotificationService.getClientIds();
    const count = this.adminNotificationService.getClientCount();

    return {
      success: true,
      data: {
        count,
        clients,
      },
    };
  }

  /**
   * Get notification history with pagination
   * GET /admin/notifications/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification history with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'targetUserId', required: false })
  @ApiResponse({ status: 200, description: 'Notification history' })
  async getHistory(@Query() query: AdminHistoryQueryDto) {
    const result = await this.adminNotificationService.getHistory(query);

    // Transform data to match admin frontend format
    const transformedData = result.data.map(
      ({ notification, sender, targetUsers }) => ({
        id: notification.id,
        title: notification.title,
        message: notification.content,
        type: (notification.metadata?.adminType as string) || notification.type,
        targetType: notification.targetType,
        createdAt: notification.createdAt,
        sender: sender ? { id: sender.id, name: sender.name } : null,
        targetUsers: targetUsers || [],
        metadata: notification.metadata,
      }),
    );

    return {
      success: true,
      data: transformedData,
      meta: result.meta,
    };
  }

  /**
   * Get users list for notification targeting
   * GET /admin/notifications/users
   */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users list for notification targeting' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getUsersForSelection(@Query() query: AdminUsersQueryDto) {
    const result =
      await this.adminNotificationService.getUsersForSelection(query);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * Send notification to a specific user via WebSocket
   * POST /admin/notifications/send-to-user/:userId
   */
  @Post('send-to-user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send notification to a specific user via WebSocket',
  })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendToUser(
    @User('id') senderId: string,
    @Param('userId') userId: string,
    @Body() dto: AdminSendNotificationDto,
  ) {
    // Validate user exists
    const targetUser =
      await this.adminNotificationService.validateUserExists(userId);

    // Map admin notification type to NotificationType
    const typeMapping: Record<string, NotificationType> = {
      [AdminNotificationType.INFO]: NotificationType.INFO,
      [AdminNotificationType.SUCCESS]: NotificationType.SUCCESS,
      [AdminNotificationType.WARNING]: NotificationType.WARNING,
      [AdminNotificationType.ERROR]: NotificationType.ERROR,
    };
    const notificationType =
      typeMapping[dto.type || AdminNotificationType.INFO] ||
      NotificationType.INFO;

    // Send via WebSocket using NotificationGateway (this also saves to DB with many-to-many)
    const notification = await this.notificationGateway.sendToUser(
      userId,
      {
        title: dto.title,
        content: dto.message,
        type: notificationType,
      },
      senderId,
    );

    return {
      success: true,
      message: `Notification sent to user ${targetUser.name}`,
      data: {
        id: notification.id,
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
        notification: {
          title: dto.title,
          message: dto.message,
          type: dto.type,
        },
      },
    };
  }

  /**
   * Send notification to multiple users via WebSocket (Group notification)
   * POST /admin/notifications/send-to-users
   */
  @Post('send-to-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send notification to multiple users via WebSocket (Group)',
  })
  @ApiResponse({ status: 200, description: 'Notification sent to group' })
  async sendToUsers(
    @User('id') senderId: string,
    @Body() dto: AdminSendNotificationDto & { userIds: string[] },
  ) {
    const { userIds, title, message, type, data } = dto;

    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: 'userIds is required and must not be empty',
      };
    }

    // Map admin notification type to NotificationType
    const typeMapping: Record<string, NotificationType> = {
      [AdminNotificationType.INFO]: NotificationType.INFO,
      [AdminNotificationType.SUCCESS]: NotificationType.SUCCESS,
      [AdminNotificationType.WARNING]: NotificationType.WARNING,
      [AdminNotificationType.ERROR]: NotificationType.ERROR,
    };
    const notificationType =
      typeMapping[type || AdminNotificationType.INFO] || NotificationType.INFO;

    // Send via WebSocket to multiple users (this also saves to DB with many-to-many)
    const notification = await this.notificationGateway.sendToUsers(
      userIds,
      {
        title,
        content: message,
        type: notificationType,
        metadata: data,
      },
      senderId,
    );

    return {
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      data: {
        id: notification.id,
        sentCount: userIds.length,
        notification: {
          title,
          message,
          type,
        },
      },
    };
  }

  /**
   * Delete a notification
   * DELETE /admin/notifications/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(@Param('id') id: string) {
    await this.adminNotificationService.deleteNotification(id);

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }
}
