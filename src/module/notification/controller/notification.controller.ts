import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
} from 'src/common/dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { NotificationService } from '../service/notification.service';
import { NotificationGateway } from '../gateway/notification.gateway';
import { User } from 'src/common/decorator/user.decorator';
import { JwtAuthGuard } from 'src/common/guard';
import {
  NotificationDto,
  SendNotificationDto,
  BroadcastNotificationDto,
  MarkAsReadDto,
  NotificationQueryDto,
} from '../dto';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thông báo',
    type: createPaginatedApiResponseDto(NotificationDto),
  })
  async getMyNotifications(
    @User('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    const [data, total] = await this.notificationService.find(userId, query);
    return createPaginatedApiResponse(
      plainToInstance(NotificationDto, data, { excludeExtraneousValues: true }),
      query.page,
      query.limit,
      total,
    );
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  @ApiResponse({
    status: 200,
    description: 'Số lượng thông báo chưa đọc',
  })
  async getUnreadCount(@User('id') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return createApiResponse({ count });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết thông báo' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết thông báo',
    type: createApiResponseDto(NotificationDto),
  })
  async getNotification(@Param('id') id: string) {
    const notification = await this.notificationService.findOne(id);
    return createApiResponse(
      plainToInstance(NotificationDto, notification, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi thông báo đến một user cụ thể' })
  @ApiResponse({
    status: 201,
    description: 'Thông báo đã được gửi',
    type: createApiResponseDto(NotificationDto),
  })
  async sendNotification(@Body() dto: SendNotificationDto) {
    let notification;
    if (dto.userId) {
      notification = await this.notificationGateway.sendToUser(dto.userId, dto);
    } else {
      notification = await this.notificationGateway.broadcastToAll(dto);
    }
    return createApiResponse(
      plainToInstance(NotificationDto, notification, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast thông báo đến một room' })
  @ApiResponse({
    status: 201,
    description: 'Thông báo đã được broadcast',
    type: createApiResponseDto(NotificationDto),
  })
  async broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    const notification = await this.notificationGateway.broadcastToRoom(dto);
    return createApiResponse(
      plainToInstance(NotificationDto, notification, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Put('mark-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiResponse({
    status: 200,
    description: 'Đã đánh dấu đọc',
  })
  async markAsRead(@User('id') userId: string, @Body() dto: MarkAsReadDto) {
    await this.notificationService.markAsRead(userId, dto.notificationIds);
    return createApiResponse({ success: true });
  }

  @Put('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @ApiResponse({
    status: 200,
    description: 'Đã đánh dấu tất cả đọc',
  })
  async markAllAsRead(@User('id') userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return createApiResponse({ success: true });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa thông báo' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa thông báo',
  })
  async deleteNotification(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.notificationService.delete(userId, id);
    return createApiResponse({ success: true });
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tất cả thông báo của user' })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa tất cả thông báo',
  })
  async deleteAllNotifications(@User('id') userId: string) {
    await this.notificationService.deleteAllByUser(userId);
    return createApiResponse({ success: true });
  }
}
