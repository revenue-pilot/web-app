import { Controller, Get, Post, Req, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { BillingService } from './billing/billing.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/health')
  getHealth() {
    return {
      status: this.prisma.isConnected ? 'OK' : 'DEGRADED',
      database: this.prisma.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    };
  }

  @Post('api/billing/webhook')
  async handleBillingWebhook(
    @Req() req: any,
    @Headers('stripe-signature') stripeSignature: string,
    @Headers('x-razorpay-signature') razorpaySignature: string,
  ) {
    if (stripeSignature) {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      return this.billing.handleStripeWebhook(rawBody, stripeSignature);
    } else if (razorpaySignature) {
      return this.billing.handleRazorpayWebhook(req.body, razorpaySignature);
    } else {
      const body = req.body;
      if (body && body.event === 'simulated.stripe') {
        const payload = Buffer.from(JSON.stringify(body));
        return this.billing.handleStripeWebhook(payload, '');
      } else if (body && body.event === 'simulated.razorpay') {
        return this.billing.handleRazorpayWebhook(body, '');
      }
      return { status: 'unsupported_webhook' };
    }
  }
}
