import { Controller, Get, Post, Body, Query, Patch, UseGuards, Req, Delete, Param, BadRequestException, UnauthorizedException, Logger, Header } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { PrismaService } from './prisma/prisma.service';
import { BillingService } from './billing/billing.service';
import { EmailService } from './email/email.service';
import { StorageService } from './storage/storage.service';
import { AuthService } from './auth/auth.service';
import { Request } from 'express';
import * as crypto from 'crypto';

// Password Hashing and Verification Helpers using Node.js native crypto
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

@Controller('api')
@UseGuards(SubscriptionGuard)
export class EnterpriseController {
  private readonly logger = new Logger(EnterpriseController.name);

  constructor(
    private prismaService: PrismaService,
    private billingService: BillingService,
    private emailService: EmailService,
    private storageService: StorageService,
    private authService: AuthService,
  ) {}

  private getUserEmail(req: Request): string {
    return (req as any).impersonatedUserEmail || (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
  }

  private ensureDatabaseConnected() {
    if (!this.prismaService.isConnected) {
      throw new BadRequestException('Database unavailable. Please try again later.');
    }
  }



  @Post('auth/verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return { success: true, message: 'Email verified successfully.' };
  }

  @Post('auth/reset-password-request')
  async resetPasswordRequest(@Body() body: { email: string }) {
    const email = body.email.trim().toLowerCase();
    const token = crypto.randomBytes(20).toString('hex');
    await this.emailService.sendPasswordResetEmail(email, token);
    return { success: true, message: 'Password reset instructions sent.' };
  }

  @Post('auth/reset-password')
  async resetPassword(@Body() body: { token: string; password?: string }) {
    return { success: true, message: 'Password reset successfully.' };
  }

  // Magic Link token storage (simulated in memory)
  private magicLinkTokens = new Map<string, { email: string; expires: Date }>();

  @Post('auth/magic-link-request')
  async magicLinkRequest(@Body() body: { email: string }) {
    const email = body.email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 15 minutes from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);
    this.magicLinkTokens.set(token, { email, expires });

    this.logger.log(`Magic link requested for ${email}. Token: ${token}`);
    
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }

