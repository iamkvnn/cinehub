import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { BillingCycle, PlanType } from '../const/plan.const';
import { SubscriptionEntity } from 'src/module/subscription/entity/subscription.entity';

@Entity('plans')
export class PlanEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float' })
  price: number;

  @Column()
  durationDays: number;

  @Column()
  stripeProductId: string;

  @Column()
  stripePriceId: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.plan)
  subscriptions: SubscriptionEntity[];
}
