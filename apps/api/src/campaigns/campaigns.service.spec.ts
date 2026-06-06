import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      isConnected: false,
      simulator: {
        getOrCreateUser: jest.fn().mockReturnValue({
          org: { id: 'org_123', plan: 'starter' },
          user: { id: 'user_123', email: 'arjun@Revenuepilot.com' }
        }),
        getCampaigns: jest.fn().mockReturnValue([
          { id: 'camp_1', name: 'Performance Max - Campaign 1', platform: 'Google Ads', status: 'Active', spend: '₹0.00', roas: '0.0x', conversions: 0 }
        ])
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('should generate campaigns list from simulator', async () => {
      const campaigns = await service.getCampaigns('arjun@Revenuepilot.com');
      expect(campaigns).toBeInstanceOf(Array);
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe('Performance Max - Campaign 1');
    });
  });
});
