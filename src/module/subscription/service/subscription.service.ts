import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionEntity } from '../entity/subscription.entity';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from '../dto/subscription.dto';
import { SubscriptionStatus } from '../const/subscription.const';
import { PlanService } from 'src/module/plan/service/plan.service';
import { UserService } from 'src/module/user/service/user.service';
import { StripeService } from 'src/module/stripe/stripe.service';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event/notification.events';
import type {
  SubscriptionEventPayload,
  AdminSubscriptionEventPayload,
} from 'src/module/notification/dto/event-payload.dto';
import {
  PlanType,
  isUpgrade,
  isDowngrade,
} from 'src/module/plan/const/plan.const';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly stripeService: StripeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    query: PaginatedApiQuery,
  ): Promise<[SubscriptionEntity[], number]> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan');

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`subscription.${key}`, value);
      });
    }

    const [subscriptions, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [subscriptions, count];
  }

  async findById(id: string): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
    });
    if (!subscription) {
      throw new NotFoundException('Subscription không tồn tại');
    }
    return subscription;
  }

  async findByUserId(userId: string): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByUserId(userId: string): Promise<SubscriptionEntity | null> {
    const now = new Date();
    return this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['plan'],
    });
  }

  async createSubscription(
    createDto: CreateSubscriptionDto,
  ): Promise<SubscriptionEntity> {
    // Validate user exists
    await this.userService.findById(createDto.userId);

    // Validate plan exists
    const newPlan = await this.planService.findById(createDto.planId);

    // Check if user already has active subscription
    const activeSubscription = await this.findActiveByUserId(createDto.userId);
    if (activeSubscription) {
      const currentPlanType = activeSubscription.plan?.planType;

      // Check if this is an upgrade
      if (currentPlanType && isUpgrade(currentPlanType, newPlan.planType)) {
        // Cancel current subscription (both FREE and paid)
        if (activeSubscription.stripeSubscriptionId) {
          // Cancel paid subscription on Stripe
          try {
            await this.stripeService.cancelSubscription(
              activeSubscription.stripeSubscriptionId,
            );
            console.log(
              `Cancelled Stripe subscription ${activeSubscription.stripeSubscriptionId} for upgrade`,
            );
          } catch (error) {
            console.error(
              'Failed to cancel Stripe subscription for upgrade:',
              error,
            );
          }
        }

        activeSubscription.status = SubscriptionStatus.CANCELLED;
        activeSubscription.cancelledAt = new Date();
        await this.subscriptionRepository.save(activeSubscription);
        console.log(
          `Auto-cancelled ${currentPlanType} subscription for user ${createDto.userId} due to upgrade to ${newPlan.planType}`,
        );
      } else if (currentPlanType === newPlan.planType) {
        throw new BadRequestException('Bạn đang sử dụng gói này rồi.');
      } else {
        throw new BadRequestException(
          'Bạn đã có gói đăng ký đang hoạt động. Vui lòng hủy hoặc hạ cấp gói hiện tại trước.',
        );
      }
    }

    const subscription = this.subscriptionRepository.create({
      ...createDto,
      status: createDto.status || SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async updateSubscription(
    id: string,
    updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionEntity> {
    const subscription = await this.findById(id);
    Object.assign(subscription, updateDto);
    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: string): Promise<SubscriptionEntity> {
    const subscription = await this.findById(id);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Gói đăng ký này đã bị hủy trước đó.');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();

    return this.subscriptionRepository.save(subscription);
  }

  async deleteSubscription(id: string): Promise<void> {
    const subscription = await this.findById(id);
    await this.subscriptionRepository.softDelete(subscription.id);
  }

  async checkAndExpireSubscriptions(): Promise<void> {
    const now = new Date();
    await this.subscriptionRepository
      .createQueryBuilder()
      .update(SubscriptionEntity)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('endDate < :now', { now })
      .execute();
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.findActiveByUserId(userId);
    return subscription !== null;
  }

  /**
   * Tạo subscription FREE cho user mới đăng ký
   * Không cần Stripe, subscription vĩnh viễn cho đến khi upgrade
   */
  async createFreeSubscription(
    userId: string,
  ): Promise<SubscriptionEntity | null> {
    // Tìm gói FREE
    const freePlan = await this.planService.findFreePlan();
    if (!freePlan) {
      console.warn('FREE plan not found, skipping free subscription creation');
      return null;
    }

    // Kiểm tra user đã có subscription chưa
    const existingSubscription = await this.findActiveByUserId(userId);
    if (existingSubscription) {
      console.log(
        `User ${userId} already has active subscription, skipping free subscription`,
      );
      return null;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + freePlan.durationDays);

    const subscription = this.subscriptionRepository.create({
      userId,
      planId: freePlan.id,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      // Không có stripeSubscriptionId vì FREE không qua Stripe
    });

    const saved = await this.subscriptionRepository.save(subscription);
    console.log(`Created FREE subscription for user ${userId}`);
    return saved;
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
      relations: ['plan', 'user'],
    });
  }

  /**
   * Cancel subscription for the current user
   * Cancels Stripe subscription at period end (user continues to use until endDate)
   * Note: User không thể hủy gói FREE
   */
  async cancelMySubscription(userId: string): Promise<SubscriptionEntity> {
    const subscription = await this.findActiveByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy gói đăng ký đang hoạt động.');
    }

    // Không cho phép hủy gói FREE
    if (subscription.plan?.planType === PlanType.FREE) {
      throw new ForbiddenException(
        'Không thể hủy gói Miễn phí. Bạn có thể nâng cấp lên gói cao hơn.',
      );
    }

    // Kiểm tra nếu đã hủy gia hạn rồi
    if (subscription.cancelledAt) {
      throw new BadRequestException(
        'Gói đăng ký đã được hủy gia hạn. Bạn vẫn có thể sử dụng đến hết hạn.',
      );
    }

    // Cancel on Stripe at period end (user continues to use until endDate)
    if (subscription.stripeSubscriptionId) {
      try {
        await this.stripeService.cancelSubscriptionAtPeriodEnd(
          subscription.stripeSubscriptionId,
        );
      } catch (error) {
        console.error(
          'Failed to cancel Stripe subscription at period end:',
          error,
        );
        // Continue to mark as cancelled in database even if Stripe fails
      }
    }

    // Giữ status ACTIVE để user tiếp tục sử dụng đến hết endDate
    // Chỉ đánh dấu cancelledAt để biết đã hủy gia hạn
    subscription.cancelledAt = new Date();

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // Emit subscription.cancelled event
    const payload: SubscriptionEventPayload = {
      subscriptionId: savedSubscription.id,
      userId: savedSubscription.userId,
      planId: savedSubscription.planId,
      planName: subscription.plan?.name || 'Unknown',
      expiryDate: subscription.endDate,
      timestamp: new Date(),
      triggeredBy: userId,
    };

    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_CANCELLED,
      payload,
    );

    // Emit admin notification for subscription cancelled
    const user = await this.userService.findById(userId);
    const adminPayload: AdminSubscriptionEventPayload = {
      userId: savedSubscription.userId,
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || '',
      planId: savedSubscription.planId,
      planName: subscription.plan?.name || 'Unknown',
      subscriptionId: savedSubscription.id,
      timestamp: new Date(),
      triggeredBy: userId,
    };

    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.ADMIN_USER_UNSUBSCRIBED,
      adminPayload,
    );

    return savedSubscription;
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  async getSubscriptionStats(): Promise<{
    totalActive: number;
    totalCancelled: number;
    totalExpired: number;
    totalPending: number;
    byPlan: { planId: string; planName: string; count: number }[];
  }> {
    const stats = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('subscription.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('subscription.status')
      .getRawMany();

    const byPlan = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoin('subscription.plan', 'plan')
      .select('subscription.planId', 'planId')
      .addSelect('plan.name', 'planName')
      .addSelect('COUNT(*)', 'count')
      .where('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .groupBy('subscription.planId')
      .addGroupBy('plan.name')
      .getRawMany();

    const getCount = (status: SubscriptionStatus) => {
      const found = stats.find((s) => s.status === status);
      return found ? parseInt(found.count, 10) : 0;
    };

    return {
      totalActive: getCount(SubscriptionStatus.ACTIVE),
      totalCancelled: getCount(SubscriptionStatus.CANCELLED),
      totalExpired: getCount(SubscriptionStatus.EXPIRED),
      totalPending: getCount(SubscriptionStatus.PENDING),
      byPlan: byPlan.map((p) => ({
        planId: p.planId,
        planName: p.planName,
        count: parseInt(p.count, 10),
      })),
    };
  }

  /**
   * Find subscriptions expiring within X days
   */
  async findExpiringSubscriptions(days: number): Promise<SubscriptionEntity[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: Between(now, futureDate),
      },
      relations: ['plan', 'user'],
    });
  }

  /**
   * Find subscriptions that are ACTIVE but past their endDate (should be expired)
   * Used by cron job to expire subscriptions and create FREE subscription for cancelled ones
   */
  async findExpiredActiveSubscriptions(): Promise<SubscriptionEntity[]> {
    const now = new Date();

    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(now),
      },
      relations: ['plan', 'user'],
    });
  }

  /**
   * Find all subscriptions with filters for admin
   */
  async findAllAdmin(query: {
    page: number;
    limit: number;
    status?: SubscriptionStatus;
    planId?: string;
    search?: string;
  }): Promise<[SubscriptionEntity[], number]> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan');

    if (query.status) {
      qb.andWhere('subscription.status = :status', { status: query.status });
    }

    if (query.planId) {
      qb.andWhere('subscription.planId = :planId', { planId: query.planId });
    }

    if (query.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('subscription.createdAt', 'DESC');

    return qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
  }

  /**
   * Upgrade subscription to a higher tier plan
   * Returns checkout URL for payment
   */
  async upgradeSubscription(
    userId: string,
    newPlanId: string,
  ): Promise<{ url: string }> {
    const currentSubscription = await this.findActiveByUserId(userId);
    if (!currentSubscription) {
      throw new NotFoundException('Không tìm thấy gói đăng ký đang hoạt động.');
    }

    const currentPlan = currentSubscription.plan;
    if (!currentPlan) {
      throw new BadRequestException('Không thể xác định gói hiện tại.');
    }

    const newPlan = await this.planService.findById(newPlanId);

    // Validate upgrade
    if (!isUpgrade(currentPlan.planType, newPlan.planType)) {
      throw new BadRequestException(
        `Không thể nâng cấp từ gói ${currentPlan.name} lên gói ${newPlan.name}. Vui lòng chọn gói cao hơn.`,
      );
    }

    // Get user for Stripe
    const user = await this.userService.findById(userId);

    // Create Stripe checkout session
    // Note: createSubscription will auto-cancel FREE subscription when webhook processes
    const session = await this.stripeService.createCheckoutSession({
      priceId: newPlan.stripePriceId,
      quantity: 1,
      customerId: user.stripeCustomerId,
      userId,
      planId: newPlan.id,
    });

    return { url: session.url as string };
  }

  /**
   * Downgrade subscription to a lower tier plan
   * Takes effect at the end of current billing period
   */
  async downgradeSubscription(
    userId: string,
    newPlanId: string,
  ): Promise<SubscriptionEntity> {
    const currentSubscription = await this.findActiveByUserId(userId);
    if (!currentSubscription) {
      throw new NotFoundException('Không tìm thấy gói đăng ký đang hoạt động.');
    }

    const currentPlan = currentSubscription.plan;
    if (!currentPlan) {
      throw new BadRequestException('Không thể xác định gói hiện tại.');
    }

    // Cannot downgrade FREE subscription
    if (currentPlan.planType === PlanType.FREE) {
      throw new ForbiddenException('Gói Miễn phí không thể hạ cấp.');
    }

    const newPlan = await this.planService.findById(newPlanId);

    // Validate downgrade
    if (!isDowngrade(currentPlan.planType, newPlan.planType)) {
      throw new BadRequestException(
        `Không thể hạ cấp từ gói ${currentPlan.name} xuống gói ${newPlan.name}. Vui lòng chọn gói thấp hơn.`,
      );
    }

    // Cancel Stripe subscription at period end (if exists)
    if (currentSubscription.stripeSubscriptionId) {
      try {
        await this.stripeService.cancelSubscriptionAtPeriodEnd(
          currentSubscription.stripeSubscriptionId,
        );
      } catch (error) {
        console.error(
          'Failed to cancel Stripe subscription at period end:',
          error,
        );
      }
    }

    // Save scheduled plan change
    currentSubscription.scheduledPlanId = newPlanId;
    currentSubscription.scheduledChangeAt = currentSubscription.endDate;

    const savedSubscription =
      await this.subscriptionRepository.save(currentSubscription);

    // Emit downgrade scheduled event
    const payload: SubscriptionEventPayload = {
      subscriptionId: savedSubscription.id,
      userId: savedSubscription.userId,
      planId: newPlanId,
      planName: newPlan.name,
      expiryDate: currentSubscription.endDate,
      timestamp: new Date(),
      triggeredBy: userId,
    };

    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_DOWNGRADE_SCHEDULED,
      payload,
    );

    return savedSubscription;
  }

  /**
   * Cancel a scheduled downgrade
   */
  async cancelScheduledDowngrade(userId: string): Promise<SubscriptionEntity> {
    const subscription = await this.findActiveByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Không tìm thấy gói đăng ký đang hoạt động.');
    }

    if (!subscription.scheduledPlanId) {
      throw new BadRequestException('Bạn chưa có lịch hạ cấp nào để hủy.');
    }

    // Reactivate Stripe subscription if it was set to cancel
    if (subscription.stripeSubscriptionId) {
      try {
        await this.stripeService.reactivateSubscription(
          subscription.stripeSubscriptionId,
        );
      } catch (error) {
        console.error('Failed to reactivate Stripe subscription:', error);
      }
    }

    // Clear scheduled change - use null explicitly for database
    subscription.scheduledPlanId = null as any;
    subscription.scheduledChangeAt = null as any;

    const saved = await this.subscriptionRepository.save(subscription);

    // Reload to get fresh data with plan relation
    return this.findActiveByUserId(userId) as Promise<SubscriptionEntity>;
  }

  /**
   * Process scheduled subscription changes (run by cron job)
   * Creates new subscription when downgrade takes effect
   */
  async processScheduledChanges(): Promise<void> {
    const now = new Date();

    // Find subscriptions with scheduled changes that should take effect now
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        scheduledChangeAt: LessThanOrEqual(now),
      },
      relations: ['plan'],
    });

    for (const subscription of subscriptions) {
      if (!subscription.scheduledPlanId) continue;

      try {
        // Mark current subscription as expired
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);

        // Get the scheduled plan
        const newPlan = await this.planService.findById(
          subscription.scheduledPlanId,
        );

        if (newPlan.planType === PlanType.FREE) {
          // Create FREE subscription
          await this.createFreeSubscription(subscription.userId);
        } else {
          // For paid plan downgrade, they need to pay again
          // Just notify user that their subscription has expired
          console.log(
            `Subscription ${subscription.id} expired, user needs to subscribe to ${newPlan.name}`,
          );
        }
      } catch (error) {
        console.error(
          `Failed to process scheduled change for subscription ${subscription.id}:`,
          error,
        );
      }
    }
  }
}
