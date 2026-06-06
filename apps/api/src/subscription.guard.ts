import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);
  constructor(private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let userEmail = request.headers['x-user-email'] || 'arjun@Revenuepilot.com';
    
    // Resolve impersonation context for ADMIN roles
    const impersonateHeader = request.headers['x-impersonate-user'];
    if (impersonateHeader) {
      let requesterIsAdmin = false;
      if (this.prismaService.isConnected) {
        const requester = await this.prismaService.client.user.findUnique({
          where: { email: userEmail }
        });
        if (requester && requester.role === 'ADMIN') {
          requesterIsAdmin = true;
        }
      } else {
        const sim = this.prismaService.simulator.getOrCreateUser(userEmail);
        if (sim.user.role === 'ADMIN') {
          requesterIsAdmin = true;
        }
      }

      if (requesterIsAdmin) {
        request['impersonatedUserEmail'] = impersonateHeader;
        userEmail = impersonateHeader;
      }
    }

    // Fallback overrides for visual tests if header is passed
    const headerPlan = request.headers['x-selected-plan'];
    let planKey = 'starter';
    let orgId = '';

    if (this.prismaService.isConnected) {
      const user = await this.prismaService.client.user.findUnique({
        where: { email: userEmail },
        include: {
          organization: {
            include: {
              subscriptions: true
            }
          }
        }
      });
      if (user) {
        orgId = user.organizationId;
        planKey = (user.organization.subscriptions[0]?.tier || 'STARTER').toLowerCase();
      }
    } else {
      // Connect to Simulator
      const sim = this.prismaService.simulator.getOrCreateUser(userEmail);
      orgId = sim.org.id;
      planKey = sim.org.plan.toLowerCase();
    }

    // Allow testing overrides if explicitly set in headers
    if (headerPlan) {
      planKey = (Array.isArray(headerPlan) ? headerPlan[0] : headerPlan).toLowerCase();
    }

    const limits = {
      starter: { campaigns: 3, workspaces: 1, team: 1, clients: 0 },
      Revenue: { campaigns: 15, workspaces: 3, team: 3, clients: 0 },
      pro: { campaigns: 99999, workspaces: 10, team: 10, clients: 0 },
      enterprise: { campaigns: 99999, workspaces: 99999, team: 99999, clients: 99999 }
    };

    const planLimits = limits[planKey] || limits.starter;

    // Resolve usage dynamics from database/simulator
    const currentUsage = { campaigns: 0, workspaces: 0, team: 0, clients: 0 };

    if (this.prismaService.isConnected) {
      currentUsage.campaigns = await this.prismaService.client.campaign.count({
        where: { adAccount: { client: { organizationId: orgId } } }
      });
      currentUsage.workspaces = await this.prismaService.client.client.count({ // workspaces equivalent
        where: { organizationId: orgId }
      });
      currentUsage.team = await this.prismaService.client.user.count({
        where: { organizationId: orgId }
      });
    } else {
      currentUsage.campaigns = this.prismaService.simulator.getCampaigns(orgId).length;
      currentUsage.workspaces = this.prismaService.simulator.getWorkspaces(orgId).length;
      currentUsage.team = this.prismaService.simulator.users.filter(u => u.organizationId === orgId).length;
      currentUsage.clients = this.prismaService.simulator.getClients(orgId).length;
    }

    const path = request.url;
    const method = request.method;

    // 1. Block Workspace Creation
    if (path.includes('/api/workspaces') && method === 'POST') {
      if (currentUsage.workspaces >= planLimits.workspaces) {
        throw new HttpException({
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Plan Limit Exceeded',
          message: `Workspace creation blocked. Your active plan (${planKey}) only allows ${planLimits.workspaces} workspace(s). Please upgrade to unlock more.`,
          limit: planLimits.workspaces,
          current: currentUsage.workspaces
        }, HttpStatus.PAYMENT_REQUIRED);
      }
    }

    // 2. Block Client Constellation (Agency Portal) access
    if (path.includes('/api/clients') && method === 'POST') {
      if (planKey !== 'enterprise') {
        throw new HttpException({
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Feature Locked',
          message: 'Client Constellation (Agency Portal) is only available on Enterprise plans.',
        }, HttpStatus.PAYMENT_REQUIRED);
      }
    }

    // 3. Block Automation Forge basic rule limits
    if (path.includes('/api/automations') && method === 'POST') {
      if (planKey === 'starter') {
        throw new HttpException({
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Feature Locked',
          message: 'Automation Forge is available in Revenue Plan and above.',
        }, HttpStatus.PAYMENT_REQUIRED);
      }
    }

    return true;
  }
}
