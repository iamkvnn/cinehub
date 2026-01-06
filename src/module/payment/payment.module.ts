import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { AdminPaymentController } from './controller/admin-payment.controller';
import { PaymentService } from './service/payment.service';
import { PaymentEntity } from './entity/payment.entity';
import { StripeModule } from '../stripe/stripe.module';
import { PlanModule } from '../plan/plan.module';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    StripeModule,
    PlanModule,
    UserModule,
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [PaymentController, AdminPaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
