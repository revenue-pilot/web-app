import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseController } from './enterprise.controller';
import { SubscriptionGuard } from './subscription.guard';
import { PrismaService } from './prisma/prisma.service';
import { BillingService } from './billing/billing.service';
import { EmailService } from './email/email.service';
import { StorageService } from './storage/storage.service';
import { Request } from 'express';

describe('EnterpriseController', () => {
  let controller: EnterpriseController;

  const mockRequest = {
    headers: {
      'x-user-email': 'arjun@Revenuepilot.com'
    }
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
            simulator: {
              getOrCreateUser: jest.fn().mockImplementation((email: string) => {
                return {
                  org: { id: 'org_123', plan: 'starter' },
                  user: {
                    id: 'user_123',
                    email: email || 'arjun@Revenuepilot.com',
                    role: (email && email.startsWith('admin')) ? 'ADMIN' : 'CLIENT',
                    organizationId: 'org_123'
                  }
                };
              }),
              generateRatio: jest.fn().mockImplementation((body: any) => {
                return {
                  success: true,
                  asset: {
                    id: body.assetId,
                    versions: [
                      { ratio: body.ratio, width: 1080, height: 1350 }
                    ]
                  }
                };
              }),
              getUserProfile: jest.fn().mockImplementation((email: string) => {
                return { id: 'user_123', email, role: 'CLIENT', organizationId: 'org_123' };
              }),
              getWorkspaces: jest.fn().mockReturnValue([
                { id: 'space_1', name: 'Arjun Mehta Agency', role: 'Agency Owner', activeCampaigns: 24, spend: 245678, clientCount: 12, maxClients: 25 }
              ]),
              createWorkspace: jest.fn().mockReturnValue({
                id: 'space_1', name: 'New Workspace', role: 'Agency Owner'
              }),
              getClients: jest.fn().mockReturnValue([
                { id: 'client_1', name: 'EcoMart India', health: 92, spend: 152317, conversions: 5800, roas: '5.2x', status: 'Active', industry: 'E-Commerce', email: 'contact@ecomart.in' },
                { id: 'client_2', name: 'FitLife Gyms', health: 68, spend: 73820, conversions: 2100, roas: '3.1x', status: 'Active', industry: 'Health & Fitness', email: 'billing@fitlifegyms.com' },
                { id: 'client_3', name: 'UrbanStays Hotel', health: 88, spend: 19541, conversions: 1976, roas: '4.8x', status: 'Active', industry: 'Travel & Hospitality', email: 'concierge@urbanstays.com' },
                { id: 'client_4', name: 'Apex Logistics', health: 94, spend: 0, conversions: 0, roas: '0x', status: 'Onboarding', industry: 'Logistics', email: 'ops@apex.com' }
              ]),
              createClient: jest.fn().mockReturnValue({
                id: 'client_1', name: 'New Client', industry: 'Tech', email: 'test@client.com', status: 'Onboarding', health: 100, spend: 0, conversions: 0
              }),
              getCreatives: jest.fn().mockReturnValue([
                { id: 'c_1', name: 'Summer Promo Ad.png', type: 'Image', size: '1.4 MB', tag: 'Meta Ads', version: 'v2.0', lastModified: '2026-06-01', width: 1920, height: 1080, aspectRatio: '16:9', versions: [] }
              ]),
              createCreative: jest.fn().mockReturnValue({
                id: 'c_1', name: 'New Ad.png'
              }),
              getCampaigns: jest.fn().mockReturnValue([]),
              deployCampaign: jest.fn().mockReturnValue({}),
              users: [
                { id: 'user_123', email: 'arjun@Revenuepilot.com', role: 'CLIENT', organizationId: 'org_123' }
              ],
              invoices: []
            }
          }
        },
        {
          provide: BillingService,
          useValue: {
            createStripeCheckout: jest.fn().mockResolvedValue({ success: true }),
            createRazorpayOrder: jest.fn().mockResolvedValue({ success: true }),
            handleStripeWebhook: jest.fn().mockResolvedValue({ success: true }),
            handleRazorpayWebhook: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
            sendVerificationEmail: jest.fn().mockResolvedValue(true),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('http://s3.com/file'),
            deleteFile: jest.fn().mockResolvedValue(true),
            getPresignedDownloadUrl: jest.fn().mockResolvedValue('http://s3.com/file?sig'),
          },
        },
      ]
    })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true }) // Bypass guard for unit testing controller logic
      .compile();

    controller = module.get<EnterpriseController>(EnterpriseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWorkspaces', () => {
    it('should return workspaces list from simulator', async () => {
      const result = await controller.getWorkspaces(mockRequest);
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('name');
      expect(result[0].name).toBe('Arjun Mehta Agency');
    });
  });

  describe('getClients', () => {
    it('should return clients list from simulator', async () => {
      const result = await controller.getClients(mockRequest);
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('EcoMart India');
    });
  });

  describe('getPulseAnalytics', () => {
    it('should return pulse matrix data', async () => {
      const result = await controller.getPulseAnalytics(mockRequest);
      expect(result).toHaveProperty('attribution');
      expect(result).toHaveProperty('funnel');
      expect(result).toHaveProperty('cohorts');
    });
  });

  describe('getBillingInfo', () => {
    it('should return client subscription and invoices data', async () => {
      const result = await controller.getBillingInfo(mockRequest);
      expect(result).toHaveProperty('plan');
      expect(result).toHaveProperty('invoices');
      expect(result.plan).toBe('STARTER');
    });
  });

  describe('getTeamMembers', () => {
    it('should return team roster', async () => {
      const result = await controller.getTeamMembers(mockRequest);
      expect(result).toBeInstanceOf(Array);
      expect(result[0].email).toBe('arjun@Revenuepilot.com');
    });
  });

  describe('getCreatives', () => {
    it('should return assets list', async () => {
      const result = await controller.getCreatives(mockRequest);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('deployCampaign', () => {
    it('should simulate active deployment sequence steps', async () => {
      const result = await controller.deployCampaign(mockRequest, { campaignName: 'Black Friday Campaign' });
      expect(result.success).toBe(true);
      expect(result.name).toBe('Black Friday Campaign');
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps[0].status).toBe('SUCCESS');
    });
  });

  describe('generateRatio', () => {
    it('should return asset with 4:5 ratio crop', async () => {
      const result = await controller.generateRatio(mockRequest, { assetId: 'c_1', ratio: '4:5' });
      expect(result.success).toBe(true);
      expect(result.asset.versions).toContainEqual(
        expect.objectContaining({ ratio: '4:5', width: 1080, height: 1350 })
      );
    });
  });

  describe('reports', () => {
    it('should generate report and allow download', async () => {
      const genResult = await controller.generateReport(mockRequest, { clientId: 'client_1', name: 'Sales Report' });
      expect(genResult.success).toBe(true);
      expect(genResult.report.name).toBe('Sales Report');
      
      const downloadResult = await controller.downloadReport(mockRequest, genResult.report.id);
      expect(downloadResult).toContain('Sales Report');
      expect(downloadResult).toContain('RevenuePILOT STANDARD REVENUE REPORT');
    });
  });

  describe('impersonation', () => {
    const mockAdminRequest = {
      headers: {
        'x-user-email': 'admin@Revenuepilot.com'
      }
    } as unknown as Request;

    it('should block non-admin impersonation', async () => {
      await expect(controller.impersonateStart(mockRequest, { email: 'arjun@Revenuepilot.com' }))
        .rejects.toThrow();
    });

    it('should allow admin starting and stopping impersonation', async () => {
      const startResult = await controller.impersonateStart(mockAdminRequest, { email: 'arjun@Revenuepilot.com' });
      expect(startResult.success).toBe(true);
      expect(startResult.message).toContain('arjun@Revenuepilot.com');

      const stopResult = await controller.impersonateStop(mockAdminRequest);
      expect(stopResult.success).toBe(true);
    });
  });
});
