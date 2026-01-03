import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { DatabaseModule } from './core/database/database.module';
import { HealthcheckModule } from './core/health/healthcheck.module';
import { FilmModule } from './module/film/film.module';
import { PosterModule } from './module/poster/poster.module';
import { AwsModule } from './module/aws/aws.module';
import { MediaModule } from './module/media/media.module';
import { WhistlesModule } from './module/whistles/whistles.module';
import { WatchHistoryModule } from './module/watch-history/watch-history.module';
import { PlanModule } from './module/plan/plan.module';
import { SubscriptionModule } from './module/subscription/subscription.module';
import { StripeModule } from './module/stripe/stripe.module';
import { PaymentModule } from './module/payment/payment.module';
import { WebhookModule } from './module/webhook/webhook.module';
import { CommentModule } from './module/comment/comment.module';
import { ReviewModule } from './module/review/review.module';
import { StreamModule } from './module/streaming/stream.module';
import { NotificationModule } from './module/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthcheckModule,
    FilmModule,
    AuthModule,
    UserModule,
    PosterModule,
    AwsModule,
    MediaModule,
    WhistlesModule,
    WatchHistoryModule,
    PlanModule,
    SubscriptionModule,
    StripeModule,
    PaymentModule,
    WebhookModule,
    CommentModule,
    ReviewModule,
    StreamModule,
    NotificationModule,
  ],
})
export class AppModule {}
