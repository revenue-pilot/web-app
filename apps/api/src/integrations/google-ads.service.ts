import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);

  async getCampaigns(accountId: string) {
    this.logger.log(`Fetching Google Ads campaigns for account ${accountId}`);
    // Mock response for MVP
    return [
      { id: 'g-1', name: 'Search - Competitors', spend: 1200, roas: 1.5, status: 'ENABLED' },
      { id: 'g-2', name: 'Performance Max - Q4', spend: 4500, roas: 3.2, status: 'ENABLED' }
    ];
  }

  async pauseCampaign(campaignId: string) {
    this.logger.log(`Paused Google Ads campaign ${campaignId}`);
    return { success: true, status: 'PAUSED' };
  }
}
