import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAdsService: GoogleAdsService,
    private readonly metaAdsService: MetaAdsService,
  ) {}

  // ---------- Provider Sync Jobs ----------
  async handleGoogleCampaignSync(data: { accountId: string }) {
    this.logger.log('Starting Google Ads campaign sync', data);
    const campaigns = await this.googleAdsService.getCampaigns(data.accountId);

    for (const campaign of campaigns) {
      await this.googleAdsService.getAdGroups(data.accountId, campaign.id);
      await this.googleAdsService.getKeywords(data.accountId, campaign.id);
      await this.googleAdsService.getCampaignMetrics(data.accountId, campaign.id);
    }

    this.logger.log(`Completed Google Ads campaign sync for ${data.accountId}.`);
  }

  async handleGoogleMetricsSync(data: { accountId: string; campaignId?: string }) {
    this.logger.log('Starting Google Ads metrics sync', data);
    if (data.campaignId) {
      await this.googleAdsService.getCampaignMetrics(data.accountId, data.campaignId);
    } else {
      const campaigns = await this.googleAdsService.getCampaigns(data.accountId);
      for (const campaign of campaigns) {
        await this.googleAdsService.getCampaignMetrics(data.accountId, campaign.id);
      }
    }
    this.logger.log('Completed Google Ads metrics sync.');
  }

  async handleMetaCampaignSync(data: { accountId: string }) {
    this.logger.log('Starting Meta Ads campaign sync', data);
    const campaigns = await this.metaAdsService.getCampaigns(data.accountId);

    for (const campaign of campaigns) {
      const adSets = await this.metaAdsService.getAdSets(campaign.id, data.accountId);
      for (const adSet of adSets) {
        await this.metaAdsService.getAds(adSet.id, data.accountId);
      }
      await this.metaAdsService.getInsights(campaign.id, data.accountId);
    }

    this.logger.log(`Completed Meta Ads campaign sync for ${data.accountId}.`);
  }

  async handleMetaMetricsSync(data: { accountId: string; campaignId?: string }) {
    this.logger.log('Starting Meta Ads metrics sync', data);
    if (data.campaignId) {
      await this.metaAdsService.getInsights(data.campaignId, data.accountId);
    } else {
      const campaigns = await this.metaAdsService.getCampaigns(data.accountId);
      for (const campaign of campaigns) {
        await this.metaAdsService.getInsights(campaign.id, data.accountId);
      }
    }
    this.logger.log('Completed Meta Ads metrics sync.');
  }

  // ---------- Bulk Operation Jobs ----------
  async handleBulkCreateCampaigns(data: any) {
    this.logger.log('Bulk creating campaigns', data);
    for (const campaign of Array.isArray(data) ? data : [data]) {
      await this.prisma.client.campaign.create({
        data: {
          organizationId: campaign.organizationId,
          adAccountId: campaign.adAccountId,
          name: campaign.name,
          source: campaign.source || 'INTERNAL',
          providerCampaignId: campaign.providerCampaignId,
          providerAccountId: campaign.providerAccountId,
          status: campaign.status || 'ACTIVE',
          budget: campaign.budget,
          objective: campaign.objective,
        },
      });
    }
  }

  async handleBulkUpdateCampaigns(data: any) {
    this.logger.log('Bulk updating campaigns', data);
    for (const campaign of Array.isArray(data) ? data : [data]) {
      if (!campaign.id) {
        continue;
      }
      await this.prisma.client.campaign.update({
        where: { id: campaign.id },
        data: {
          name: campaign.name,
          status: campaign.status,
          budget: campaign.budget,
          objective: campaign.objective,
        },
      });
    }
  }

  async handleBulkDeleteCampaigns(data: any) {
    this.logger.log('Bulk deleting (soft delete) campaigns', data);
    for (const id of Array.isArray(data) ? data : [data]) {
      await this.prisma.client.campaign.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }
  }

  // ---------- Health Score Calculation ----------
  async handleHealthScoreCalculation(data: any) {
    this.logger.log('Calculating health scores for campaigns', data);
    const campaigns = await this.prisma.client.campaign.findMany({
      where: { organizationId: data.organizationId },
      include: { metrics: true },
    });

    for (const campaign of campaigns) {
      const totalSpend = campaign.metrics.reduce((acc, metric) => acc + Number(metric.spend || 0), 0);
      const totalRevenue = campaign.metrics.reduce((acc, metric) => acc + Number(metric.revenue || 0), 0);
      const averageRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const performanceScore = Math.min(100, Math.round(averageRoas * 20));
      const deliveryScore = campaign.metrics.length > 0 ? 90 : 50;
      const optimizationScore = campaign.metrics.length > 0 ? 85 : 55;
      const overallHealthScore = Math.round((performanceScore + deliveryScore + optimizationScore) / 3);

      await this.prisma.client.campaign.update({
        where: { id: campaign.id },
        data: {
          performanceScore,
          deliveryScore,
          optimizationScore,
          overallHealthScore,
        },
      });
    }
  }

  // ---------- Automation Action Methods ----------
  async handlePauseCampaign(campaignId: string) {
    this.logger.log(`Pausing campaign ${campaignId}`);
    await this.prisma.client.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });
  }

  async handleEnableCampaign(campaignId: string) {
    this.logger.log(`Enabling campaign ${campaignId}`);
    await this.prisma.client.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });
  }

  async handleUpdateBudget(campaignId: string, budget: number) {
    this.logger.log(`Updating budget for campaign ${campaignId} to ${budget}`);
    await this.prisma.client.campaign.update({
      where: { id: campaignId },
      data: { budget },
    });
  }
}
