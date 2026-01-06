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
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { AdminGuard } from 'src/common/guard/admin.guard';
import { PaymentService } from '../service/payment.service';
import { PaymentStatus } from '../entity/payment.entity';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';

@ApiTags('Admin - Payments')
@Controller({
  path: 'admin/payments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Danh sách giao dịch',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PaymentStatus,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const [payments, total] = await this.paymentService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return createPaginatedApiResponse(
      payments,
      total,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê giao dịch (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê giao dịch',
  })
  async getStats() {
    const stats = await this.paymentService.getPaymentStats();
    return createApiResponse(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết giao dịch (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết giao dịch',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.paymentService.findById(id);
    return createApiResponse(payment);
  }
}
