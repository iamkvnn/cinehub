import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionService } from '../service/subscription.service';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event/notification.events';
import type { SubscriptionEventPayload } from 'src/module/notification/dto/event-payload.dto';
import { SubscriptionStatus } from '../const/subscription.const';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Check for expiring subscriptions daily at 9:00 AM
   * Sends reminder notifications for subscriptions expiring within 3 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiringSubscriptions() {
    this.logger.log('Running expiring subscriptions check...');

    try {
      // Find subscriptions expiring in 3 days
      const expiringSubscriptions =
        await this.subscriptionService.findExpiringSubscriptions(3);

      this.logger.log(
        `Found ${expiringSubscriptions.length} expiring subscriptions`,
      );

      for (const subscription of expiringSubscriptions) {
        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        const payload: SubscriptionEventPayload = {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          planName: subscription.plan?.name || 'Unknown',
          expiryDate: subscription.endDate,
          daysRemaining,
          timestamp: new Date(),
        };

        this.eventEmitter.emit(
          NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_EXPIRING,
          payload,
        );

        this.logger.log(
          `Sent expiring notification for subscription ${subscription.id} (${daysRemaining} days remaining)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process expiring subscriptions: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check and expire past-due subscriptions daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions() {
    this.logger.log('Running expired subscriptions check...');

    try {
      // Find subscriptions that should be expired but still active
      const now = new Date();
      const expiredSubs =
        await this.subscriptionService.findExpiringSubscriptions(0);

      // Filter for already past endDate
      const pastDueSubs = expiredSubs.filter(
        (sub) => new Date(sub.endDate) < now,
      );

      this.logger.log(
        `Found ${pastDueSubs.length} past-due subscriptions to expire`,
      );

      for (const subscription of pastDueSubs) {
        // Update status to expired
        await this.subscriptionService.updateSubscription(subscription.id, {
          status: SubscriptionStatus.EXPIRED,
        });

        // Emit expired event
        const payload: SubscriptionEventPayload = {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          planName: subscription.plan?.name || 'Unknown',
          timestamp: new Date(),
        };

        this.eventEmitter.emit(
          NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_EXPIRED,
          payload,
        );

        this.logger.log(`Expired subscription ${subscription.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process expired subscriptions: ${error.message}`,
        error.stack,
      );
    }
  }
}
