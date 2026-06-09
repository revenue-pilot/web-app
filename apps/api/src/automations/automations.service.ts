import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GoogleAdsService } from '../integrations/google-ads.service';
import { MetaAdsService } from '../integrations/meta-ads.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationTriggerService } from './services/automation-trigger.service';
import { QueueService } from '../jobs/queue.service';

@Injectable()
export class AutomationsService implements OnModuleInit {
  private readonly logger = new Logger(AutomationsService.name);
  private queueService: QueueService;

  constructor(
    private googleAds: GoogleAdsService,
    private metaAds: MetaAdsService,
    private prisma: PrismaService,
    private triggerService: AutomationTriggerService,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.queueService = this.moduleRef.get(QueueService, { strict: false });
  }

  // Run to evaluate rules (invoked via QueueService worker)
  async evaluateRules() {
    this.logger.log('Evaluating Automation Rules...');
    
    const campaignsToEvaluate: any[] = [];
    
    // Fetch active accounts instead of using hardcoded mock accounts
    try {
      const googleAccounts = await this.prisma.client.adAccount.findMany({ 
        where: { platform: 'GOOGLE_ADS', status: 'ACTIVE' } 
      });
      for (const account of googleAccounts) {
        try {
          const campaigns = await this.googleAds.getCampaigns(account.id);
          campaignsToEvaluate.push(...campaigns);
        } catch (e) {
          this.logger.warn(`Could not fetch Google campaigns for ${account.id}: ${e.message}`);
        }
      }

      const metaAccounts = await this.prisma.client.adAccount.findMany({ 
        where: { platform: 'META_ADS', status: 'ACTIVE' } 
      });
      for (const account of metaAccounts) {
        try {
          const campaigns = await this.metaAds.getCampaigns(account.id);
          campaignsToEvaluate.push(...campaigns);
        } catch (e) {
          this.logger.warn(`Could not fetch Meta campaigns for ${account.id}: ${e.message}`);
        }
      }
    } catch (e) {
      this.logger.error('Failed to fetch ad accounts for automation evaluation', e);
    }

    // Simulate an automation rule: "IF ROAS < 1.0 AND Spend > 500 THEN PAUSE"
    for (const campaign of campaignsToEvaluate) {
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

  async pollTriggers() {
    this.logger.log('Polling automation triggers...');
    const rules = await this.prisma.client.automationRule.findMany({
      where: { enabled: true },
    });

    const context = {
      now: new Date(),
      metrics: await this.prisma.client.campaignMetric.findMany({
         orderBy: { createdAt: 'desc' }
      }), // Simplified for MVP: would normally scope by org/campaign
      campaigns: await this.prisma.client.campaign.findMany(),
    };

    for (const rule of rules) {
      try {
        const isTriggered = await this.triggerService.evaluateRuleTriggers(rule.id, context);
        if (isTriggered) {
          this.logger.log(`Rule ${rule.id} triggered. Enqueueing execution.`);
          if (this.queueService) {
            await this.queueService.queueAutomationRule(rule.id, { triggerSource: 'POLLING', triggeredBy: 'SYSTEM' });
          }
        }
      } catch (e) {
        this.logger.error(`Failed to evaluate triggers for rule ${rule.id}`, e);
      }
    }
  }
}
