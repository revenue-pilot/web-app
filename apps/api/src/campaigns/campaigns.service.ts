import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async getCampaigns(userEmail: string) {
    if (!this.prisma.isConnected) {
      return [];
    }

    const user = await this.prisma.client.user.findUnique({
      where: { email: userEmail }
    });
    if (!user) return [];

    const dbCampaigns = await this.prisma.client.campaign.findMany({
      where: {
        adAccount: {
          client: {
            organizationId: user.organizationId
          }
        }
      },
      include: {
        adAccount: true,
        budgets: true,
        metrics: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    return dbCampaigns.map(c => ({
      id: c.id,
      name: c.name,
      platform: c.adAccount.platform === 'GOOGLE_ADS' ? 'Google Ads' : 'Meta Ads',
      status: c.status === 'ACTIVE' ? 'Active' : 'Paused',
      spend: c.metrics.reduce((total, metric) => total + Number(metric.spend || 0), 0),
      spendNum: c.metrics.reduce((total, metric) => total + Number(metric.spend || 0), 0),
      revenue: c.metrics.reduce((total, metric) => total + Number(metric.spend || 0) * Number(metric.roas || 0), 0),
      revenueNum: c.metrics.reduce((total, metric) => total + Number(metric.spend || 0) * Number(metric.roas || 0), 0),
      roas: (() => {
        const spend = c.metrics.reduce((total, metric) => total + Number(metric.spend || 0), 0);
        const revenue = c.metrics.reduce((total, metric) => total + Number(metric.spend || 0) * Number(metric.roas || 0), 0);
        return spend > 0 ? `${(revenue / spend).toFixed(2)}x` : '0.0x';
      })(),
      roasNum: (() => {
        const spend = c.metrics.reduce((total, metric) => total + Number(metric.spend || 0), 0);
        const revenue = c.metrics.reduce((total, metric) => total + Number(metric.spend || 0) * Number(metric.roas || 0), 0);
        return spend > 0 ? Number((revenue / spend).toFixed(2)) : 0;
      })(),
      conversions: c.metrics.reduce((total, metric) => total + Number(metric.conversions || 0), 0),
      impressions: c.metrics.reduce((total, metric) => total + Number(metric.impressions || 0), 0),
      clicks: c.metrics.reduce((total, metric) => total + Number(metric.clicks || 0), 0),
      budgetNum: c.budgets[c.budgets.length - 1]?.amount || 0,
      adGroups: []
    }));
  }
}
