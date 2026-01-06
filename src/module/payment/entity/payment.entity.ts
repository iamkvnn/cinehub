import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base/base.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { PlanEntity } from 'src/module/plan/entity/plan.entity';
import { SubscriptionEntity } from 'src/module/subscription/entity/subscription.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class PaymentEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: SubscriptionEntity;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => PlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: PlanEntity;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ nullable: true })
  stripeChargeId?: string;

  @Column({ nullable: true })
  stripeSessionId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
