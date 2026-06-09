import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue.service';

describe('AiService', () => {
  let service: AiService;
  let campaignsService: CampaignsService;

  const mockCampaigns = [
    { id: 'camp_1', name: 'Performance Max - Campaign 1', spend: '$1000.00', roas: '3.5x', conversions: 100 },
    { id: 'camp_2', name: 'Performance Max - Campaign 2', spend: '$2000.00', roas: '2.5x', conversions: 200 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: CampaignsService,
          useValue: {
            getCampaigns: jest.fn().mockResolvedValue(mockCampaigns),
            getMockCampaigns: jest.fn().mockReturnValue(mockCampaigns),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            isConnected: false,
            client: {},
            simulator: {},
          },
        },
        {
          provide: QueueService,
          useValue: {
            queueAiLog: jest.fn().mockResolvedValue(true),
            queueEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    campaignsService = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChatResponse', () => {
    it('should return a provider unavailable message when no AI provider is configured', async () => {
      (service as any).openai = null;
      const response = await service.getChatResponse('How are my campaigns performing?');
      expect(response).toContain('AI provider unavailable');
    });
  });

  describe('generateCampaign', () => {
    it('should reject when no AI provider is configured', async () => {
      (service as any).openai = null;
      await expect(service.generateCampaign({ businessName: 'TestCorp', budget: '$100/day' })).rejects.toThrow(
        'No configured AI provider available'
      );
    });
  });
});
