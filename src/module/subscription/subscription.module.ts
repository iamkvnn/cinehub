import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from './entity/subscription.entity';
import { SubscriptionController } from './controller/subscription.controller';
import { AdminSubscriptionController } from './controller/admin-subscription.controller';
import { SubscriptionService } from './service/subscription.service';
import { SubscriptionCronService } from './cron/subscription.cron';
import { PlanModule } from '../plan/plan.module';
import { UserModule } from '../user/user.module';
import { StripeModule } from '../stripe/stripe.module';
import { TestSubscriptionController } from './controller/test-subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity]),
    PlanModule,
    forwardRef(() => UserModule),
    StripeModule,
  ],
  controllers: [
    SubscriptionController,
    AdminSubscriptionController,
    TestSubscriptionController,
  ],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
