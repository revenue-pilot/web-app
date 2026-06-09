import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAdsService } from './google-ads.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock the google-ads-api library
jest.mock('google-ads-api', () => {
  return {
    GoogleAdsApi: jest.fn().mockImplementation(() => {
      return {
        Customer: jest.fn().mockImplementation(() => {
          return {
            query: jest.fn().mockResolvedValue([
              {
                campaign: { id: 'g-1', name: 'Search - Competitors', status: 'ENABLED' },
                metrics: { cost_micros: '1200000000', conversions_value: '1800' }
              }
            ]),
            campaigns: {
              update: jest.fn().mockResolvedValue({})
            }
          };
        })
      };
    })
  };
});

describe('GoogleAdsService', () => {
  let service: GoogleAdsService;

  const mockPrismaService = {
    isConnected: true,
    client: {
      adAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'acc_1',
          platformId: '123-456-7890',
          client: { organizationId: 'org_1' }
        })
      },
      integrationCredential: {
        findUnique: jest.fn().mockResolvedValue({
          refreshToken: 'mock_refresh_token'
        })
      },
      campaign: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'g-1',
          providerCampaignId: '987654321',
          adAccount: {
            platformId: '123-456-7890',
            client: { organizationId: 'org_1' }
          }
        }),
        update: jest.fn().mockResolvedValue({ id: 'g-1', status: 'PAUSED' })
      }
    }
  };

  beforeAll(() => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'test-developer-token';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAdsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<GoogleAdsService>(GoogleAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('should query google ads campaigns list', async () => {
      const result = await service.getCampaigns('acc_1');
      expect(result).toBeInstanceOf(Array);
      expect(result[0].id).toBe('g-1');
      expect(result[0].spend).toBe(1200);
      expect(result[0].roas).toBe(1.5);
    });
  });

  describe('pauseCampaign', () => {
    it('should pause campaign and update local database status', async () => {
      const result = await service.pauseCampaign('g-1');
      expect(result.success).toBe(true);
      expect(result.status).toBe('PAUSED');
      expect(mockPrismaService.client.campaign.update).toHaveBeenCalledWith({
        where: { id: 'g-1' },
        data: { status: 'PAUSED' }
      });
    });
  });
});

