import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from 'src/module/subscription/service/subscription.service';
import { PlanType } from 'src/module/plan/const/plan.const';

export const REQUIRED_PLANS_KEY = 'requiredPlans';

/**
 * Guard kiểm tra user có plan phù hợp không
 * Sử dụng với decorator @RequiredPlans()
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy các plan được phép từ decorator
    const requiredPlans = this.reflector.getAllAndOverride<PlanType[]>(
      REQUIRED_PLANS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không set required plans, cho phép tất cả
    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId =
      request.user?.userId || request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User không xác định');
    }

    // Lấy subscription active của user
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      // Nếu không có subscription, kiểm tra xem FREE có được phép không
      if (requiredPlans.includes(PlanType.FREE)) {
        return true;
      }
      throw new ForbiddenException(
        'Bạn cần nâng cấp gói để truy cập tính năng này',
      );
    }

    // Kiểm tra plan của user có trong danh sách được phép không
    const userPlanType = subscription.plan?.planType;
    if (!requiredPlans.includes(userPlanType)) {
      throw new ForbiddenException(
        `Tính năng này yêu cầu gói: ${requiredPlans.join(', ')}. Gói hiện tại của bạn: ${userPlanType}`,
      );
    }

    // Attach subscription vào request để sử dụng sau
    request.subscription = subscription;

    return true;
  }
}
