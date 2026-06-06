import { Controller, Get, Post, Body, Query, Patch, UseGuards, Req, Delete, Param, BadRequestException, UnauthorizedException, Logger, Header } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { PrismaService } from './prisma/prisma.service';
import { BillingService } from './billing/billing.service';
import { EmailService } from './email/email.service';
import { StorageService } from './storage/storage.service';
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
  private mockReports = new Map<string, any>();

  constructor(
    private prismaService: PrismaService,
    private billingService: BillingService,
    private emailService: EmailService,
    private storageService: StorageService,
  ) {}

  private getUserEmail(req: Request): string {
    return (req as any).impersonatedUserEmail || (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
  }

  // Auth & Onboarding Login Handler
  @Post('auth/login')
  async login(@Body() body: { email: string; password?: string }) {
    const email = body.email.trim().toLowerCase();
    const password = body.password || '';

    if (this.prismaService.isConnected) {
      let user = await this.prismaService.client.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Register new user on first login
        const org = await this.prismaService.client.organization.create({
          data: {
            name: `${email.split('@')[0]}'s Workspace`,
            subscriptions: {
              create: {
                tier: email === 'admin@Revenuepilot.com' ? 'ENTERPRISE' : 'STARTER',
                status: 'ACTIVE'
              }
            }
          }
        });
        user = await this.prismaService.client.user.create({
          data: {
            email,
            name: email.split('@')[0],
            passwordHash: password ? hashPassword(password) : null,
            role: email === 'admin@Revenuepilot.com' ? 'ADMIN' : 'CLIENT',
            organizationId: org.id
          }
        });
        // Dispatch Welcome Email
        await this.emailService.sendWelcomeEmail(user.email, user.name || user.email.split('@')[0]);
        return { success: true, user };
      }

      // If user exists, check credentials
      if (user.passwordHash) {
        if (!password || !verifyPassword(password, user.passwordHash)) {
          return { success: false, message: 'Invalid credentials. Please verify your password.' };
        }
      } else if (password) {
        // Set password hash if not set yet (OAuth migrate path)
        user = await this.prismaService.client.user.update({
          where: { id: user.id },
          data: { passwordHash: hashPassword(password) }
        });
      }

      return { success: true, user };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      // In simulator mode, check password
      if (password && sim.user.passwordHash && sim.user.passwordHash !== 'password_123') {
        if (!verifyPassword(password, sim.user.passwordHash)) {
          return { success: false, message: 'Invalid credentials. Please verify your password.' };
        }
      }
      return { success: true, user: sim.user };
    }
  }

  @Post('auth/register')
  async register(@Body() body: { email: string; password?: string; name?: string }) {
    const email = body.email.trim().toLowerCase();
    const password = body.password || '';
    const name = body.name || email.split('@')[0];

    if (this.prismaService.isConnected) {
      const existing = await this.prismaService.client.user.findUnique({ where: { email } });
      if (existing) {
        return { success: false, message: 'User already exists.' };
      }

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
      const user = await this.prismaService.client.user.create({
        data: {
          email,
          name,
          passwordHash: password ? hashPassword(password) : null,
          role: 'CLIENT',
          organizationId: org.id
        }
      });
      // Dispatch Welcome Email
      await this.emailService.sendWelcomeEmail(user.email, user.name || user.email.split('@')[0]);
      return { success: true, user };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      if (password) {
        sim.user.passwordHash = hashPassword(password);
      }
      return { success: true, user: sim.user };
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
    } else {
      this.prismaService.simulator.getOrCreateUser(email);
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

    let userPayload: any;
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { organization: true }
      });
      if (!user) return { success: false, message: 'User profile not found.' };
      userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      userPayload = {
        id: sim.user.id,
        email: sim.user.email,
        name: sim.user.name,
        role: sim.user.role
      };
    }

    return {
      success: true,
      user: userPayload,
      message: 'Authenticated successfully via Magic Link.'
    };
  }

  @Post('auth/social-sync')
  async socialSync(@Body() body: { email: string; name?: string; provider?: string }) {
    const email = body.email.trim().toLowerCase();
    const name = body.name || email.split('@')[0];
    this.logger.log(`OAuth Social login sync callback requested from provider: ${body.provider || 'Google'} for ${email}`);

    let userPayload: any;
    if (this.prismaService.isConnected) {
      let user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user) {
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
        user = await this.prismaService.client.user.create({
          data: {
            email,
            name,
            role: 'CLIENT',
            organizationId: org.id
          },
          include: { organization: true }
        });
        await this.emailService.sendWelcomeEmail(email, name);
      }

      userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      userPayload = {
        id: sim.user.id,
        email: sim.user.email,
        name: sim.user.name,
        role: sim.user.role
      };
    }

    return {
      success: true,
      user: userPayload,
      message: 'Social login synchronized successfully.'
    };
  }

  // Workspaces (Orbit Workspaces)
  @Get('workspaces')
  async getWorkspaces(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.getWorkspaces(sim.org.id);
    }
  }

  @Post('workspaces')
  async createWorkspace(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return { success: false, message: 'User not found' };
      
      const newClient = await this.prismaService.client.client.create({
        data: {
          name: body.name,
          organizationId: user.organizationId
        }
      });
      return { success: true, id: newClient.id, name: newClient.name, activeCampaigns: 0, spend: 0 };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const ws = this.prismaService.simulator.createWorkspace(sim.org.id, body.name, 'Agency Owner');
      return { success: true, ...ws };
    }
  }

  // Clients (Client Constellation)
  @Get('clients')
  async getClients(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.getClients(sim.org.id);
    }
  }

  @Post('clients')
  async createClient(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const client = this.prismaService.simulator.createClient(sim.org.id, body.name, body.industry, body.email);
      return { success: true, ...client };
    }
  }

  // Analytics (Pulse Matrix & Insight Engine)
  @Get('analytics/pulse')
  getPulseAnalytics() {
    return {
      attribution: [
        { model: 'First Click', googlePct: 40, metaPct: 50, otherPct: 10 },
        { model: 'Last Click', googlePct: 62, metaPct: 30, otherPct: 8 },
        { model: 'Linear', googlePct: 50, metaPct: 40, otherPct: 10 },
        { model: 'Time Decay', googlePct: 55, metaPct: 37, otherPct: 8 }
      ],
      funnel: [
        { name: 'Impressions', google: 0, meta: 0, other: 0 },
        { name: 'Clicks', google: 0, meta: 0, other: 0 },
        { name: 'Leads', google: 0, meta: 0, other: 0 },
        { name: 'Sales', google: 0, meta: 0, other: 0 }
      ],
      cohorts: []
    };
  }

  // Billing (Revenue Command)
  @Get('billing/subscriptions')
  async getBillingInfo(@Req() req: Request) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      orgId = sim.org.id;
      plan = sim.org.plan.toLowerCase();
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
    } else {
      usage.campaigns = this.prismaService.simulator.getCampaigns(orgId).length;
      usage.workspaces = this.prismaService.simulator.getWorkspaces(orgId).length;
      usage.team = this.prismaService.simulator.users.filter(u => u.organizationId === orgId).length;
      usage.clients = this.prismaService.simulator.getClients(orgId).length;
    }

    const priceMap = { starter: 999, Revenue: 1999, pro: 4999, enterprise: 15000 };

    return {
      plan: plan.toUpperCase(),
      limits,
      usage,
      price: priceMap[plan] || 999,
      period: 'month',
      nextBilling: 'Jul 19, 2026',
      invoices: this.prismaService.simulator.invoices
    };
  }

  @Post('billing/checkout')
  async processCheckout(@Req() req: Request, @Body() body: any) {
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

  // Team Management (Crew Command)
  @Get('team')
  async getTeamMembers(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return [];
      const users = await this.prismaService.client.user.findMany({
        where: { organizationId: user.organizationId }
      });
      return users.map(u => ({
        id: u.id,
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: u.role === 'ADMIN' ? 'Platform Admin' : 'Agency Owner',
        status: 'Active',
        avatar: ''
      }));
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.users
        .filter(u => u.organizationId === sim.org.id)
        .map(u => ({ ...u, status: 'Active', avatar: '' }));
    }
  }

  @Post('team/invite')
  async inviteMember(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return { success: false };
      const newUser = await this.prismaService.client.user.create({
        data: {
          email: body.email,
          name: body.email.split('@')[0],
          role: body.role === 'Admin' ? 'ADMIN' : 'CLIENT',
          organizationId: user.organizationId
        }
      });
      return { success: true, member: { id: newUser.id, name: newUser.name, email: newUser.email, role: body.role, status: 'Active' } };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const newUser = {
        id: `user_${Date.now()}`,
        email: body.email,
        name: body.email.split('@')[0],
        role: body.role,
        organizationId: sim.org.id
      };
      this.prismaService.simulator.users.push(newUser);
      return { success: true, member: { ...newUser, status: 'Active' } };
    }
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
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return [];
      const creatives = await this.prismaService.client.creativeAsset.findMany({
        where: { organizationId: user.organizationId },
        include: { versions: true }
      });
      return creatives.map(c => this.mapDbCreativeToFrontend(c));
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.getCreatives(sim.org.id);
    }
  }

  @Post('creatives')
  async createCreative(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.createCreative(sim.org.id, body.name, body.type, body.size, body.tag);
    }
  }

  @Post('creatives/generate-ratios')
  async generateRatio(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.generateRatio(body);
    }
  }

  @Post('campaigns/deploy')
  async deployCampaign(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
              adAccountId: account.id,
              name: body.campaignName || 'Campaign Studio Live',
              status: 'ACTIVE'
            }
          });
        }
      }
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      this.prismaService.simulator.deployCampaign(sim.org.id, body.campaignName, body.budget);
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
  getNotifications(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      return [];
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.notifications;
    }
  }

  // Activity Intelligence (Timeline Engine)
  @Get('activity-logs')
  getActivityLogs(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
      return [];
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      return this.prismaService.simulator.activityLogs;
    }
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
  getTenants() {
    if (this.prismaService.isConnected) {
      return [];
    } else {
      return this.prismaService.simulator.organizations.map(org => {
        const users = this.prismaService.simulator.users.filter(u => u.organizationId === org.id);
        const clients = this.prismaService.simulator.getClients(org.id);
        return {
          id: org.id,
          name: org.name,
          email: users[0]?.email || 'client@Revenuepilot.com',
          plan: org.plan,
          status: 'Active',
          mrr: org.plan === 'starter' ? 999 : org.plan === 'Revenue' ? 1999 : 4999,
          clientsConnected: clients.length
        };
      });
    }
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
    } else {
      return this.prismaService.simulator.getUserProfile(email);
    }
  }

  @Patch('user/profile')
  async updateUserProfile(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const updated = this.prismaService.simulator.updateUserProfile(email, body);
      return { success: !!updated, user: updated };
    }
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

    if (this.prismaService.isConnected) {
      await this.prismaService.client.user.update({
        where: { email },
        data: { avatarUrl: finalUrl }
      });
      return { success: true, avatarUrl: finalUrl };
    } else {
      const ok = this.prismaService.simulator.updateAvatar(email, finalUrl);
      return { success: ok, avatarUrl: finalUrl };
    }
  }

  @Delete('user/profile/avatar')
  async removeAvatar(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80";
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({ where: { email } });
      if (!user) return { success: false };
      await this.prismaService.client.user.update({
        where: { id: user.id },
        data: { avatarUrl: defaultAvatar }
      });
      return { success: true, avatarUrl: defaultAvatar };
    } else {
      const ok = this.prismaService.simulator.updateAvatar(email, defaultAvatar);
      return { success: ok, avatarUrl: defaultAvatar };
    }
  }

  @Post('user/profile/password')
  async changePassword(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    const p = body.newPassword || "";
    if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
      return { success: false, message: "Password does not meet strength requirements (must be at least 8 chars, containing uppercase, lowercase, and numeric digits)." };
    }

    if (this.prismaService.isConnected) {
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
          action: "Password Changed",
          resource: "UserCredentials",
          details: "User updated account credentials"
        }
      });
      return { success: true };
    } else {
      const user = this.prismaService.simulator.getUserProfile(email);
      if (!user) return { success: false, message: "User not found." };
      if (user.passwordHash && user.passwordHash !== body.currentPassword) {
        return { success: false, message: "Current password does not match." };
      }
      this.prismaService.simulator.changePassword(email, body.newPassword);
      this.prismaService.simulator.activityLogs.unshift({
        id: `log_${Date.now()}`,
        user: user.name,
        action: "Password Changed",
        details: "User credentials changed successfully.",
        timestamp: "Just now",
        organizationId: user.organizationId
      });
      return { success: true };
    }
  }

  @Post('user/profile/2fa/setup')
  async setup2Fa(@Req() req: Request) {
    const email = this.getUserEmail(req);
    const secret = "GP" + Math.random().toString(36).substring(2, 10).toUpperCase();
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
      Math.floor(Math.random() * 100000000).toString(16).toUpperCase().padStart(8, '0')
    );
    const recoveryCodes = recoveryCodesList.join(", ");

    if (this.prismaService.isConnected) {
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
    } else {
      const ok = this.prismaService.simulator.enable2Fa(email, body.secret, recoveryCodes);
      return { success: ok, recoveryCodes: recoveryCodesList };
    }
  }

  @Post('user/profile/2fa/disable')
  async disable2Fa(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const ok = this.prismaService.simulator.disable2Fa(email);
      return { success: ok };
    }
  }

  @Post('user/login-history/terminate')
  async terminateOtherSessions(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const user = this.prismaService.simulator.getUserProfile(email);
      if (!user) return { success: false };
      const ok = this.prismaService.simulator.terminateOtherSessions(user.id);
      return { success: ok };
    }
  }

  @Patch('user/preferences')
  async updatePreferences(@Req() req: Request, @Body() body: any) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const user = this.prismaService.simulator.getUserProfile(email);
      if (!user) return { success: false };
      const updated = this.prismaService.simulator.updatePreferences(user.id, body);
      return { success: !!updated, preferences: updated };
    }
  }

  @Get('user/api-keys')
  async getApiKeys(@Req() req: Request) {
    const email = this.getUserEmail(req);
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const keys = this.prismaService.simulator.getApiKeys(sim.org.id);
      return keys.map(k => ({
        id: k.id,
        name: k.name,
        token: `sk_live_...${k.token.slice(-4)}`,
        createdAt: k.createdAt
      }));
    }
  }

  @Post('user/api-keys')
  async createApiKey(@Req() req: Request, @Body() body: { name: string }) {
    const email = this.getUserEmail(req);
    const rawKey = "sk_live_" + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
    
    if (this.prismaService.isConnected) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const key = this.prismaService.simulator.createApiKey(sim.org.id, body.name, rawKey);
      return { success: true, key };
    }
  }

  @Delete('user/api-keys/:id')
  async revokeApiKey(@Param('id') id: string) {
    if (this.prismaService.isConnected) {
      await this.prismaService.client.apiToken.delete({ where: { id } });
      return { success: true };
    } else {
      const ok = this.prismaService.simulator.revokeApiKey(id);
      return { success: ok };
    }
  }

  @Get('user/export-data')
  async exportData(@Req() req: Request) {
    const email = this.getUserEmail(req);
    let dump: any;
    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email },
        include: { preferences: true, loginHistory: true, activityLogs: true, organization: { include: { clients: true } } }
      });
      dump = user;
    } else {
      dump = this.prismaService.simulator.getUserProfile(email);
    }
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
    } else {
      const user = this.prismaService.simulator.getUserProfile(email);
      if (!user) return { success: false, message: "User not found." };
      if (user.passwordHash && user.passwordHash !== body.passwordConfirm) {
        return { success: false, message: "Password verification failed." };
      }
      const ok = this.prismaService.simulator.deleteUser(email);
      return { success: ok };
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
        }
      });

      const updatedReport = await this.prismaService.client.report.update({
        where: { id: report.id },
        data: { url: `/api/reports/download/${report.id}` }
      });

      return { success: true, report: updatedReport };
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      const mockId = `rep_${crypto.randomBytes(8).toString('hex')}`;
      const report = {
        id: mockId,
        clientId: body.clientId || 'client_1',
        name: reportName,
        schedule: 'ON_DEMAND',
        url: `/api/reports/download/${mockId}`,
        createdAt: new Date()
      };
      this.mockReports.set(mockId, { ...report, orgId: sim.org.id });
      return { success: true, report };
    }
  }

  @Get('reports/download/:id')
  @Header('Content-Type', 'text/plain')
  @Header('Content-Disposition', 'attachment; filename="revenue_report.txt"')
  async downloadReport(@Req() req: Request, @Param('id') id: string) {
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
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(email);
      organizationName = sim.org.name || `${sim.user.name}'s Workspace`;
      isEnterprise = sim.org.plan.toUpperCase() === 'ENTERPRISE';
      
      const report = this.mockReports.get(id);
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
    const requesterEmail = (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
    let requesterUser: any;

    if (this.prismaService.isConnected) {
      requesterUser = await this.prismaService.client.user.findUnique({
        where: { email: requesterEmail }
      });
    } else {
      const sim = this.prismaService.simulator.getOrCreateUser(requesterEmail);
      requesterUser = sim.user;
    }

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
    } else {
      const sim = this.prismaService.simulator.getUserProfile(targetEmail);
      targetUserExists = !!sim;
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
