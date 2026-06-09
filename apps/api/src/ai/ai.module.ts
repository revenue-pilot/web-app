import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiEngineService } from './ai-engine.service';
import { OpenAIService } from './openai.service';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [CampaignsModule, PrismaModule, JobsModule], // Required to inject CampaignsService, PrismaService, and QueueService
  controllers: [AiController],
  providers: [AiService, AiEngineService, OpenAIService],
})
export class AiModule {}
