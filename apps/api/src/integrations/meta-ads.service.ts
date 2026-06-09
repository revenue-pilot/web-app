import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(private prisma: PrismaService) {
    this.appId = process.env.META_CLIENT_ID || '';
    this.appSecret = process.env.META_CLIENT_SECRET || '';
    this.redirectUri = process.env.META_REDIRECT_URI || '';

    if (!this.appId || !this.appSecret || !this.redirectUri) {
      throw new Error('Meta Ads configuration is missing. Set META_CLIENT_ID, META_CLIENT_SECRET, and META_REDIRECT_URI.');
    }
  }

  getAuthUrl(state: string) {
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&scope=ads_management,ads_read`;
  }

  async handleCallback(code: string, organizationId: string) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&client_secret=${this.appSecret}&code=${code}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Meta Ads OAuth callback failed');
      }

      await this.prisma.client.integrationCredential.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'META_ADS',
          },
        },
        create: {
          organizationId,
          provider: 'META_ADS',
          apiKey: data.access_token,
          metadataJson: { expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null },
        },
        update: {
          apiKey: data.access_token,
          metadataJson: { expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null },
        },
      });

      return true;
    } catch (e) {
      this.logger.error('Failed to get Meta Ads token', e);
      throw new BadRequestException('Failed to authenticate with Meta Ads');
    }
  }

  private async resolveAdAccount(accountId: string) {
    const adAccount = await this.prisma.client.adAccount.findFirst({
      where: {
        OR: [
          { id: accountId },
          { platformId: accountId },
        ],
      },
      include: { client: true },
    });

    if (!adAccount) {
      throw new Error(`Meta Ads account ${accountId} not found in database.`);
    }

    const credential = await this.prisma.client.integrationCredential.findUnique({
      where: {
        organizationId_provider: {
          organizationId: adAccount.client.organizationId,
          provider: 'META_ADS',
        },
      },
    });

    if (!credential?.apiKey) {
      throw new Error(`Meta Ads OAuth token missing for organization ${adAccount.client.organizationId}`);
    }

    const accountIdentifier = adAccount.platformId.startsWith('act_')
      ? adAccount.platformId
      : `act_${adAccount.platformId}`;

    return { adAccount, accessToken: credential.apiKey, accountIdentifier };
  }

  private async findAdAccountByPlatformId(platformId: string) {
    return this.prisma.client.adAccount.findFirst({
      where: { platformId },
    });
  }

  private async upsertAdAccountRecord(clientId: string, account: any) {
    const existing = await this.findAdAccountByPlatformId(account.id);
    if (existing) {
      return this.prisma.client.adAccount.update({
        where: { id: existing.id },
        data: {
          status: account.account_status?.toString() || 'ACTIVE',
        },
      });
    }

    return this.prisma.client.adAccount.create({
      data: {
        clientId,
        platform: 'META_ADS',
        platformId: account.id,
        status: account.account_status?.toString() || 'ACTIVE',
      },
    });
  }

  private async findCampaignByProviderId(providerCampaignId: string) {
    return this.prisma.client.campaign.findFirst({
      where: { providerCampaignId },
    });
  }

  private async upsertCampaignRecord(adAccount: any, campaignData: any) {
    const existingCampaign = await this.findCampaignByProviderId(campaignData.id);
    if (existingCampaign) {
      return this.prisma.client.campaign.update({
        where: { id: existingCampaign.id },
        data: {
          name: campaignData.name,
          status: campaignData.status || 'ACTIVE',
          objective: campaignData.objective || undefined,
        },
      });
    }

    return this.prisma.client.campaign.create({
      data: {
        organizationId: adAccount.client.organizationId,
        adAccountId: adAccount.id,
        name: campaignData.name,
        source: 'META_ADS',
        providerCampaignId: campaignData.id,
        providerAccountId: adAccount.platformId,
        status: campaignData.status || 'ACTIVE',
        objective: campaignData.objective || undefined,
      },
    });
  }

  private async createCampaignMetric(campaignId: string, metricData: any, date: Date) {
    return this.prisma.client.campaignMetric.create({
      data: {
        campaignId,
        date,
        spend: metricData.spend || 0,
        impressions: metricData.impressions || 0,
        clicks: metricData.clicks || 0,
        conversions: metricData.conversions || 0,
        revenue: metricData.revenue || 0,
        ctr: metricData.ctr || 0,
        cpc: metricData.cpc || 0,
        cpm: metricData.cpm || 0,
        roas: metricData.roas || 0,
        cpa: metricData.cpa || 0,
        cpl: metricData.cpl || 0,
      },
    });
  }

  private async findAdGroupByProviderId(providerAdGroupId: string) {
    return this.prisma.client.adGroup.findFirst({
      where: { providerAdGroupId },
    });
  }

  private async upsertAdGroupRecord(campaignId: string, adSetData: any) {
    const existing = await this.findAdGroupByProviderId(adSetData.id);
    if (existing) {
      return this.prisma.client.adGroup.update({
        where: { id: existing.id },
        data: {
          name: adSetData.name,
          status: adSetData.status || 'UNKNOWN',
          bid: adSetData.dailyBudget || 0,
        },
      });
    }

    return this.prisma.client.adGroup.create({
      data: {
        campaignId,
        name: adSetData.name,
        providerAdGroupId: adSetData.id,
        status: adSetData.status || 'UNKNOWN',
        bid: adSetData.dailyBudget || 0,
      },
    });
  }

  private async findCreativeByProviderId(providerCreativeId: string) {
    return this.prisma.client.creative.findFirst({
      where: { providerCreativeId },
    });
  }

  private async upsertCreativeRecord(adGroupId: string, adData: any) {
    const existing = await this.findCreativeByProviderId(adData.id);
    if (existing) {
      return this.prisma.client.creative.update({
        where: { id: existing.id },
        data: {
          headline: adData.name || undefined,
          description: adData.description || undefined,
          status: adData.status || 'UNKNOWN',
        },
      });
    }

    return this.prisma.client.creative.create({
      data: {
        adGroupId,
        providerCreativeId: adData.id,
        type: 'TEXT',
        headline: adData.name || undefined,
        description: adData.description || undefined,
        status: adData.status || 'UNKNOWN',
      },
    });
  }

  async getAdAccounts(accountId: string) {
    const { accessToken, adAccount } = await this.resolveAdAccount(accountId);
    const url = `https://graph.facebook.com/v18.0/${adAccount.platformId}/adaccounts?fields=id,name,account_status,timezone_id,currency&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch Meta ad accounts');
    }

    const accounts = (data.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      status: item.account_status,
      timeZone: item.timezone_id,
      currency: item.currency,
    }));

    for (const account of accounts) {
      await this.upsertAdAccountRecord(adAccount.client.id, account);
    }

    return accounts;
  }

  async getCampaigns(accountId: string) {
    this.logger.log(`Fetching Meta Ads campaigns for account ${accountId}`);
    const { accessToken, adAccount } = await this.resolveAdAccount(accountId);
    const url = `https://graph.facebook.com/v18.0/${adAccount.platformId}/campaigns?fields=id,name,status,objective,insights.time_range({\"since\":\"2024-01-01\",\"until\":\"2024-12-31\"}){spend,impressions,clicks,actions}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Graph API error');
    }

    return await Promise.all((data.data || []).map(async (item: any) => {
      const insights = item.insights?.data?.[0] || {};
      const spend = Number(insights.spend || 0);
      const revenue = Number((insights.actions || []).find((a: any) => a.action_type === 'purchase')?.value || 0);
      const campaign = await this.upsertCampaignRecord(adAccount, {
        id: item.id,
        name: item.name || '',
        status: item.status || 'UNKNOWN',
        objective: item.objective || '',
      });

      await this.createCampaignMetric(campaign.id, {
        spend,
        impressions: Number(insights.impressions || 0),
        clicks: Number(insights.clicks || 0),
        conversions: Number((insights.actions || []).find((a: any) => a.action_type === 'offsite_conversion')?.value || 0),
        revenue,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: 0,
        cpl: 0,
      }, new Date());

      return {
        id: item.id || '',
        name: item.name || '',
        objective: item.objective || '',
        status: item.status || 'UNKNOWN',
        spend,
        roas: spend > 0 ? revenue / spend : 0,
        insights,
      };
    }));
  }

  async getAdSets(campaignId: string, accountId: string) {
    this.logger.log(`Fetching Meta Ads ad sets for campaign ${campaignId}`);
    const { accessToken } = await this.resolveAdAccount(accountId);
    const campaign = await this.prisma.client.campaign.findFirst({
      where: { providerCampaignId: campaignId },
    });
    if (!campaign) {
      throw new Error(`Meta Ads campaign ${campaignId} not found in database.`);
    }

    const url = `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,name,status,daily_budget,campaign_id,insights{spend,impressions,clicks}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch Meta ad sets');
    }

    return await Promise.all((data.data || []).map(async (item: any) => {
      const insights = item.insights?.data?.[0] || {};
      const adGroup = await this.upsertAdGroupRecord(campaign.id, {
        id: item.id,
        name: item.name || '',
        status: item.status || 'UNKNOWN',
        dailyBudget: Number(item.daily_budget || 0),
      });

      await this.createCampaignMetric(campaign.id, {
        spend: Number(insights.spend || 0),
        impressions: Number(insights.impressions || 0),
        clicks: Number(insights.clicks || 0),
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
        cpa: 0,
        cpl: 0,
      }, new Date());

      return {
        id: item.id,
        name: item.name,
        status: item.status,
        dailyBudget: Number(item.daily_budget || 0),
        campaignId: item.campaign_id,
        insights,
      };
    }));
  }

  async getAds(adSetId: string, accountId: string) {
    this.logger.log(`Fetching Meta Ads ads for ad set ${adSetId}`);
    const { accessToken } = await this.resolveAdAccount(accountId);
    const adGroup = await this.prisma.client.adGroup.findFirst({
      where: { providerAdGroupId: adSetId },
    });
    if (!adGroup) {
      throw new Error(`Meta Ads ad set ${adSetId} not found in database.`);
    }

    const url = `https://graph.facebook.com/v18.0/${adSetId}/ads?fields=id,name,status,adset_id,insights{spend,impressions,clicks}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch Meta ads');
    }

    return await Promise.all((data.data || []).map(async (item: any) => {
      const creative = await this.upsertCreativeRecord(adGroup.id, {
        id: item.id,
        name: item.name || '',
        status: item.status || 'UNKNOWN',
      });

      return {
        id: item.id,
        name: item.name,
        status: item.status,
        adSetId: item.adset_id,
        insights: item.insights?.data?.[0] || {},
      };
    }));
  }

  async getInsights(campaignId: string, accountId: string) {
    const { accessToken } = await this.resolveAdAccount(accountId);
    const campaign = await this.prisma.client.campaign.findFirst({
      where: { providerCampaignId: campaignId },
    });
    if (!campaign) {
      throw new Error(`Meta Ads campaign ${campaignId} not found in database.`);
    }

    const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,clicks,spend,actions,reach,frequency,date_start,date_stop&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch Meta insights');
    }

    return await Promise.all((data.data || []).map(async (item: any) => {
      const spend = Number(item.spend || 0);
      const revenue = Number((item.actions || []).find((a: any) => a.action_type === 'purchase')?.value || 0);
      const metric = await this.createCampaignMetric(campaign.id, {
        spend,
        impressions: Number(item.impressions || 0),
        clicks: Number(item.clicks || 0),
        conversions: Number((item.actions || []).find((a: any) => a.action_type === 'offsite_conversion')?.value || 0),
        revenue,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: 0,
        cpl: 0,
      }, item.date_start ? new Date(item.date_start) : new Date());

      return {
        dateStart: item.date_start,
        dateStop: item.date_stop,
        impressions: Number(item.impressions || 0),
        clicks: Number(item.clicks || 0),
        spend,
        actions: item.actions || [],
        revenue,
        metricId: metric.id,
      };
    }));
  }

  async pauseCampaign(campaignId: string) {
    this.logger.log(`Pausing Meta Ads campaign ${campaignId}`);
    const dbCampaign = await this.prisma.client.campaign.findFirst({
      where: {
        OR: [
          { id: campaignId },
          { providerCampaignId: campaignId },
        ],
      },
      include: {
        adAccount: { include: { client: true } },
      },
    });

    if (!dbCampaign || !dbCampaign.adAccount) {
      this.logger.error(`Campaign ${campaignId} not found in database.`);
      return { success: false, status: 'ERROR', message: 'Campaign not found in database.' };
    }

    const { accessToken } = await this.resolveAdAccount(dbCampaign.adAccount.id);
    const url = `https://graph.facebook.com/v18.0/${dbCampaign.providerCampaignId || campaignId}`;
    const params = new URLSearchParams();
    params.append('status', 'PAUSED');
    params.append('access_token', accessToken);

    const res = await fetch(url, { method: 'POST', body: params });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Graph API update error');
    }

    await this.prisma.client.campaign.update({
      where: { id: dbCampaign.id },
      data: { status: 'PAUSED' },
    });

    return { success: true, status: 'PAUSED' };
  }
}

