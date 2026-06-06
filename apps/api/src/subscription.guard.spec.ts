import { SubscriptionGuard } from './subscription.guard';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      isConnected: false,
      simulator: {
        getOrCreateUser: jest.fn().mockImplementation((email: string) => {
          const plan = email.includes('enterprise') ? 'enterprise' : email.includes('Revenue') ? 'Revenue' : 'starter';
          return {
            org: { id: 'org_123', plan },
            user: { id: 'user_123', email, role: 'CLIENT', organizationId: 'org_123' }
          };
        }),
        getCampaigns: jest.fn().mockReturnValue([]),
        getWorkspaces: jest.fn().mockReturnValue([{ id: 'ws_1' }]), // workspace count 1 to trigger starter limits
        users: {
          filter: jest.fn().mockReturnValue([{ id: 'user_123' }])
        },
        getClients: jest.fn().mockReturnValue([])
      }
    };
    guard = new SubscriptionGuard(mockPrismaService as PrismaService);
  });

  const createMockContext = (url: string, method: string, email: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          method,
          headers: {
            'x-user-email': email,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('Starter Plan Gating', () => {
    it('should block workspace creation (POST /api/workspaces)', async () => {
      const ctx = createMockContext('/api/workspaces', 'POST', 'starter@example.com');
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Plan Limit Exceeded',
            message: 'Workspace creation blocked. Your active plan (starter) only allows 1 workspace(s). Please upgrade to unlock more.',
            limit: 1,
            current: 1,
          },
          HttpStatus.PAYMENT_REQUIRED,
        ),
      );
    });

    it('should block automations creation (POST /api/automations)', async () => {
      const ctx = createMockContext('/api/automations', 'POST', 'starter@example.com');
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Feature Locked',
            message: 'Automation Forge is available in Revenue Plan and above.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        ),
      );
    });

    it('should allow GET /api/workspaces', async () => {
      const ctx = createMockContext('/api/workspaces', 'GET', 'starter@example.com');
      expect(await guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Revenue Plan Gating', () => {
    it('should allow workspace creation (POST /api/workspaces)', async () => {
      const ctx = createMockContext('/api/workspaces', 'POST', 'Revenue@example.com');
      // For Revenue plan limit is 3. Workspaces count is 1. 1 < 3 -> should allow
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow automation creation (POST /api/automations)', async () => {
      const ctx = createMockContext('/api/automations', 'POST', 'Revenue@example.com');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should block client creation (POST /api/clients)', async () => {
      const ctx = createMockContext('/api/clients', 'POST', 'Revenue@example.com');
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            error: 'Feature Locked',
            message: 'Client Constellation (Agency Portal) is only available on Enterprise plans.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        ),
      );
    });
  });

  describe('Enterprise Plan Gating', () => {
    it('should allow client creation (POST /api/clients)', async () => {
      const ctx = createMockContext('/api/clients', 'POST', 'enterprise@example.com');
      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('should allow workspace creation (POST /api/workspaces)', async () => {
      const ctx = createMockContext('/api/workspaces', 'POST', 'enterprise@example.com');
      expect(await guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Admin Impersonation Context', () => {
    const createMockImpersonateContext = (url: string, method: string, email: string, impersonateEmail: string): ExecutionContext => {
      const req = {
        url,
        method,
        headers: {
          'x-user-email': email,
          'x-impersonate-user': impersonateEmail
        },
      };
      return {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;
    };

    it('should set impersonation context if requester is admin', async () => {
      mockPrismaService.simulator.getOrCreateUser.mockImplementation((email: string) => {
        const plan = email.includes('admin') ? 'enterprise' : 'starter';
        return {
          org: { id: email.includes('admin') ? 'org_admin' : 'org_starter', plan },
          user: { id: 'admin_id', email, role: email.includes('admin') ? 'ADMIN' : 'CLIENT', organizationId: 'org_admin' }
        };
      });

      const ctx = createMockImpersonateContext('/api/workspaces', 'POST', 'admin@example.com', 'starter@example.com');
      const req = ctx.switchToHttp().getRequest() as any;
      
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        HttpException
      );
      
      expect(req.impersonatedUserEmail).toBe('starter@example.com');
    });

    it('should NOT set impersonation context if requester is CLIENT', async () => {
      mockPrismaService.simulator.getOrCreateUser.mockImplementation((email: string) => {
        return {
          org: { id: 'org_client', plan: 'enterprise' },
          user: { id: 'client_id', email, role: 'CLIENT', organizationId: 'org_client' }
        };
      });

      const ctx = createMockImpersonateContext('/api/workspaces', 'POST', 'client@example.com', 'starter@example.com');
      const req = ctx.switchToHttp().getRequest() as any;
      
      expect(await guard.canActivate(ctx)).toBe(true);
      expect(req.impersonatedUserEmail).toBeUndefined();
    });
  });
});
