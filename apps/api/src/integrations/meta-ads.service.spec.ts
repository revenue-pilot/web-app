import { Test, TestingModule } from '@nestjs/testing';
import { MetaAdsService } from './meta-ads.service';

describe('MetaAdsService', () => {
  let service: MetaAdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetaAdsService],
    }).compile();

    service = module.get<MetaAdsService>(MetaAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('should return mock meta ads campaigns list', async () => {
      const result = await service.getCampaigns('acc_2');
      expect(result).toBeInstanceOf(Array);
      expect(result[0].id).toBe('m-1');
    });
  });

  describe('pauseCampaign', () => {
    it('should return success payload', async () => {
      const result = await service.pauseCampaign('m-1');
      expect(result.success).toBe(true);
      expect(result.status).toBe('PAUSED');
    });
  });
});
