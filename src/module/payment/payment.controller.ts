import {
  BadRequestException,
  Body,
  Controller,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PlanService } from '../plan/service/plan.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckoutLinkResponse } from '../stripe/dto/response/checkout-link.response';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { UserService } from '../user/service/user.service';
import { SubscriptionService } from '../subscription/service/subscription.service';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller({
  path: 'payment',
  version: '1',
})
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Lấy userId từ JWT payload
   */
  private getUserIdFromRequest(req: any): string {
    return req.user?.userId || req.user?.sub || req.user?.id;
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tạo phiên thanh toán',
    description: 'Tạo link thanh toán Stripe cho gói subscription đã chọn',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          format: 'uuid',
          description: 'ID của gói cần thanh toán',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      required: ['planId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo link thanh toán thành công',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Link thanh toán Stripe',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Plan ID không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gói' })
  async createCheckoutSession(
    @Req() req: any,
    @Body('planId', ParseUUIDPipe) planId: string,
  ): Promise<CheckoutLinkResponse> {
    const userId = this.getUserIdFromRequest(req);

    // Kiểm tra user đã có subscription active chưa
    const hasActive =
      await this.subscriptionService.hasActiveSubscription(userId);
    if (hasActive) {
      throw new BadRequestException(
        'Bạn đã có gói subscription đang hoạt động. Vui lòng hủy gói hiện tại trước khi đăng ký gói mới.',
      );
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const plan = await this.planService.findById(planId);
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const checkoutLink = await this.stripeService.createCheckoutSession({
      priceId: plan.stripePriceId,
      quantity: 1,
      customerId: user.stripeCustomerId,
      userId: userId,
      planId: planId,
    });
    return checkoutLink;
  }
}
