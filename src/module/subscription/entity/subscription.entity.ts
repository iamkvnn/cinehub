import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { PlanEntity } from 'src/module/plan/entity/plan.entity';
import { SubscriptionStatus } from '../const/subscription.const';

@Entity('subscriptions')
export class SubscriptionEntity extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.subscriptions)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  planId: string;

  @ManyToOne(() => PlanEntity, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: PlanEntity;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt?: Date;

  /**
   * Scheduled plan ID for downgrade (will take effect at endDate)
   */
  @Column({ nullable: true })
  scheduledPlanId?: string;

  /**
   * When the scheduled change will take effect
   */
  @Column({ type: 'datetime', nullable: true })
  scheduledChangeAt?: Date;
}
