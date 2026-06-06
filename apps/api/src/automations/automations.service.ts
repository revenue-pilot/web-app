import { Injectable, Logger } from '@nestjs/common';
import { GoogleAdsService } from '../integrations/google-ads.service';
import { MetaAdsService } from '../integrations/meta-ads.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private googleAds: GoogleAdsService,
    private metaAds: MetaAdsService,
  ) {}

  // Run to evaluate rules (invoked via QueueService worker)
  async evaluateRules() {
    this.logger.log('Evaluating Automation Rules...');
    
    // Simulate fetching campaigns from networks
    const googleCampaigns = await this.googleAds.getCampaigns('account_1');
    const metaCampaigns = await this.metaAds.getCampaigns('account_2');

    // Simulate an automation rule: "IF ROAS < 1.0 AND Spend > 500 THEN PAUSE"
    for (const campaign of [...googleCampaigns, ...metaCampaigns]) {
      if (campaign.roas < 1.0 && campaign.spend > 500 && (campaign.status === 'ACTIVE' || campaign.status === 'ENABLED')) {
        this.logger.warn(`Rule triggered: Pausing underperforming campaign: ${campaign.name} (ROAS: ${campaign.roas})`);
        
        if (campaign.id.startsWith('g-')) {
          await this.googleAds.pauseCampaign(campaign.id);
        } else {
          await this.metaAds.pauseCampaign(campaign.id);
        }
      }
    }
    this.logger.log('Automation evaluation complete.');
  }
}
