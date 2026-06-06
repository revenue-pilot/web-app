import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAdsService } from './google-ads.service';

describe('GoogleAdsService', () => {
  let service: GoogleAdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAdsService],
    }).compile();

    service = module.get<GoogleAdsService>(GoogleAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('should return mock google ads campaigns list', async () => {
      const result = await service.getCampaigns('acc_1');
      expect(result).toBeInstanceOf(Array);
      expect(result[0].id).toBe('g-1');
    });
  });

  describe('pauseCampaign', () => {
    it('should return success payload', async () => {
      const result = await service.pauseCampaign('g-1');
      expect(result.success).toBe(true);
      expect(result.status).toBe('PAUSED');
    });
  });
});
