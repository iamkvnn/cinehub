import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { StripeModule } from '../stripe/stripe.module';
import { PlanModule } from '../plan/plan.module';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [StripeModule, PlanModule, UserModule, SubscriptionModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
