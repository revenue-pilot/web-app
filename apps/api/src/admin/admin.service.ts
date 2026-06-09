import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
}
