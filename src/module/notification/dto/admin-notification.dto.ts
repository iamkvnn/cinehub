import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdminNotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export class AdminSendNotificationDto {
  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'New Update',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Nội dung thông báo',
    example: 'A new feature has been released!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Loại thông báo',
    enum: AdminNotificationType,
    example: AdminNotificationType.INFO,
    required: false,
    default: AdminNotificationType.INFO,
  })
  @IsEnum(AdminNotificationType)
  @IsOptional()
  type?: AdminNotificationType;

  @ApiProperty({
    description: 'Metadata bổ sung',
    example: { action: 'click_here' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class AdminHistoryQueryDto {
  @ApiProperty({
    description: 'Số trang',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Loại thông báo',
    enum: AdminNotificationType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminNotificationType)
  type?: AdminNotificationType;

  @ApiProperty({
    description: 'ID người nhận',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;
}

export class AdminUsersQueryDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên hoặc email)',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Số trang',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
