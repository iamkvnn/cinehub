import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from 'src/module/subscription/service/subscription.service';

/**
 * Guard kiểm tra user có subscription active không
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.user?.userId || request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User không xác định');
    }

    const hasActive =
      await this.subscriptionService.hasActiveSubscription(userId);

    if (!hasActive) {
      throw new ForbiddenException(
        'Bạn cần có gói subscription để truy cập tính năng này',
      );
    }

    return true;
  }
}
