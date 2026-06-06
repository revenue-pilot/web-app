import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  async getCampaigns(accountId: string) {
    this.logger.log(`Fetching Meta Ads campaigns for account ${accountId}`);
    // Mock response for MVP
    return [
      { id: 'm-1', name: 'Advantage+ Shopping', spend: 2300, roas: 4.1, status: 'ACTIVE' },
      { id: 'm-2', name: 'Retargeting EU', spend: 850, roas: 0.9, status: 'ACTIVE' }
    ];
  }

  async pauseCampaign(campaignId: string) {
    this.logger.log(`Paused Meta Ads campaign ${campaignId}`);
    return { success: true, status: 'PAUSED' };
  }
}
