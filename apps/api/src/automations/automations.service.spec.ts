import { Test, TestingModule } from '@nestjs/testing';
import { AutomationsService } from './automations.service';
import { GoogleAdsService } from '../integrations/google-ads.service';
import { MetaAdsService } from '../integrations/meta-ads.service';

describe('AutomationsService', () => {
  let service: AutomationsService;
  let googleAds: GoogleAdsService;
  let metaAds: MetaAdsService;

  const mockGoogleCampaigns = [
    { id: 'g-1', name: 'Search - Competitors', spend: 1200, roas: 0.5, status: 'ENABLED' },
    { id: 'g-2', name: 'Performance Max - Q4', spend: 4500, roas: 3.2, status: 'ENABLED' }
  ];

  const mockMetaCampaigns = [
    { id: 'm-1', name: 'Advantage+ Shopping', spend: 2300, roas: 4.1, status: 'ACTIVE' },
    { id: 'm-2', name: 'Retargeting EU', spend: 850, roas: 0.8, status: 'ACTIVE' }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        {
          provide: GoogleAdsService,
          useValue: {
            getCampaigns: jest.fn().mockResolvedValue(mockGoogleCampaigns),
            pauseCampaign: jest.fn().mockResolvedValue({ success: true, status: 'PAUSED' })
          }
        },
        {
          provide: MetaAdsService,
          useValue: {
            getCampaigns: jest.fn().mockResolvedValue(mockMetaCampaigns),
            pauseCampaign: jest.fn().mockResolvedValue({ success: true, status: 'PAUSED' })
          }
        }
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
    googleAds = module.get<GoogleAdsService>(GoogleAdsService);
    metaAds = module.get<MetaAdsService>(MetaAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateRules', () => {
    it('should trigger and pause campaigns under 1.0 ROAS and > 500 spend', async () => {
      await service.evaluateRules();
      
      expect(googleAds.getCampaigns).toHaveBeenCalledWith('account_1');
      expect(metaAds.getCampaigns).toHaveBeenCalledWith('account_2');
      
      // g-1 roas = 0.5, spend = 1200 -> should pause
      expect(googleAds.pauseCampaign).toHaveBeenCalledWith('g-1');
      
      // m-2 roas = 0.8, spend = 850 -> should pause
      expect(metaAds.pauseCampaign).toHaveBeenCalledWith('m-2');

      // g-2 roas = 3.2 -> should NOT pause
      expect(googleAds.pauseCampaign).not.toHaveBeenCalledWith('g-2');
    });
  });
});
