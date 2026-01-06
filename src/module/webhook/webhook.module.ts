import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WebhookEntity } from './entity/webhook.entity';
import { WebhookService } from './service/webhook.service';
import { WebhookController } from './controller/webhook.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PlanModule } from '../plan/plan.module';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity]),
    ConfigModule,
    SubscriptionModule,
    PlanModule,
    forwardRef(() => PaymentModule),
    UserModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
