import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import { SubscriptionStatus } from '../const/subscription.const';
import { PlanDto } from 'src/module/plan/dto/plan.dto';
import { UserDto } from 'src/module/user/dto/user.dto';

export class SubscriptionDto extends BaseDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Plan ID' })
  @IsUUID()
  @Expose()
  planId: string;

  @ApiProperty({ description: 'Ngày bắt đầu' })
  @IsDateString()
  @Expose()
  startDate: Date;

  @ApiProperty({ description: 'Ngày kết thúc' })
  @IsDateString()
  @Expose()
  endDate: Date;

  @ApiProperty({
    description: 'Trạng thái subscription',
    enum: SubscriptionStatus,
  })
  @IsEnum(SubscriptionStatus)
  @Expose()
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Stripe Subscription ID', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  stripeSubscriptionId?: string;

  @ApiProperty({ description: 'Stripe Customer ID', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  stripeCustomerId?: string;

  @ApiProperty({ description: 'Tự động gia hạn' })
  @IsBoolean()
  @Expose()
  autoRenew: boolean;

  @ApiProperty({ description: 'Ngày hủy', required: false })
  @IsDateString()
  @IsOptional()
  @Expose()
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Scheduled Plan ID for downgrade',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose()
  scheduledPlanId?: string;

  @ApiProperty({ description: 'Scheduled change date', required: false })
  @IsDateString()
  @IsOptional()
  @Expose()
  scheduledChangeAt?: Date;

  @ApiProperty({
    description: 'Thông tin user',
    type: () => UserDto,
    required: false,
  })
  @Type(() => UserDto)
  @Expose()
  user?: UserDto;

  @ApiProperty({
    description: 'Thông tin gói',
    type: () => PlanDto,
    required: false,
  })
  @Type(() => PlanDto)
  @Expose()
  plan?: PlanDto;
}

export class CreateSubscriptionDto extends OmitType(SubscriptionDto, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'cancelledAt',
  'user',
  'plan',
  'autoRenew',
]) {}

export class UpdateSubscriptionDto extends PartialType(
  OmitType(SubscriptionDto, [
    'id',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'userId',
    'planId',
    'user',
    'plan',
  ]),
) {}
