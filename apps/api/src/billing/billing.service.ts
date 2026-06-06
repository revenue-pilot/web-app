import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;
  private razorpayInstance: any = null;

  constructor(private prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is missing. Stripe checkout will run in simulated mode.');
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeyId && razorpayKeySecret) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Razorpay = require('razorpay');
        this.razorpayInstance = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });
      } catch (e) {
        this.logger.error('Failed to initialize Razorpay SDK', e);
      }
    } else {
      this.logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Razorpay will run in simulated mode.');
    }
  }

  async createStripeCheckout(email: string, planName: string, amount: number, origin: string) {
    if (!this.stripe) {
      this.logger.log(`[Simulated Stripe] Creating checkout session for ${email} - ${planName}`);
      return { success: true, url: `${origin}/dashboard/billing?status=success&simulated=stripe&plan=${planName}` };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `RevenuePilot - ${planName.toUpperCase()} Plan`,
                description: `Monthly subscription to RevenuePilot ${planName} features.`,
              },
              unit_amount: amount * 100, // convert to paise
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // or 'subscription' depending on price config
        success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success&plan=${planName}`,
        cancel_url: `${origin}/dashboard/billing?status=cancel`,
        customer_email: email,
        metadata: { email, planName },
      });
      return { success: true, url: session.url, sessionId: session.id };
    } catch (e) {
      this.logger.error('Failed to create Stripe checkout session', e);
      throw e;
    }
  }

  async createRazorpayOrder(email: string, planName: string, amount: number) {
    if (!this.razorpayInstance) {
      this.logger.log(`[Simulated Razorpay] Creating order for ${email} - ${planName}`);
      return { success: true, orderId: `order_sim_${Date.now()}`, amount: amount * 100, currency: 'INR' };
    }

    try {
      const order = await this.razorpayInstance.orders.create({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { email, planName },
      });
      return { success: true, orderId: order.id, amount: order.amount, currency: order.currency };
    } catch (e) {
      this.logger.error('Failed to create Razorpay order', e);
      throw e;
    }
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) return { status: 'ignored_no_sdk' };
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;
    try {
      if (secret && signature) {
        event = this.stripe.webhooks.constructEvent(payload, signature, secret);
      } else {
        event = JSON.parse(payload.toString());
      }
    } catch (e) {
      this.logger.error(`Stripe Webhook signature verification failed: ${e.message}`);
      throw new Error(`Webhook Error: ${e.message}`);
    }

    this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

    if (event.type === 'checkout.session.completed' || event.type === 'charge.succeeded') {
      const session = event.data.object as any;
      const email = session.metadata?.email || session.customer_details?.email;
      const planName = session.metadata?.planName || 'Revenue';

      if (email) {
        await this.upgradeUserSubscription(email, planName.toUpperCase(), session.id);
      }
    }

    return { status: 'success', type: event.type };
  }

  async handleRazorpayWebhook(body: any, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(JSON.stringify(body));
      const generated = hmac.digest('hex');
      if (generated !== signature) {
        this.logger.error('Razorpay webhook signature verification failed.');
        throw new Error('Invalid signature');
      }
    }

    const event = body.event;
    this.logger.log(`Received Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = body.payload.payment.entity;
      const orderId = payment.order_id;
      const email = payment.email;
      const notes = payment.notes || {};
      const planName = notes.planName || 'Revenue';

      if (email) {
        await this.upgradeUserSubscription(email, planName.toUpperCase(), orderId || payment.id);
      }
    }

    return { status: 'success', event };
  }

  private async upgradeUserSubscription(email: string, planName: string, gatewayId: string) {
    this.logger.log(`Upgrading subscription for user ${email} to ${planName} (ID: ${gatewayId})`);
    
    if (this.prisma.isConnected) {
      const user = await this.prisma.client.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        const sub = await this.prisma.client.subscription.findFirst({
          where: { organizationId: user.organizationId },
        });

        if (sub) {
          await this.prisma.client.subscription.update({
            where: { id: sub.id },
            data: {
              tier: planName as any,
              status: 'ACTIVE',
              gatewayPaymentId: gatewayId,
            },
          });
        } else {
          await this.prisma.client.subscription.create({
            data: {
              organizationId: user.organizationId,
              tier: planName as any,
              status: 'ACTIVE',
              gatewayPaymentId: gatewayId,
            },
          });
        }

        // Add Invoice entry
        const subUpdated = await this.prisma.client.subscription.findFirst({
          where: { organizationId: user.organizationId },
        });
        if (subUpdated) {
          const priceMap = { STARTER: 999, Revenue: 1999, PROFESSIONAL: 4999, ENTERPRISE: 15000 };
          await this.prisma.client.invoice.create({
            data: {
              subscriptionId: subUpdated.id,
              amount: priceMap[planName] || 1999,
              status: 'PAID',
              pdfUrl: `/api/invoices/download/${gatewayId}`,
            },
          });
        }
      }
    } else {
      throw new Error('Database unavailable. Cannot upgrade subscription without a live database.');
    }
  }
}
