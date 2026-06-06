import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { SubscriptionGuard } from '../subscription.guard';
import { Request } from 'express';

@Controller('api/campaigns')
@UseGuards(SubscriptionGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async getCampaigns(@Req() req: Request) {
    const email = (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
    return this.campaignsService.getCampaigns(email);
  }
}
