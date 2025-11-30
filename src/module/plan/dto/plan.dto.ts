import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import { BillingCycle, PlanType } from '../const/plan.const';

export class PlanDto extends BaseDto {
  @ApiProperty({ description: 'Tên gói' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ description: 'Mô tả gói', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Giá gói' })
  @IsNumber()
  @Min(0)
  @Expose()
  price: number;

  @ApiProperty({ description: 'Số ngày hiệu lực' })
  @IsInt()
  @Min(1)
  @Expose()
  durationDays: number;

  @ApiProperty({ description: 'Stripe Product ID' })
  @IsString()
  @Expose()
  stripeProductId: string;

  @ApiProperty({ description: 'Stripe Price ID' })
  @IsString()
  @Expose()
  stripePriceId: string;

  @ApiProperty({ description: 'Chu kỳ thanh toán', enum: BillingCycle })
  @IsEnum(BillingCycle)
  @Expose()
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Loại gói', enum: PlanType })
  @IsEnum(PlanType)
  @Expose()
  planType: PlanType;

  @ApiProperty({ description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @Expose()
  isActive: boolean;
}

export class CreatePlanDto extends OmitType(PlanDto, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
]) {}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
