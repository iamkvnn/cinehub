import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CheckoutLinkResponse } from './dto/response/checkout-link.response';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey')!;
    this.stripe = new Stripe(secretKey);
  }
  async createCustomer(cusomer: {
    email: string;
    name: string;
  }): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      email: cusomer.email,
      name: cusomer.name,
    });
  }
  async createCheckoutSession(data: {
    priceId: string;
    quantity: number;
    customerId: string;
    userId: string;
    planId: string;
  }): Promise<CheckoutLinkResponse> {
    const successUrl =
      process.env.CHECKOUT_SUCCESS_URL ||
      'http://localhost:3333/payment/success';
    const cancelUrl =
      process.env.CHECKOUT_CANCEL_URL || 'http://localhost:3333/payment/cancel';
    console.log(data);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: data.customerId,
      line_items: [
        {
          price: data.priceId,
          quantity: data.quantity,
        },
      ],
      metadata: {
        userId: data.userId,
        planId: data.planId,
      },
      subscription_data: {
        metadata: {
          userId: data.userId,
          planId: data.planId,
        },
      },
      success_url: process.env.FRONTEND_URL + '/billing',
      cancel_url: cancelUrl,
    });

    return {
      url: session.url!,
      id: session.id,
    };
  }

  /**
   * Cancel a Stripe subscription
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.cancel(subscriptionId);
  }
}
