import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import {
  NotificationStatus,
  NotificationTargetType,
  NotificationType,
} from '../const/notification.const';
import { UserDto } from 'src/module/user/dto/user.dto';

export class NotificationDto extends BaseDto {
  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'Phim mới đã được phát hành',
  })
  @IsString()
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Nội dung thông báo',
    example: 'Phim "Avengers: Endgame" đã có trên CineHub',
  })
  @IsString()
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Loại thông báo',
    enum: NotificationType,
    example: NotificationType.FILM_NEW,
  })
  @IsEnum(NotificationType)
  @Expose()
  type: NotificationType;

  @ApiProperty({
    description: 'Loại đối tượng nhận',
    enum: NotificationTargetType,
    example: NotificationTargetType.SINGLE,
  })
  @IsEnum(NotificationTargetType)
  @Expose()
  targetType: NotificationTargetType;

  @ApiProperty({
    description: 'Trạng thái thông báo (từ user_notifications)',
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD,
  })
  @IsEnum(NotificationStatus)
  @Expose()
  status: NotificationStatus;

  @ApiProperty({
    description: 'Thời điểm đọc thông báo',
    required: false,
  })
  @Expose()
  readAt?: Date;

  @ApiProperty({
    description: 'Metadata bổ sung',
    example: { filmId: 'film123', posterUrl: 'https://...' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  @Expose()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Người gửi thông báo',
    type: () => UserDto,
    required: false,
  })
  @Type(() => UserDto)
  @Expose()
  sender?: UserDto;
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'Phim mới đã được phát hành',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Nội dung thông báo',
    example: 'Phim "Avengers: Endgame" đã có trên CineHub',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Loại thông báo',
    enum: NotificationType,
    example: NotificationType.FILM_NEW,
    required: false,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  @Expose()
  type?: NotificationType;

  @ApiProperty({
    description: 'Metadata bổ sung',
    example: { filmId: 'film123', posterUrl: 'https://...' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  @Expose()
  metadata?: Record<string, any>;
}

export class SendNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'ID người nhận (null nếu broadcast)',
    example: 'user-uuid-123',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class SendToUsersDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'Danh sách ID người nhận',
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class BroadcastNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'Tên room để broadcast',
    example: 'all_users',
  })
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class UpdateNotificationDto extends PartialType(
  PickType(NotificationDto, ['status']),
) {}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Danh sách ID thông báo cần đánh dấu đã đọc',
    example: ['notif-uuid-1', 'notif-uuid-2'],
  })
  @IsUUID('4', { each: true })
  notificationIds: string[];
}
