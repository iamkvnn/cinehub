import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebhookService } from '../service/webhook.service';
import { Public } from 'src/common/decorator';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService } from 'src/module/subscription/service/subscription.service';
import { PlanService } from 'src/module/plan/service/plan.service';
import { SubscriptionStatus } from 'src/module/subscription/const/subscription.const';
import { PaymentService } from 'src/module/payment/service/payment.service';
import { PaymentStatus } from 'src/module/payment/entity/payment.entity';
import { UserService } from 'src/module/user/service/user.service';
import { NOTIFICATION_EVENT_NAMES } from 'src/module/notification/event/notification.events';
import type {
  SubscriptionEventPayload,
  PaymentEventPayload,
  AdminSubscriptionEventPayload,
  AdminPaymentEventPayload,
} from 'src/module/notification/dto/event-payload.dto';

@ApiTags('Webhook')
@Controller({
  path: 'webhook',
  version: '1',
})
export class WebhookController {
  private stripe: Stripe;

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
    private readonly planService: PlanService,
    private readonly paymentService: PaymentService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey')!;
    this.stripe = new Stripe(secretKey);
  }

  @Post('stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );
    const rawBody = req.rawBody;

    if (!rawBody) {
      return { received: false, error: 'No raw body' };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret!,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return { received: false, error: 'Invalid signature' };
    }

    // Lưu webhook vào database
    await this.webhookService.saveWebhook({
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      payload: event.data.object,
    });

    console.log(`Stripe webhook received: ${event.type}`);

    // Xử lý các event quan trọng
    await this.handleStripeEvent(event);

    return { received: true };
  }

  /**
   * Xử lý các Stripe event
   */
  private async handleStripeEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Xử lý khi checkout session hoàn thành
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    console.log('Checkout session completed:', session.id);

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing userId or planId in session metadata');
      return;
    }

    // Note: Không cần gọi cancelFreeSubscriptionIfExists vì createSubscription
    // sẽ tự động cancel FREE subscription khi tạo paid subscription

    // Lấy thông tin plan để tính endDate
    const plan = await this.planService.findById(planId);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Tạo subscription (sẽ tự động cancel FREE nếu có)
    const subscription = await this.subscriptionService.createSubscription({
      userId,
      planId,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: session.customer as string,
    });

    // Tạo payment record
    // VND không có cents, các currency khác (USD, EUR) Stripe lưu theo cents
    const currency = session.currency?.toUpperCase() || 'VND';
    const isZeroDecimalCurrency = [
      'VND',
      'JPY',
      'KRW',
      'BIF',
      'CLP',
      'DJF',
      'GNF',
      'ISK',
      'KMF',
      'MGA',
      'PYG',
      'RWF',
      'UGX',
      'VUV',
      'XAF',
      'XOF',
      'XPF',
    ].includes(currency);
    const amount = isZeroDecimalCurrency
      ? session.amount_total || 0
      : (session.amount_total || 0) / 100;

    const payment = await this.paymentService.create({
      userId,
      planId,
      subscriptionId: subscription.id,
      amount,
      currency,
      status: PaymentStatus.SUCCESS,
      stripeSessionId: session.id,
      metadata: {
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
      },
    });

    // Emit subscription.activated event
    const subscriptionPayload: SubscriptionEventPayload = {
      subscriptionId: subscription.id,
      userId,
      planId,
      planName: plan.name,
      expiryDate: endDate,
      timestamp: new Date(),
      triggeredBy: userId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_ACTIVATED,
      subscriptionPayload,
    );

    // Emit payment.success event
    const paymentPayload: PaymentEventPayload = {
      paymentId: payment.id,
      userId,
      amount: payment.amount,
      currency: payment.currency,
      planName: plan.name,
      timestamp: new Date(),
      triggeredBy: userId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.PAYMENT_SUCCESS,
      paymentPayload,
    );

    // Emit admin notifications
    const user = await this.userService.findById(userId);
    const adminSubscriptionPayload: AdminSubscriptionEventPayload = {
      userId,
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || '',
      planId,
      planName: plan.name,
      amount: payment.amount,
      currency: payment.currency,
      subscriptionId: subscription.id,
      timestamp: new Date(),
      triggeredBy: userId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.ADMIN_USER_SUBSCRIBED,
      adminSubscriptionPayload,
    );

    const adminPaymentPayload: AdminPaymentEventPayload = {
      userId,
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || '',
      amount: payment.amount,
      currency: payment.currency,
      planName: plan.name,
      paymentId: payment.id,
      timestamp: new Date(),
      triggeredBy: userId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENT_NAMES.ADMIN_PAYMENT_RECEIVED,
      adminPaymentPayload,
    );

    console.log(`Subscription created for user ${userId} with plan ${planId}`);
  }

  /**
   * Xử lý khi subscription được tạo trên Stripe
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log('Subscription created on Stripe:', subscription.id);
    // Đã xử lý ở checkout.session.completed
  }

  /**
   * Xử lý khi subscription được cập nhật
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id);

    const existingSub =
      await this.subscriptionService.findByStripeSubscriptionId(
        subscription.id,
      );

    if (!existingSub) {
      console.log('Subscription not found in database');
      return;
    }

    // Cập nhật status dựa trên Stripe subscription status
    let status = existingSub.status;
    if (subscription.status === 'active') {
      status = SubscriptionStatus.ACTIVE;
    } else if (subscription.status === 'canceled') {
      status = SubscriptionStatus.CANCELLED;
    } else if (subscription.status === 'past_due') {
      status = SubscriptionStatus.EXPIRED;
    }

    await this.subscriptionService.updateSubscription(existingSub.id, {
      status,
    });
  }

  /**
   * Xử lý khi subscription bị xóa/hủy
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('Subscription deleted:', subscription.id);

    const existingSub =
      await this.subscriptionService.findByStripeSubscriptionId(
        subscription.id,
      );

    if (!existingSub) {
      console.log('Subscription not found in database');
      return;
    }

    await this.subscriptionService.updateSubscription(existingSub.id, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    });
  }
}