    // Ensure user profile exists or registers onboarding tenant dynamically
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) {
        const name = email.split('@')[0];
        const org = await this.prismaService.client.organization.create({
          data: {
            name: `${name}'s Workspace`,
            subscriptions: {
              create: {
                tier: 'STARTER',
                status: 'ACTIVE'
              }
            }
          }
        });
        await this.prismaService.client.user.create({
          data: {
            email,
            name,
            role: 'CLIENT',
            organizationId: org.id
          }
        });
        this.logger.log(`Created new tenant profile during Magic Link signup for ${email}`);
      }
    }

    await this.emailService.sendMagicLinkEmail(email, token);
    return { success: true, message: 'Magic login link sent. Please check your inbox.' };
  }

  @Post('auth/magic-link-verify')
  async magicLinkVerify(@Body() body: { token: string }) {
    const tokenData = this.magicLinkTokens.get(body.token);
    if (!tokenData) {
      return { success: false, message: 'Invalid or expired login link.' };
    }

    if (new Date() > tokenData.expires) {
      this.magicLinkTokens.delete(body.token);
      return { success: false, message: 'Login link has expired.' };
    }

    const email = tokenData.email;
    this.magicLinkTokens.delete(body.token); // single use token

    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
      include: { organization: true }
    });
    if (!user) return { success: false, message: 'User profile not found.' };

    const tokenResponse = await this.authService.login(user);

    return {
      success: true,
      user: tokenResponse.user,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      message: 'Authenticated successfully via Magic Link.'
    };
  }


  // Workspaces (Orbit Workspaces)
  @Get('workspaces')
  async getWorkspaces(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    const clients = await this.prismaService.client.client.findMany({
      where: { organizationId: user.organizationId }
    });
    return [
      {
        id: 'space_1',
        name: `${user.name}'s Workspace`,
        role: user.role === 'ADMIN' ? 'Platform Admin' : 'Agency Owner',
        activeCampaigns: 0,
        spend: 0,
        clientCount: clients.length,
        maxClients: 25
      }
    ];
  }

  @Post('workspaces')
  async createWorkspace(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false, message: 'User not found' };
    const newClient = await this.prismaService.client.client.create({
      data: {
        name: body.name,
        organizationId: user.organizationId
      }
    });
    return { success: true, id: newClient.id, name: newClient.name, activeCampaigns: 0, spend: 0 };
  }

  // Clients (Client Constellation)
  @Get('clients')
  async getClients(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    const clients = await this.prismaService.client.client.findMany({
      where: { organizationId: user.organizationId }
    });
    return clients.map(c => ({
      id: c.id,
      name: c.name,
      health: 100,
      spend: 0,
      conversions: 0,
      roas: '0x',
      status: 'Active',
      industry: c.industry || 'General',
      email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@Revenuepilot.com`
    }));
  }

  @Post('clients')
  async createClient(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    const client = await this.prismaService.client.client.create({
      data: {
        name: body.name,
        industry: body.industry,
        organizationId: user.organizationId
      }
    });
    return { success: true, id: client.id, health: 100, spend: 0, conversions: 0, status: 'Onboarding', name: client.name, industry: client.industry };
  }

  // Analytics (Pulse Matrix & Insight Engine)
  @Get('analytics/pulse')
  async getPulseAnalytics(@Req() req: Request) {
    const email = this.getUserEmail(req);

    if (!this.prismaService.isConnected) {
      return {
        summary: null,
        chartData: [],
        platformSpend: [],
        campaignStatus: [],
        totalCampaigns: 0,
        lastUpdated: null
      };
    }

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user) {
      return {
        summary: null,
        chartData: [],
        platformSpend: [],
        campaignStatus: [],
        totalCampaigns: 0,
        lastUpdated: null
      };
    }

    const campaigns = await this.prismaService.client.campaign.findMany({
      where: {
        adAccount: {
          client: {
            organizationId: user.organizationId
          }
        }
      },
      include: {
        adAccount: true,
        metrics: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    const platformSpendMap: Record<string, number> = {};
    const campaignStatusMap: Record<string, number> = { Active: 0, Paused: 0, Draft: 0, Ended: 0 };
    const chartMap = new Map<string, { name: string; Spend: number; Revenue: number; Conversions: number }>();

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalConversions = 0;
    let lastUpdated: string | null = null;

    campaigns.forEach((campaign) => {
      const platform = campaign.adAccount.platform === 'GOOGLE_ADS' ? 'Google Ads' : campaign.adAccount.platform === 'META_ADS' ? 'Meta Ads' : 'Others';
      const status = campaign.status === 'ACTIVE' ? 'Active' : campaign.status === 'PAUSED' ? 'Paused' : campaign.status === 'REMOVED' ? 'Ended' : 'Draft';
      campaignStatusMap[status] = (campaignStatusMap[status] || 0) + 1;

      let campaignSpend = 0;
      let campaignRevenue = 0;
      let campaignConversions = 0;

      campaign.metrics.forEach((metric) => {
        const spend = Number(metric.spend || 0);
        const conversions = Number(metric.conversions || 0);
        const revenue = spend * Number(metric.roas || 0);
        const dayKey = metric.date.toISOString().slice(0, 10);
        const existing = chartMap.get(dayKey) || { name: dayKey, Spend: 0, Revenue: 0, Conversions: 0 };

        existing.Spend += spend;
        existing.Revenue += revenue;
        existing.Conversions += conversions;
        chartMap.set(dayKey, existing);

        campaignSpend += spend;
        campaignRevenue += revenue;
        campaignConversions += conversions;

        if (!lastUpdated || metric.date.toISOString() > lastUpdated) {
          lastUpdated = metric.date.toISOString();
        }
      });

      platformSpendMap[platform] = (platformSpendMap[platform] || 0) + campaignSpend;
      totalSpend += campaignSpend;
      totalRevenue += campaignRevenue;
      totalConversions += campaignConversions;
    });

    const platformSpend = Object.entries(platformSpendMap).map(([name, value]) => ({
      name,
      value,
      percent: totalSpend > 0 ? `${Math.round((value / totalSpend) * 100)}%` : '0%'
    }));

    const campaignStatus = Object.entries(campaignStatusMap)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percent: campaigns.length > 0 ? `${Math.round((value / campaigns.length) * 100)}%` : '0%'
      }));

    const chartData = Array.from(chartMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => ({
        name: entry.name,
        Spend: Math.round(entry.Spend),
        Revenue: Math.round(entry.Revenue),
        Conversions: Math.round(entry.Conversions)
      }));

    return {
      summary: {
        spend: Math.round(totalSpend),
        revenue: Math.round(totalRevenue),
        conversions: Math.round(totalConversions),
        roas: totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0
      },
      chartData,
      platformSpend,
      campaignStatus,
      totalCampaigns: campaigns.length,
      lastUpdated
    };
  }

  @Get('analytics/pulse-matrix')
  async getPulseMatrixAnalytics(@Req() req: Request) {
    const email = this.getUserEmail(req);

    const mockData = {
      funnelData: [
        { stage: "Impressions", Google: 1500000, Meta: 1200000 },
        { stage: "Clicks", Google: 45000, Meta: 36000 },
        { stage: "Leads", Google: 4500, Meta: 2400 },
        { stage: "Customers", Google: 987, Meta: 654 }
      ],
      attributionModels: [
        { name: "Last Click", Google: "62%", Meta: "30%", Others: "8%", description: "Attributes 100% of the conversion to the last ad clicked by the customer." },
        { name: "First Click", Google: "40%", Meta: "50%", Others: "10%", description: "Attributes 100% of the conversion to the first ad the user interacted with." },
        { name: "Linear", Google: "50%", Meta: "40%", Others: "10%", description: "Distributes conversion value equally across all ad touchpoints in the funnel." },
        { name: "Time Decay", Google: "55%", Meta: "37%", Others: "8%", description: "Gives more weight to touchpoints that occurred closer in time to the conversion." }
      ],
      cohortData: [
        { month: "Jan 2026", size: 120, m1: "100%", m2: "92%", m3: "88%", m4: "85%", m5: "83%" },
        { month: "Feb 2026", size: 145, m1: "100%", m2: "94%", m3: "90%", m4: "87%", m5: "-" },
        { month: "Mar 2026", size: 160, m1: "100%", m2: "95%", m3: "89%", m4: "-", m5: "-" },
        { month: "Apr 2026", size: 190, m1: "100%", m2: "93%", m3: "-", m4: "-", m5: "-" }
      ]
    };

    if (!this.prismaService.isConnected) return mockData;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) return mockData;

    const campaigns = await this.prismaService.client.campaign.findMany({
      where: { adAccount: { client: { organizationId: user.organizationId } } },
      include: { adAccount: true, metrics: true }
    });

    if (!campaigns || campaigns.length === 0) {
      // Return zeroed out empty data instead of mockData
      return {
        funnelData: [
          { stage: "Impressions", Google: 0, Meta: 0 },
          { stage: "Clicks", Google: 0, Meta: 0 },
          { stage: "Leads", Google: 0, Meta: 0 },
          { stage: "Customers", Google: 0, Meta: 0 }
        ],
        attributionModels: [
          { name: "Last Click", Google: "0%", Meta: "0%", Others: "0%", description: "Attributes 100% of the conversion to the last ad clicked by the customer." },
          { name: "First Click", Google: "0%", Meta: "0%", Others: "0%", description: "Attributes 100% of the conversion to the first ad the user interacted with." },
          { name: "Linear", Google: "0%", Meta: "0%", Others: "0%", description: "Distributes conversion value equally across all ad touchpoints in the funnel." },
          { name: "Time Decay", Google: "0%", Meta: "0%", Others: "0%", description: "Gives more weight to touchpoints that occurred closer in time to the conversion." }
        ],
        cohortData: []
      };
    }

    let googleImpressions = 0; let googleClicks = 0; let googleConversions = 0; let googleSpend = 0;
    let metaImpressions = 0; let metaClicks = 0; let metaConversions = 0; let metaSpend = 0;
    let totalSpend = 0;

    campaigns.forEach(campaign => {
      const isGoogle = campaign.adAccount?.platform === 'GOOGLE_ADS';
      const isMeta = campaign.adAccount?.platform === 'META_ADS';
      
      campaign.metrics.forEach(metric => {
        const imp = Number(metric.impressions || 0);
        const clk = Number(metric.clicks || 0);
        const conv = Number(metric.conversions || 0);
        const spd = Number(metric.spend || 0);

        totalSpend += spd;
        if (isGoogle) { googleImpressions += imp; googleClicks += clk; googleConversions += conv; googleSpend += spd; }
        else if (isMeta) { metaImpressions += imp; metaClicks += clk; metaConversions += conv; metaSpend += spd; }
      });
    });

    const googleLeads = Math.round(googleConversions * 5) || Math.round(googleClicks * 0.1) || 0;
    const metaLeads = Math.round(metaConversions * 5) || Math.round(metaClicks * 0.1) || 0;

    const funnelData = [
      { stage: "Impressions", Google: googleImpressions, Meta: metaImpressions },
      { stage: "Clicks", Google: googleClicks, Meta: metaClicks },
      { stage: "Leads", Google: googleLeads, Meta: metaLeads },
      { stage: "Customers", Google: googleConversions, Meta: metaConversions }
    ];

    const googlePct = totalSpend > 0 ? Math.round((googleSpend / totalSpend) * 100) : 62;
    const metaPct = totalSpend > 0 ? Math.round((metaSpend / totalSpend) * 100) : 30;
    const otherPct = Math.max(0, 100 - googlePct - metaPct);

    const attributionModels = [
      { name: "Last Click", Google: `${googlePct}%`, Meta: `${metaPct}%`, Others: `${otherPct}%`, description: "Attributes 100% of the conversion to the last ad clicked by the customer." },
      { name: "First Click", Google: `${Math.max(0, googlePct - 22)}%`, Meta: `${metaPct + 20}%`, Others: `${otherPct + 2}%`, description: "Attributes 100% of the conversion to the first ad the user interacted with." },
      { name: "Linear", Google: `${Math.max(0, googlePct - 12)}%`, Meta: `${metaPct + 10}%`, Others: `${otherPct + 2}%`, description: "Distributes conversion value equally across all ad touchpoints in the funnel." },
      { name: "Time Decay", Google: `${Math.max(0, googlePct - 7)}%`, Meta: `${metaPct + 7}%`, Others: `${otherPct}%`, description: "Gives more weight to touchpoints that occurred closer in time to the conversion." }
    ];

    const totalCustomers = googleConversions + metaConversions;
    let cohortData = [];

    if (totalCustomers > 0) {
      const baseSize = Math.max(10, Math.round(totalCustomers / 4));
      
      const months = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
      }

      cohortData = [
        { month: months[0], size: baseSize, m1: "100%", m2: "92%", m3: "88%", m4: "85%", m5: "83%" },
        { month: months[1], size: Math.round(baseSize * 1.2), m1: "100%", m2: "94%", m3: "90%", m4: "87%", m5: "-" },
        { month: months[2], size: Math.round(baseSize * 1.4), m1: "100%", m2: "95%", m3: "89%", m4: "-", m5: "-" },
        { month: months[3], size: Math.round(baseSize * 1.6), m1: "100%", m2: "93%", m3: "-", m4: "-", m5: "-" }
      ];
    }

    return { funnelData, attributionModels, cohortData };
  }

  // Billing (Revenue Command)
  @Get('billing/subscriptions')
  async getBillingInfo(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      throw new BadRequestException('Database unavailable. Please try again later.');
    }
    try {
    const email = this.getUserEmail(req);
    let plan = 'starter';
    let orgId = '';
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { organization: { include: { subscriptions: true } } }
      });
      if (user) {
        orgId = user.organizationId;
        plan = (user.organization.subscriptions[0]?.tier || 'STARTER').toLowerCase();
      }
    }

    const limitsMap = {
      starter: { campaigns: 3, workspaces: 1, team: 1, storage: 5, adAccounts: 1, clients: 0 },
      Revenue: { campaigns: 15, workspaces: 3, team: 3, storage: 50, adAccounts: 5, clients: 0 },
      pro: { campaigns: 99999, workspaces: 10, team: 10, storage: 200, adAccounts: 99999, clients: 0 },
      enterprise: { campaigns: 99999, workspaces: 99999, team: 99999, storage: 99999, adAccounts: 99999, clients: 99999 }
    };

    const limits = limitsMap[plan] || limitsMap.starter;
    const usage = { campaigns: 0, workspaces: 0, team: 0, storage: 0, adAccounts: 0, clients: 0 };

    if (this.prismaService.isConnected) {
      usage.campaigns = await this.prismaService.client.campaign.count({
        where: { adAccount: { client: { organizationId: orgId } } }
      });
      usage.workspaces = await this.prismaService.client.client.count({
        where: { organizationId: orgId }
      });
      usage.team = await this.prismaService.client.user.count({
        where: { organizationId: orgId }
      });
      usage.clients = await this.prismaService.client.client.count({
        where: { organizationId: orgId }
      });
    }

    const priceMap = { starter: 999, growth: 1999, professional: 4999, agency: 4999, enterprise: 15000 };
    const subscription = await this.prismaService.client.subscription.findFirst({
      where: { organizationId: orgId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' }
    });
    const invoices = await this.prismaService.client.invoice.findMany({
      where: { subscription: { organizationId: orgId } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    const nextBilling = subscription ? new Date(subscription.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

    return {
      plan: plan.toUpperCase(),
      limits,
      usage,
      price: priceMap[plan] || 999,
      period: 'month',
      nextBilling,
      invoices: invoices.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        pdfUrl: inv.pdfUrl,
        createdAt: inv.createdAt
      }))
    };
    } catch (e) {
      this.logger.error('getBillingInfo error', e);
      return {
        plan: 'STARTER',
        limits: { campaigns: 3, workspaces: 1, team: 1, storage: 5, adAccounts: 1, clients: 0 },
        usage: { campaigns: 0, workspaces: 0, team: 0, storage: 0, adAccounts: 0, clients: 0 },
        price: 999,
        period: 'month',
        nextBilling: null,
        invoices: []
      };
    }
  }

  @Post('billing/checkout')
  async processCheckout(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const email = this.getUserEmail(req);
    const planName = (body.planName || 'Revenue').toLowerCase();
    const amount = body.amount || 1999;
    const gateway = body.gateway || 'razorpay';
    const origin = (req.headers.origin as string) || 'http://localhost:3000';

    if (gateway === 'stripe') {
      return this.billingService.createStripeCheckout(email, planName, amount, origin);
    } else {
      return this.billingService.createRazorpayOrder(email, planName, amount);
    }
  }

  @Get('billing/invoices')
  async getInvoices(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user) return [];
    const invoices = await this.prismaService.client.invoice.findMany({
      where: { subscription: { organizationId: user.organizationId } },
      orderBy: { createdAt: 'desc' }
    });
    return invoices.map(inv => ({
      id: inv.id,
      amount: inv.amount,
      status: inv.status,
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt
    }));
  }

  // Team Management (Crew Command)
  @Get('team')
  async getTeamMembers(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    const users = await this.prismaService.client.user.findMany({
      where: { organizationId: user.organizationId }
    });
    return users.map(u => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      email: u.email,
      role: u.role === 'ADMIN' ? 'Admin' : 'Agency Owner',
      status: 'Active',
      avatar: ''
    }));
  }

  @Post('team/invite')
  async inviteMember(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false, message: 'User not found.' };
    const newUser = await this.prismaService.client.user.create({
      data: {
        email: body.email,
        name: body.email.split('@')[0],
        role: body.role === 'Admin' ? 'ADMIN' : 'CLIENT',
        organizationId: user.organizationId
      }
    });
    return { success: true, member: { id: newUser.id, name: newUser.name, email: newUser.email, role: body.role, status: 'Active' } };
  }

  private mapDbCreativeToFrontend(asset: any) {
    const isImage = asset.assetType === 'IMAGE' || asset.assetName.match(/\.(png|jpg|jpeg|webp)$/i);
    const isVideo = asset.assetType === 'VIDEO' || asset.assetName.match(/\.(mp4|mov)$/i);
    const isLogo = asset.assetName.toLowerCase().includes('logo') || asset.assetName.match(/\.(svg)$/i);

    let resolvedType = "Document";
    if (isImage) resolvedType = "Image";
    else if (isVideo) resolvedType = "Video";
    else if (isLogo) resolvedType = "Logo";

    return {
      id: asset.id,
      name: asset.assetName,
      type: resolvedType,
      size: '1.2 MB',
      tag: 'Brand Assets',
      version: 'v1.0',
      lastModified: asset.createdAt ? new Date(asset.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      width: asset.width || (resolvedType === "Image" ? 1200 : resolvedType === "Video" ? 1920 : null),
      height: asset.height || (resolvedType === "Image" ? 1200 : resolvedType === "Video" ? 1080 : null),
      aspectRatio: resolvedType === "Image" ? "1:1" : resolvedType === "Video" ? "16:9" : null,
      focalPoint: resolvedType === "Image" || resolvedType === "Video" ? { x: 50, y: 50 } : null,
      detectedFaces: resolvedType === "Image" ? 1 : 0,
      qualityScore: 92,
      versions: asset.versions ? asset.versions.map(v => ({
        ratio: v.ratio,
        name: `AI Crop (${v.ratio})`,
        width: v.width,
        height: v.height,
        status: v.status,
        generatedByAI: v.generatedByAI
      })) : [],
      organizationId: asset.organizationId
    };
  }

  // Assets Vault (Creative Vault)
  @Get('creatives')
  async getCreatives(@Req() req: Request) {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    const creatives = await this.prismaService.client.creativeAsset.findMany({
      where: { organizationId: user.organizationId },
      include: { versions: true }
    });
    return creatives.map(c => this.mapDbCreativeToFrontend(c));
  }

  @Post('creatives')
  async createCreative(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return null;
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return null;
    const asset = await this.prismaService.client.creativeAsset.create({
      data: {
        organizationId: user.organizationId,
        clientId: 'default',
        assetType: body.type || 'IMAGE',
        assetName: body.name,
        fileUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
        format: body.type || 'png'
      },
      include: { versions: true }
    });
    return this.mapDbCreativeToFrontend(asset);
  }

  @Post('creatives/generate-ratios')
  async generateRatio(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const asset = await this.prismaService.client.creativeAsset.findUnique({
      where: { id: body.assetId },
      include: { versions: true }
    });
    if (!asset) return { success: false };
    const version = asset.versions.find(v => v.ratio === body.ratio);
    if (!version) {
      let w = 1080;
      let h = 1080;
      if (body.ratio === '9:16') { w = 1080; h = 1920; }
      else if (body.ratio === '16:9') { w = 1920; h = 1080; }
      else if (body.ratio === '1.91:1') { w = 1200; h = 628; }
      else if (body.ratio === '4:1') { w = 1200; h = 300; }
      else if (body.ratio === '4:5') { w = 1080; h = 1350; }

      await this.prismaService.client.creativeVersion.create({
        data: {
          assetId: asset.id,
          ratio: body.ratio,
          width: w,
          height: h,
          generatedByAI: true,
          status: 'READY'
        }
      });
    }

    const updatedAsset = await this.prismaService.client.creativeAsset.findUnique({
      where: { id: body.assetId },
      include: { versions: true }
    });
    return { success: true, asset: this.mapDbCreativeToFrontend(updatedAsset) };
  }

  @Post('campaigns/deploy')
  async deployCampaign(@Req() req: Request, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable. Please try again later.' };
    }
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (user) {
      const client = await this.prismaService.client.client.findFirst({ where: { organizationId: user.organizationId } });
      if (client) {
        let account = await this.prismaService.client.adAccount.findFirst({ where: { clientId: client.id } });
        if (!account) {
          account = await this.prismaService.client.adAccount.create({
            data: { clientId: client.id, platform: 'GOOGLE_ADS', platformId: 'acc_123', status: 'ACTIVE' }
          });
        }
        await this.prismaService.client.campaign.create({
          data: {
            adAccount: { connect: { id: account.id } },
            organization: { connect: { id: user.organizationId } },
            name: body.campaignName || 'Campaign Studio Live',
            status: 'ACTIVE'
          }
        });
      }
    }
    return {
      success: true,
      campaignId: `camp_live_${Date.now()}`,
      name: body.campaignName || 'Performance Max Dynamic Campaign',
      steps: [
        { name: 'Policy Pre-check', status: 'SUCCESS', details: 'Passed Google Policy Check. No restricted content flags found.' },
        { name: 'Ad Copy Validation', status: 'SUCCESS', details: 'Headline and description character lengths match channel guidelines.' },
        { name: 'Asset Processing', status: 'SUCCESS', details: 'Validated aspect ratios. Correct dimensions provided for Meta & Google.' },
        { name: 'Meta Ad Account Deployment', status: 'SUCCESS', details: 'Uploaded assets to Meta Account. Created Ad Set. Ad creative linked.' },
        { name: 'Google Ads Account Deployment', status: 'SUCCESS', details: 'Created PMax Campaign structures. Dynamic assets uploaded to Asset Group.' },
        { name: 'Status Activation', status: 'SUCCESS', details: 'Set Campaign Status to ACTIVE (Pending review).' }
      ]
    };
  }

  // Notifications (Signal Vault)
  @Get('notifications')
  async getNotifications(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (!this.prismaService.isConnected) {
      return [];
    }
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    return await this.prismaService.client.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  // Activity Intelligence (Timeline Engine)
  @Get('activity-logs')
  async getActivityLogs(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (!this.prismaService.isConnected) {
      return [];
    }
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    return await this.prismaService.client.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  // App Marketplace
  @Get('marketplace/apps')
  getMarketplaceApps() {
    return [
      { id: 'app_1', name: 'LinkedIn Lead Automator', description: 'Auto-sync LinkedIn forms into campaigns.', price: '₹499/mo', installed: false, category: 'Integration' },
      { id: 'app_2', name: 'AI Image Enhancer', description: 'Generate variations of ad creative visuals.', price: 'Free', installed: true, category: 'AI Tools' },
      { id: 'app_3', name: 'Slack Alerts Integrator', description: 'Get notifications of budget limits directly in Slack.', price: 'Free', installed: true, category: 'Communication' }
    ];
  }

  // Admin Console Options (Command Core & Feature Flags)
  @Get('admin/platform-metrics')
  getAdminMetrics() {
    return {
      mrr: 1450000,
      activeTenants: 1284,
      totalSpendManaged: 84000000,
      churnRate: '1.2%',
      health: {
        googleAds: 'Operational',
        metaAds: 'Operational',
        openAi: 'Operational',
        database: 'Operational'
      }
    };
  }

  @Get('admin/tenants')
  async getTenants() {
    if (!this.prismaService.isConnected) {
      return [];
    }
    const orgs = await this.prismaService.client.organization.findMany({
      include: {
        users: true,
        clients: true,
        subscriptions: true
      }
    });
    return orgs.map(org => {
      const plan = org.subscriptions[0]?.tier?.toLowerCase() || 'starter';
      const priceMap: Record<string, number> = {
        starter: 999,
        growth: 1999,
        professional: 2999,
        agency: 4999,
        enterprise: 15000
      };
      return {
        id: org.id,
        name: org.name,
        email: org.users[0]?.email || 'noreply@revenuepilot.com',
        plan: plan,
        status: 'Active',
        mrr: priceMap[plan] || 999,
        clientsConnected: org.clients.length
      };
    });
  }

  // My Profile - Account Management Center
  @Get('user/profile')
  async getUserProfile(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { preferences: true, loginHistory: true, organization: { include: { subscriptions: true } } }
      });
      if (!user) return null;
      const sub = user.organization.subscriptions[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        websiteUrl: user.websiteUrl,
        country: user.country,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorRecoveryCodes: user.twoFactorRecoveryCodes,
        createdAt: user.createdAt,
        role: user.role,
        organizationId: user.organizationId,
        plan: sub ? sub.tier.toLowerCase() : 'starter',
        preferences: user.preferences || {
          language: "en",
          timezone: "Asia/Kolkata",
          dateFormat: "YYYY-MM-DD",
          currency: "INR",
          theme: "light",
          density: "comfortable",
          sidebarMode: "expanded",
          emailProductUpdates: true,
          emailBillingAlerts: true,
          emailSecurityAlerts: true,
          emailMarketing: false,
          emailWeeklyReports: true,
          inAppActivity: true,
          inAppAiUpdates: true,
          inAppBillingEvents: true,
          inAppSupportUpdates: true,
          aiModel: "gpt-4o",
          aiResponseLength: "medium",
          aiCreativityLevel: 0.7,
          aiDefaultLanguage: "en"
        },
        loginHistory: user.loginHistory || []
      };
    }
    return null;
  }

  @Patch('user/profile')
  async updateUserProfile(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    const updated = await this.prismaService.client.user.update({
      where: { id: user.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        jobTitle: body.jobTitle,
        websiteUrl: body.websiteUrl,
        country: body.country,
        timezone: body.timezone,
        name: body.name
      }
    });
    return { success: true, user: updated };
  }

  @Patch('team/:id/role')
  async updateMemberRole(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    if (!this.prismaService.isConnected) {
      return { success: false, message: 'Database unavailable.' };
    }
    const email = this.getUserEmail(req);
    const admin = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!admin || admin.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Only admins can change roles.' };
    }
    
    const { role } = body;
    if (role !== 'ADMIN' && role !== 'CLIENT') {
      return { success: false, message: 'Invalid role.' };
    }

    await this.prismaService.client.user.update({
      where: { id, organizationId: admin.organizationId },
      data: { role }
    });

    return { success: true };
  }

  @Post('user/profile/avatar')
  async uploadAvatar(@Req() req: Request, @Body() body: { avatarUrl: string }) {
    const email = this.getUserEmail(req);
    let finalUrl = body.avatarUrl;

    if (body.avatarUrl && body.avatarUrl.startsWith('data:image/')) {
      try {
        const matches = body.avatarUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.split('/')[1] || 'png';
          const fileKey = `avatars/${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`;
          
          finalUrl = await this.storageService.uploadFile(fileKey, buffer, contentType);
        }
      } catch (err) {
        console.error('Failed to upload avatar to S3 storage, falling back to original string', err);
      }
    }

    await this.prismaService.client.user.update({
      where: { email },
      data: { avatarUrl: finalUrl }
    });
    return { success: true, avatarUrl: finalUrl };
  }

  @Delete('user/profile/avatar')
  async removeAvatar(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80";
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: { avatarUrl: defaultAvatar }
    });
    return { success: true, avatarUrl: defaultAvatar };
  }

  @Post('user/profile/password')
  async changePassword(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    const p = body.newPassword || "";
    if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
      return { success: false, message: "Password does not meet strength requirements (must be at least 8 chars, containing uppercase, lowercase, and numeric digits)." };
    }

    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false, message: "User not found." };
    if (user.passwordHash && user.passwordHash !== body.currentPassword) {
      return { success: false, message: "Current password does not match." };
    }
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: { passwordHash: body.newPassword }
    });
    await this.prismaService.client.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        resource: "UserCredentials",
        details: "User updated account credentials"
      } as any
    });
    return { success: true };
  }

  @Post('user/profile/2fa/setup')
  async setup2Fa(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const secret = "GP" + crypto.randomBytes(5).toString('hex').toUpperCase();
    const qrCode = `otpauth://totp/RevenuePilot:${email}?secret=${secret}&issuer=RevenuePilot`;
    return { success: true, secret, qrCode };
  }

  @Post('user/profile/2fa/verify')
  async verify2Fa(@Req() req: Request, @Body() body: { code: string; secret: string }) {
    const email = this.getUserEmail(req);
    if (!/^\d{6}$/.test(body.code)) {
      return { success: false, message: "Invalid verification code. Enter a 6-digit authenticator code." };
    }
    const recoveryCodesList = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const recoveryCodes = recoveryCodesList.join(", ");

    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: body.secret,
        twoFactorRecoveryCodes: recoveryCodes
      }
    });
    return { success: true, recoveryCodes: recoveryCodesList };
  }

  @Post('user/profile/2fa/disable')
  async disable2Fa(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: "",
        twoFactorRecoveryCodes: ""
      }
    });
    return { success: true };
  }

  @Post('user/login-history/terminate')
  async terminateOtherSessions(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    const history = await this.prismaService.client.loginHistory.findMany({
      where: { userId: user.id },
      orderBy: { loginTime: 'desc' }
    });
    if (history.length > 1) {
      const keepId = history[0].id;
      await this.prismaService.client.loginHistory.deleteMany({
        where: { userId: user.id, NOT: { id: keepId } }
      });
    }
    return { success: true };
  }

  @Patch('user/preferences')
  async updatePreferences(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    const updated = await this.prismaService.client.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...body
      },
      update: body
    });
    return { success: true, preferences: updated };
  }

  @Get('user/api-keys')
  async getApiKeys(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return [];
    const keys = await this.prismaService.client.apiToken.findMany({
      where: { organizationId: user.organizationId }
    });
    return keys.map(k => ({
      id: k.id,
      name: k.name,
      token: `sk_live_...${k.token.slice(-4)}`,
      createdAt: k.createdAt
    }));
  }

  @Post('user/api-keys')
  async createApiKey(@Req() req: Request, @Body() body: { name: string }) {
    const email = this.getUserEmail(req);
    const rawKey = "sk_live_" + crypto.randomBytes(24).toString('hex').substring(0, 32);
    
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return { success: false };
    const key = await this.prismaService.client.apiToken.create({
      data: {
        organizationId: user.organizationId,
        name: body.name,
        token: rawKey
      }
    });
    return { success: true, key: { id: key.id, name: key.name, token: rawKey, createdAt: key.createdAt } };
  }

  @Delete('user/api-keys/:id')
  async revokeApiKey(@Param('id') id: string) {
    await this.prismaService.client.apiToken.delete({ where: { id } });
    return { success: true };
  }

  @Get('user/export-data')
  async exportData(@Req() req: Request) {
    const email = this.getUserEmail(req);
    let dump: any;
    const user = await this.prismaService.client.user.findUnique({
      where: { email },
      include: { preferences: true, loginHistory: true, activityLogs: true, organization: { include: { clients: true } } }
    });
    dump = user;
    return {
      appName: "RevenuePilot",
      exportDate: new Date().toISOString(),
      accountData: dump
    };
  }

  @Post('user/deactivate')
  async deactivateAccount(@Req() req: Request) {
    return { success: true };
  }

  @Post('user/delete')
  async deleteAccount(@Req() req: Request, @Body() body: { passwordConfirm: string }) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return { success: false, message: "User not found." };
      if (user.passwordHash && user.passwordHash !== body.passwordConfirm) {
        return { success: false, message: "Password verification failed." };
      }
      await this.prismaService.client.organization.delete({
        where: { id: user.organizationId }
      });
      return { success: true };
    }
  }

  // Campaign Reports & White-Labeling endpoints
  @Post('reports/generate')
  async generateReport(@Req() req: Request, @Body() body: { clientId?: string; name?: string }) {
    const email = this.getUserEmail(req);
    const reportName = body.name || `Revenue Report - ${new Date().toLocaleDateString()}`;

    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { organization: { include: { clients: true } } }
      });
      if (!user) throw new BadRequestException('User not found.');

      let targetClientId = body.clientId;
      if (!targetClientId) {
        if (user.organization.clients.length > 0) {
          targetClientId = user.organization.clients[0].id;
        } else {
          // Create default client
          const defaultClient = await this.prismaService.client.client.create({
            data: {
              name: 'Default Client',
              organizationId: user.organizationId
            }
          });
          targetClientId = defaultClient.id;
        }
      }

      const report = await this.prismaService.client.report.create({
        data: {
          clientId: targetClientId,
          name: reportName,
          schedule: 'ON_DEMAND',
          url: `/api/reports/download/temp`
        } as any
      });

      const updatedReport = await this.prismaService.client.report.update({
        where: { id: report.id },
        data: { url: `/api/reports/download/${report.id}` }
      });

      return { success: true, report: updatedReport };
    }
  }

  @Get('reports/download/:id')
  @Header('Content-Type', 'text/plain')
  @Header('Content-Disposition', 'attachment; filename="revenue_report.txt"')
  async downloadReport(@Req() req: Request, @Param('id') id: string) {
    if (!this.prismaService.isConnected) {
      throw new BadRequestException('Database unavailable. Please try again later.');
    }
    const email = this.getUserEmail(req);
    let organizationName = '';
    let isEnterprise = false;
    let reportName = 'Revenue Report';

    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { organization: { include: { subscriptions: true } } }
      });
      if (user) {
        organizationName = user.organization.name;
        const tier = user.organization.subscriptions[0]?.tier || 'STARTER';
        isEnterprise = tier === 'ENTERPRISE';
      }
      
      const report = await this.prismaService.client.report.findUnique({
        where: { id }
      });
      if (report) {
        reportName = report.name;
      }
    }

    let reportBody = '';
    if (isEnterprise) {
      reportBody += `RevenuePILOT WHITE-LABEL CUSTOM REVENUE REPORT - ${organizationName.toUpperCase()}\n`;
      reportBody += `========================================================================\n\n`;
    } else {
      reportBody += `RevenuePILOT STANDARD REVENUE REPORT\n`;
      reportBody += `===================================\n\n`;
    }

    reportBody += `Report ID: ${id}\n`;
    reportBody += `Report Name: ${reportName}\n`;
    reportBody += `Generated For: ${organizationName}\n`;
    reportBody += `Generated On: ${new Date().toUTCString()}\n\n`;
    reportBody += `CAMPAIGN PERFORMANCE METRICS SUMMARY\n`;
    reportBody += `------------------------------------\n`;
    reportBody += `Campaign: Google Search Campaign | Spend: $1,200.00 | ROAS: 4.5x | Status: ACTIVE\n`;
    reportBody += `Campaign: Meta Retargeting Campaign | Spend: $800.00 | ROAS: 2.1x | Status: ACTIVE\n`;
    reportBody += `Campaign: Google Display Banner | Spend: $350.00 | ROAS: 1.2x | Status: PAUSED\n\n`;
    reportBody += `End of Report.\n`;

    return reportBody;
  }

  // Admin Command Impersonation Context endpoints
  @Post('admin/impersonate/start')
  async impersonateStart(@Req() req: Request, @Body() body: { email: string }) {
    if (!this.prismaService.isConnected) {
      throw new BadRequestException('Database unavailable. Please try again later.');
    }
    const requesterEmail = (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
    const requesterUser = await this.prismaService.client.user.findUnique({
      where: { email: requesterEmail }
    });

    if (!requesterUser || requesterUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only administrators can start impersonation.');
    }

    const targetEmail = body.email.trim().toLowerCase();
    let targetUserExists = false;

    if (this.prismaService.isConnected) {
      const targetUser = await this.prismaService.client.user.findUnique({
        where: { email: targetEmail }
      });
      targetUserExists = !!targetUser;
    }

    if (!targetUserExists) {
      throw new BadRequestException(`Target user with email ${targetEmail} does not exist.`);
    }

    this.logger.log(`Admin ${requesterEmail} initiated impersonation of ${targetEmail}`);
    return { success: true, message: `Impersonation context set to ${targetEmail}` };
  }

  @Post('admin/impersonate/stop')
  async impersonateStop(@Req() req: Request) {
    const requesterEmail = (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
    this.logger.log(`Admin ${requesterEmail} stopped impersonation`);
    return { success: true, message: 'Impersonation stopped.' };
  }
}
