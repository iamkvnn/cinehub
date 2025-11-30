import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { createApiResponse } from 'src/common/utils';
import { createApiResponseDto } from 'src/common/dto';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionDto } from '../dto/subscription.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';

@ApiTags('Subscriptions')
@Controller({
  path: 'subscriptions',
  version: '1',
})
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Lấy userId từ JWT payload
   */
  private getUserIdFromRequest(req: any): string {
    return req.user?.userId || req.user?.sub || req.user?.id;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy subscription của user hiện tại (từ token)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy subscription của user hiện tại',
    type: createApiResponseDto(SubscriptionDto),
  })
  async getMySubscription(@Req() req: any) {
    const userId = this.getUserIdFromRequest(req);
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);
    return createApiResponse(
      subscription
        ? plainToInstance(SubscriptionDto, subscription, {
            excludeExtraneousValues: true,
          })
        : null,
    );
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy subscription của user theo ID (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy subscription của user theo ID',
    type: createApiResponseDto(SubscriptionDto),
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getSubscriptionByUserId(@Param('userId') userId: string) {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);
    return createApiResponse(
      subscription
        ? plainToInstance(SubscriptionDto, subscription, {
            excludeExtraneousValues: true,
          })
        : null,
    );
  }
}
