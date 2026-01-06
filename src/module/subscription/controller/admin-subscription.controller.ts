import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { createApiResponseDto, PaginatedApiResponseDto } from 'src/common/dto';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionDto } from '../dto/subscription.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { AdminGuard } from 'src/common/guard/admin.guard';
import { SubscriptionStatus } from '../const/subscription.const';

@ApiTags('Admin - Subscriptions')
@Controller({
  path: 'admin/subscriptions',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả subscriptions (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
  })
  @ApiQuery({ name: 'planId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Danh sách subscriptions',
    type: PaginatedApiResponseDto,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: SubscriptionStatus,
    @Query('planId') planId?: string,
    @Query('search') search?: string,
  ) {
    const [subscriptions, total] = await this.subscriptionService.findAllAdmin({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      planId,
      search,
    });

    return createPaginatedApiResponse(
      subscriptions.map((sub) =>
        plainToInstance(SubscriptionDto, sub, {
          excludeExtraneousValues: true,
        }),
      ),
      total,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê subscriptions (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê subscriptions',
  })
  async getStats() {
    const stats = await this.subscriptionService.getSubscriptionStats();
    return createApiResponse(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết subscription (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết subscription',
    type: createApiResponseDto(SubscriptionDto),
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const subscription = await this.subscriptionService.findById(id);
    return createApiResponse(
      plainToInstance(SubscriptionDto, subscription, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
