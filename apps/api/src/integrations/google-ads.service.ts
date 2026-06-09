import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAdsApi } from 'google-ads-api';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google Ads OAuth configuration is missing. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.');
    }

    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  getAuthUrl(state: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/adwords'],
      state,
    });
  }

  async handleCallback(code: string, organizationId: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      await this.prisma.client.integrationCredential.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'GOOGLE_ADS',
          },
        },
        create: {
          organizationId,
          provider: 'GOOGLE_ADS',
          apiKey: tokens.access_token,
          refreshToken: tokens.refresh_token,
          metadataJson: { expiresAt: tokens.expiry_date || Date.now() + 3600000 },
        },
        update: {
          apiKey: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          metadataJson: { expiresAt: tokens.expiry_date || Date.now() + 3600000 },
        },
      });
      return true;
    } catch (e) {
      this.logger.error('Failed to get Google Ads token', e);
      throw new BadRequestException('Failed to authenticate with Google Ads');
    }
  }

  private getGoogleAdsClient() {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured in the environment.');
    }

    return new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: developerToken,
    });
  }

  private async resolveCustomerClient(accountId: string) {
    const adAccount = await this.prisma.client.adAccount.findFirst({
      where: {
        OR: [
          { id: accountId },
          { platformId: accountId },
        ],
      },
      include: {
        client: true,
      },
    });

    if (!adAccount) {
      throw new Error(`Google Ads account ${accountId} not found in database.`);
    }

    const credential = await this.prisma.client.integrationCredential.findUnique({
      where: {
        organizationId_provider: {
          organizationId: adAccount.client.organizationId,
          provider: 'GOOGLE_ADS',
        },
      },
    });

    if (!credential?.refreshToken) {
      throw new Error(`Missing Google Ads OAuth refresh token for organization ${adAccount.client.organizationId}`);
    }

    const cleanCustomerId = adAccount.platformId.replace(/-/g, '');
    const customer = this.getGoogleAdsClient().Customer({
      customer_id: cleanCustomerId,
      refresh_token: credential.refreshToken,
    });

    return { customer, adAccount };
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
          budget: campaignData.budget || undefined,
          startDate: campaignData.startDate ? new Date(campaignData.startDate) : undefined,
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : undefined,
        },
      });
    }

    return this.prisma.client.campaign.create({
      data: {
        organizationId: adAccount.client.organizationId,
        adAccountId: adAccount.id,
        name: campaignData.name,
        source: 'GOOGLE_ADS',
        providerCampaignId: campaignData.id,
        providerAccountId: adAccount.platformId,
        status: campaignData.status || 'ACTIVE',
        objective: campaignData.objective || undefined,
        budget: campaignData.budget || 0,
        startDate: campaignData.startDate ? new Date(campaignData.startDate) : undefined,
        endDate: campaignData.endDate ? new Date(campaignData.endDate) : undefined,
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

  private async upsertAdGroupRecord(campaignId: string, adGroupData: any) {
    const existingAdGroup = await this.findAdGroupByProviderId(adGroupData.id);
    if (existingAdGroup) {
      return this.prisma.client.adGroup.update({
        where: { id: existingAdGroup.id },
        data: {
          name: adGroupData.name,
          status: adGroupData.status || 'UNKNOWN',
          bid: adGroupData.bid || 0,
        },
      });
    }

    return this.prisma.client.adGroup.create({
      data: {
        campaignId,
        name: adGroupData.name,
        providerAdGroupId: adGroupData.id,
        status: adGroupData.status || 'UNKNOWN',
        bid: adGroupData.bid || 0,
      },
    });
  }

  private async findKeyword(adGroupId: string, text: string) {
    return this.prisma.client.keyword.findFirst({
      where: {
        adGroupId,
        text,
      },
    });
  }

  private async upsertKeywordRecord(adGroupId: string, keywordData: any) {
    const existingKeyword = await this.findKeyword(adGroupId, keywordData.text);
    if (existingKeyword) {
      return this.prisma.client.keyword.update({
        where: { id: existingKeyword.id },
        data: {
          matchType: keywordData.matchType || 'UNKNOWN',
          status: keywordData.status || 'UNKNOWN',
        },
      });
    }

    return this.prisma.client.keyword.create({
      data: {
        adGroupId,
        text: keywordData.text,
        matchType: keywordData.matchType || 'UNKNOWN',
        status: keywordData.status || 'UNKNOWN',
      },
    });
  }

  private async findCreativeByProviderId(providerCreativeId: string) {
    return this.prisma.client.creative.findFirst({
      where: { providerCreativeId },
    });
  }

  private async upsertCreativeRecord(adGroupId: string, adData: any) {
    const existingCreative = await this.findCreativeByProviderId(adData.id);
    if (existingCreative) {
      return this.prisma.client.creative.update({
        where: { id: existingCreative.id },
        data: {
          headline: adData.headline,
          description: adData.description,
          contentUrl: adData.contentUrl,
          status: adData.status || 'UNKNOWN',
        },
      });
    }

    return this.prisma.client.creative.create({
      data: {
        adGroupId,
        providerCreativeId: adData.id,
        type: adData.type || 'TEXT',
        headline: adData.headline,
        description: adData.description,
        contentUrl: adData.contentUrl,
        status: adData.status || 'UNKNOWN',
      },
    });
  }

  async getCustomerAccount(accountId: string) {
    const { customer } = await this.resolveCustomerClient(accountId);
    const response = await customer.query(`
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.tracking_url_template
      FROM customer
    `);

    return response.map((row: any) => ({
      id: row.customer?.id?.toString() || '',
      name: row.customer?.descriptive_name || '',
      currency: row.customer?.currency_code || '',
      timeZone: row.customer?.time_zone || '',
      trackingTemplate: row.customer?.tracking_url_template || '',
    }));
  }

  async getCustomerAccounts(accountId: string) {
    const { customer, adAccount } = await this.resolveCustomerClient(accountId);
    const response = await customer.query(`
      SELECT
        customer_client.client_customer,
        customer_client.level,
        customer_client.manager,
        customer_client.currency_code,
        customer_client.time_zone
      FROM customer_client
    `);

    const accounts = (response || []).map((row: any) => ({
      customerId: row.customer_client?.client_customer || '',
      level: row.customer_client?.level || 0,
      manager: row.customer_client?.manager || false,
      currency: row.customer_client?.currency_code || '',
      timeZone: row.customer_client?.time_zone || '',
    }));

    for (const account of accounts) {
      if (account.customerId) {
        const existing = await this.prisma.client.adAccount.findFirst({
          where: { platformId: account.customerId }
        });
        if (existing) {
          await this.prisma.client.adAccount.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE' }
          });
        } else {
          await this.prisma.client.adAccount.create({
            data: {
              clientId: adAccount.clientId,
              platform: 'GOOGLE_ADS',
              platformId: account.customerId,
              status: 'ACTIVE',
            }
          });
        }
      }
    }

    return accounts;
  }

  async getCampaigns(accountId: string) {
    this.logger.log(`Fetching Google Ads campaigns for account ${accountId}`);
    const { customer, adAccount } = await this.resolveCustomerClient(accountId);
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.start_date,
        campaign.end_date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
    `;
    const response = await customer.query(query);

    return await Promise.all((response || []).map(async (row: any) => {
      const campaign = row.campaign || {};
      const metrics = row.metrics || {};
      const spend = metrics.cost_micros ? Number(metrics.cost_micros) / 1_000_000 : 0;
      const revenue = metrics.conversions_value ? Number(metrics.conversions_value) : 0;
      const persisted = await this.upsertCampaignRecord(adAccount, {
        id: campaign.id?.toString() || '',
        name: campaign.name || '',
        status: campaign.status || 'UNKNOWN',
        startDate: campaign.start_date || null,
        endDate: campaign.end_date || null,
        objective: campaign.objective || '',
        budget: campaign.budget ? Number(campaign.budget) : 0,
      });

      await this.createCampaignMetric(persisted.id, {
        spend,
        impressions: Number(metrics.impressions) || 0,
        clicks: Number(metrics.clicks) || 0,
        conversions: Number(metrics.conversions) || 0,
        revenue,
        ctr: Number(metrics.ctr) || 0,
        cpc: metrics.average_cpc ? Number(metrics.average_cpc) / 1_000_000 : 0,
        cpm: metrics.average_cpm ? Number(metrics.average_cpm) / 1_000_000 : 0,
        roas: spend > 0 ? (revenue / spend) : 0,
        cpa: metrics.conversions ? (spend / Number(metrics.conversions || 1)) : 0,
        cpl: metrics.conversions ? (spend / Number(metrics.conversions || 1)) : 0,
      }, new Date());

      return {
        id: persisted.providerCampaignId,
        name: persisted.name,
        status: persisted.status,
        startDate: persisted.startDate,
        endDate: persisted.endDate,
        spend,
        impressions: Number(metrics.impressions) || 0,
        clicks: Number(metrics.clicks) || 0,
        conversions: Number(metrics.conversions) || 0,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
      };
    }));
  }

  async getAdGroups(accountId: string, campaignId: string) {
    this.logger.log(`Fetching Google Ads ad groups for campaign ${campaignId}`);
    const { customer } = await this.resolveCustomerClient(accountId);
    const adAccount = await this.prisma.client.adAccount.findFirst({
      where: { OR: [{ id: accountId }, { platformId: accountId }] },
    });
    if (!adAccount) {
      throw new Error(`Google Ads account ${accountId} not found in database.`);
    }

    const campaign = await this.prisma.client.campaign.findFirst({
      where: { providerCampaignId: campaignId, adAccountId: adAccount.id },
    });
    if (!campaign) {
      throw new Error(`Google Ads campaign ${campaignId} not found in database for account ${accountId}.`);
    }

    const query = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.cpc_bid_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM ad_group
      WHERE ad_group.campaign = ${campaignId}
    `;
    const response = await customer.query(query);

    return await Promise.all((response || []).map(async (row: any) => {
      const adGroup = row.ad_group || {};
      const metrics = row.metrics || {};
      const persisted = await this.upsertAdGroupRecord(campaign.id, {
        id: adGroup.id?.toString() || '',
        name: adGroup.name || '',
        status: adGroup.status || 'UNKNOWN',
        bid: adGroup.cpc_bid_micros ? Number(adGroup.cpc_bid_micros) / 1_000_000 : 0,
      });

      await this.createCampaignMetric(campaign.id, {
        spend: metrics.cost_micros ? Number(metrics.cost_micros) / 1_000_000 : 0,
        impressions: Number(metrics.impressions) || 0,
        clicks: Number(metrics.clicks) || 0,
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
        id: persisted.providerAdGroupId,
        name: persisted.name,
        status: persisted.status,
        bid: Number(persisted.bid || 0),
        impressions: Number(metrics.impressions) || 0,
        clicks: Number(metrics.clicks) || 0,
        spend: metrics.cost_micros ? Number(metrics.cost_micros) / 1_000_000 : 0,
      };
    }));
  }

  async getKeywords(accountId: string, campaignId: string) {
    this.logger.log(`Fetching Google Ads keywords for campaign ${campaignId}`);
    const { customer } = await this.resolveCustomerClient(accountId);
    const adGroupMap = new Map<string, string>();

    const query = `
      SELECT
        ad_group_criterion.ad_group,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status
      FROM ad_group_criterion
      WHERE ad_group.campaign = ${campaignId}
    `;
    const response = await customer.query(query);

    return await Promise.all((response || []).map(async (row: any) => {
      const keyword = row.ad_group_criterion || {};
      const adGroupId = keyword.ad_group?.toString() || '';

      if (!adGroupMap.has(adGroupId)) {
        const dbAdGroup = await this.prisma.client.adGroup.findFirst({
          where: { providerAdGroupId: adGroupId },
        });
        if (dbAdGroup) adGroupMap.set(adGroupId, dbAdGroup.id);
      }
      const localAdGroupId = adGroupMap.get(adGroupId);
      if (localAdGroupId) {
        await this.upsertKeywordRecord(localAdGroupId, {
          text: keyword.keyword?.text || '',
          matchType: keyword.keyword?.match_type || 'UNKNOWN',
          status: keyword.status || 'UNKNOWN',
        });
      }

      return {
        adGroupId,
        text: keyword.keyword?.text || '',
        matchType: keyword.keyword?.match_type || 'UNKNOWN',
        status: keyword.status || 'UNKNOWN',
      };
    }));
  }

  async getCampaignMetrics(accountId: string, campaignId: string) {
    this.logger.log(`Fetching Google Ads metrics for campaign ${campaignId}`);
    const { customer } = await this.resolveCustomerClient(accountId);
    const campaign = await this.prisma.client.campaign.findFirst({
      where: { providerCampaignId: campaignId },
    });
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found in database.`);
    }

    const query = `
      SELECT
        segments.date,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm
      FROM campaign
      WHERE campaign.id = ${campaignId}
    `;
    const response = await customer.query(query);

    return await Promise.all((response || []).map(async (row: any) => {
      const date = row.segments?.date ? new Date(row.segments.date) : new Date();
      const metricData = {
        spend: row.metrics?.cost_micros ? Number(row.metrics.cost_micros) / 1_000_000 : 0,
        impressions: Number(row.metrics?.impressions) || 0,
        clicks: Number(row.metrics?.clicks) || 0,
        conversions: Number(row.metrics?.conversions) || 0,
        revenue: Number(row.metrics?.conversions_value) || 0,
        ctr: Number(row.metrics?.ctr) || 0,
        cpc: row.metrics?.average_cpc ? Number(row.metrics.average_cpc) / 1_000_000 : 0,
        cpm: row.metrics?.average_cpm ? Number(row.metrics.average_cpm) / 1_000_000 : 0,
        roas: row.metrics?.cost_micros ? (Number(row.metrics.conversions_value) || 0) / (Number(row.metrics.cost_micros) / 1_000_000) : 0,
        cpa: row.metrics?.conversions ? (row.metrics.cost_micros ? Number(row.metrics.cost_micros) / 1_000_000 : 0) / Number(row.metrics.conversions || 1) : 0,
        cpl: row.metrics?.conversions ? (row.metrics.cost_micros ? Number(row.metrics.cost_micros) / 1_000_000 : 0) / Number(row.metrics.conversions || 1) : 0,
      };

      await this.createCampaignMetric(campaign.id, metricData, date);
      return metricData;
    }));
  }

  async pauseCampaign(campaignId: string) {
    this.logger.log(`Pausing Google Ads campaign ${campaignId}`);
    const dbCampaign = await this.prisma.client.campaign.findFirst({
      where: {
        OR: [
          { id: campaignId },
          { providerCampaignId: campaignId },
        ],
      },
      include: {
        adAccount: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!dbCampaign || !dbCampaign.adAccount) {
      this.logger.error(`Campaign ${campaignId} not found in database.`);
      return { success: false, status: 'ERROR', message: 'Campaign not found in database.' };
    }

    const { customer } = await this.resolveCustomerClient(dbCampaign.adAccount.id);
    const resourceName = `customers/${dbCampaign.adAccount.platformId.replace(/-/g, '')}/campaigns/${dbCampaign.providerCampaignId || campaignId}`;

    try {
      await customer.campaigns.update([{ resource_name: resourceName, status: 'PAUSED' as any }]);
      await this.prisma.client.campaign.update({
        where: { id: dbCampaign.id },
        data: { status: 'PAUSED' },
      });
      return { success: true, status: 'PAUSED' };
    } catch (err) {
      this.logger.error(`Failed to pause Google Ads campaign ${campaignId}`, err);
      throw err;
    }
  }
}

