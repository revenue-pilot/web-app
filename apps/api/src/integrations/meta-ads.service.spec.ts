import { Test, TestingModule } from '@nestjs/testing';
import { MetaAdsService } from './meta-ads.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetaAdsService', () => {
  let service: MetaAdsService;
  let mockFetch: jest.Mock;

  const mockPrismaService = {
    isConnected: true,
    client: {
      adAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'acc_2',
          platformId: 'act_1234567890',
          client: { organizationId: 'org_1' }
        })
      },
      integrationCredential: {
        findUnique: jest.fn().mockResolvedValue({
          apiKey: 'mock_meta_access_token'
        })
      },
      campaign: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'm-1',
          providerCampaignId: '987654321',
          adAccount: {
            platformId: 'act_1234567890',
            client: { organizationId: 'org_1' }
          }
        }),
        update: jest.fn().mockResolvedValue({ id: 'm-1', status: 'PAUSED' })
      }
    }
  };

  beforeAll(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  beforeEach(async () => {
    mockFetch.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaAdsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<MetaAdsService>(MetaAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('should query meta ads campaigns list via Graph API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'm-1',
              name: 'Retargeting - All Visitors',
              status: 'ACTIVE',
              insights: {
                data: [
                  {
                    spend: '850',
                    website_purchase_roas: [{ value: '4.1' }]
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await service.getCampaigns('acc_2');
      expect(result).toBeInstanceOf(Array);
      expect(result[0].id).toBe('m-1');
      expect(result[0].spend).toBe(850);
      expect(result[0].roas).toBe(4.1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.facebook.com/v18.0/act_1234567890/campaigns')
      );
    });
  });

  describe('pauseCampaign', () => {
    it('should pause campaign and update local database status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      });

      const result = await service.pauseCampaign('m-1');
      expect(result.success).toBe(true);
      expect(result.status).toBe('PAUSED');
      expect(mockPrismaService.client.campaign.update).toHaveBeenCalledWith({
        where: { id: 'm-1' },
        data: { status: 'PAUSED' }
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.facebook.com/v18.0/987654321'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams)
        })
      );
    });
  });
});

