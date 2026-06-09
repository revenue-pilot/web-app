import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum FeatureLimits {
  CAMPAIGNS = 'CAMPAIGNS',
  USERS = 'USERS',
  AD_ACCOUNTS = 'AD_ACCOUNTS',
}

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async checkLimit(organizationId: string, featureKey: FeatureLimits): Promise<boolean> {
    const subscription = await this.prisma.client.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    const tier = subscription?.tier || 'FREE';

    // Fetch limits from database for the current tier
    let planLimit = await this.prisma.client.planLimit.findUnique({
      where: { tier: tier as any }
    });

    if (!planLimit) {
      // Fallback to strict defaults if DB not seeded
      planLimit = {
        id: 'default',
        tier: tier as any,
        maxCampaigns: 1,
        maxUsers: 1,
        maxAdAccounts: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    let allowed = 1;
    if (featureKey === FeatureLimits.CAMPAIGNS) {
      allowed = planLimit.maxCampaigns;
    } else if (featureKey === FeatureLimits.USERS) {
      allowed = planLimit.maxUsers;
    } else if (featureKey === FeatureLimits.AD_ACCOUNTS) {
      allowed = planLimit.maxAdAccounts;
    }

    let currentUsage = 0;
    if (featureKey === FeatureLimits.CAMPAIGNS) {
      currentUsage = await this.prisma.client.campaign.count({ where: { organizationId } });
    } else if (featureKey === FeatureLimits.USERS) {
      currentUsage = await this.prisma.client.user.count({ where: { organizationId } });
    } else if (featureKey === FeatureLimits.AD_ACCOUNTS) {
      // Find all clients of org, then their ad accounts
      const clients = await this.prisma.client.client.findMany({ where: { organizationId }, select: { id: true } });
      const clientIds = clients.map(c => c.id);
      currentUsage = await this.prisma.client.adAccount.count({ where: { clientId: { in: clientIds } } });
    }

    if (currentUsage >= allowed) {
      throw new BadRequestException(`Usage limit reached for ${featureKey}. Upgrade your subscription to increase limits.`);
    }

    return true;
  }
}
