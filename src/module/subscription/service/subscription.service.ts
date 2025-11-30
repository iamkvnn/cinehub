import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { SubscriptionEntity } from '../entity/subscription.entity';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from '../dto/subscription.dto';
import { SubscriptionStatus } from '../const/subscription.const';
import { PlanService } from 'src/module/plan/service/plan.service';
import { UserService } from 'src/module/user/service/user.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly planService: PlanService,
    private readonly userService: UserService,
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
}
