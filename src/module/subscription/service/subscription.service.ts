import {
  BadRequestException,
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
    await this.planService.findById(createDto.planId);

    // Check if user already has active subscription
    const activeSubscription = await this.findActiveByUserId(createDto.userId);
    if (activeSubscription) {
      throw new BadRequestException('User đã có subscription đang hoạt động');
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
      throw new BadRequestException('Subscription đã bị hủy trước đó');
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
   * Also cancels the Stripe subscription if exists
   */
  async cancelMySubscription(userId: string): Promise<SubscriptionEntity> {
    const subscription = await this.findActiveByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription đang hoạt động');
    }

    // Cancel on Stripe if there's a Stripe subscription
    if (subscription.stripeSubscriptionId) {
      try {
        await this.stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
        );
      } catch (error) {
        console.error('Failed to cancel Stripe subscription:', error);
        // Continue to cancel in database even if Stripe fails
      }
    }

    subscription.status = SubscriptionStatus.CANCELLED;
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
}
