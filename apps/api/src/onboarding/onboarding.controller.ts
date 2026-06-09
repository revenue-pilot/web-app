import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BillingService } from '../billing/billing.service';

@UseGuards(JwtAuthGuard)
@Controller('api/onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly billingService: BillingService,
  ) {}

  @Get()
  getStatus(@Req() req: any) {
    return this.onboardingService.getOnboardingStatus(req.user.organizationId);
  }

  @Put('step')
  updateStep(@Req() req: any, @Body() body: any) {
    return this.onboardingService.updateStep(req.user.organizationId, body);
  }

  @Post('checkout')
  async createCheckout(@Req() req: any, @Body() body: { plan: string; amount: number }) {
    // Generate a Razorpay order using live integration from BillingService
    return this.billingService.createRazorpayOrder(req.user.email, body.plan, body.amount);
  }
}
