import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 0. Complete Dashboard Statistics
  async getDashboardStats() {
    const totalOrganizations = await this.prisma.client.organization.count();
    const totalUsers = await this.prisma.client.user.count();
    const totalCampaigns = await this.prisma.client.campaign.count();
    const totalAiLogs = await this.prisma.client.aiInsight.count();

    const subscriptions = await this.prisma.client.subscription.findMany({
      where: { status: 'ACTIVE' },
    });
    
    let mrr = 0;
    subscriptions.forEach(sub => {
      // Approximate pricing in INR based on typical tiers
      const tier = sub.tier.toUpperCase();
      if (tier === 'STARTER') mrr += 999;
      else if (tier === 'REVENUE') mrr += 1999;
      else if (tier === 'PRO') mrr += 4999;
      else if (tier === 'ENTERPRISE') mrr += 9999;
    });

    const trialUsers = await this.prisma.client.subscription.count({
      where: { status: 'TRIALING' }
    });

    // We can't perfectly compute conversion rate from current DB schema without history,
    // so we calculate a basic ratio of active paid to total subscriptions
    const totalSubs = await this.prisma.client.subscription.count();
    const paidSubs = await this.prisma.client.subscription.count({
      where: { status: 'ACTIVE', tier: { not: 'FREE' } }
    });
    const conversionRate = totalSubs > 0 ? ((paidSubs / totalSubs) * 100).toFixed(1) : "0.0";
    
    // Churn rate (simplified: cancelled / total)
    const cancelledSubs = await this.prisma.client.subscription.count({
      where: { status: 'CANCELLED' }
    });
    const churnRate = totalSubs > 0 ? ((cancelledSubs / totalSubs) * 100).toFixed(1) : "0.0";

    // Processed Spend
    const metrics = await this.prisma.client.campaignMetric.aggregate({
      _sum: { spend: true }
    });
    const processedSpend = metrics._sum.spend || 0;

    return {
      totalOrganizations,
      totalUsers,
      totalCampaigns,
      totalAiLogs,
      mrr,
      arr: mrr * 12,
      trialUsers,
      conversionRate,
      churnRate,
      processedSpend,
    };
  }

  // 1. Revenue Dashboard API
  async getRevenueMetrics() {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: { status: 'ACTIVE' },
    });
    
    // Naive MRR calculation (mock implementation)
    let mrr = 0;
    const tierDistribution: Record<string, number> = {};
    
    subscriptions.forEach(sub => {
      const tier = sub.tier;
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
      
      if (tier === 'STARTER') mrr += 99;
      else if (tier === 'GROWTH') mrr += 299;
      else if (tier === 'ENTERPRISE') mrr += 999;
    });

    return {
      mrr,
      activeSubscriptions: subscriptions.length,
      tierDistribution
    };
  }

  // 2. Tenant Dashboard API
  async getTenants() {
    return this.prisma.client.organization.findMany({
      include: {
        _count: {
          select: { users: true, Campaign: true, leads: true }
        }
      }
    });
  }

  // Users endpoint
  async getUsers() {
    return this.prisma.client.user.findMany({
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  // Campaigns endpoint
  async getCampaigns() {
    const totalCampaigns = await this.prisma.client.campaign.count();
    const activeCampaigns = await this.prisma.client.campaign.count({ where: { status: 'ACTIVE' } });
    const pausedCampaigns = await this.prisma.client.campaign.count({ where: { status: 'PAUSED' } });
    return {
      total: totalCampaigns,
      active: activeCampaigns,
      paused: pausedCampaigns,
      alerts: [] // We don't have a dedicated alert table yet, so return empty for now
    };
  }

  async getTenantDetails(id: string) {
    const tenant = await this.prisma.client.organization.findUnique({
      where: { id },
      include: { users: true, subscriptions: true }
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // 3. Security & Audit Center
  async getGlobalAuditLogs() {
    return this.prisma.client.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // 4. AI Control Center
  async getAiUsage() {
    const totalInsights = await this.prisma.client.aiInsight.count();
    const insightsPerOrg = await this.prisma.client.aiInsight.groupBy({
      by: ['organizationId'],
      _count: {
        id: true,
      },
    });
    return { totalInsights, insightsPerOrg };
  }

  // 5. Incident Management (Mock)
  async triggerIncident(payload: any) {
    // In a real scenario, this would post to PagerDuty or Slack
    return {
      success: true,
      message: 'Incident triggered and notifications dispatched',
      incident: payload
    };
  }

  // Subscriptions endpoint
  async getSubscriptions() {
    return this.prisma.client.subscription.findMany({
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  // Integrations endpoint
  async getIntegrations() {
    const googleAds = await this.prisma.client.googleAdsConnector.count();
    const metaAds = await this.prisma.client.metaAdsConnector.count();
    const ga4 = await this.prisma.client.googleAnalyticsConnector.count();
    const otherIntegrations = await this.prisma.client.integrationCredential.count();
    
    return { googleAds, metaAds, ga4, otherIntegrations };
  }
}
