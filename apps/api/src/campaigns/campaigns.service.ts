import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async getCampaigns(userEmail: string) {
    if (this.prisma.isConnected) {
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
          adAccount: true
        }
      });

      return dbCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        platform: c.adAccount.platform === 'GOOGLE_ADS' ? 'Google Ads' : 'Meta Ads',
        status: c.status === 'ACTIVE' ? 'Active' : 'Paused',
        spend: '₹0.00',
        roas: '0.0x',
        conversions: 0,
        impressions: 0,
        clicks: 0,
        adGroups: []
      }));
    } else {
      const sim = this.prisma.simulator.getOrCreateUser(userEmail);
      return this.prisma.simulator.getCampaigns(sim.org.id);
    }
  }

  // Legacy fallback for unit tests compat
  getMockCampaigns() {
    const sim = this.prisma.simulator.getOrCreateUser('arjun@Revenuepilot.com');
    return this.prisma.simulator.getCampaigns(sim.org.id);
  }
}
