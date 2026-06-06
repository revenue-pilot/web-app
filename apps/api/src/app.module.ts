import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AutomationsModule } from './automations/automations.module';
import { EnterpriseController } from './enterprise.controller';
import { BillingService } from './billing/billing.service';
import { EmailService } from './email/email.service';
import { StorageService } from './storage/storage.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // limit each IP to 100 requests per ttl
    }]),
    PrismaModule, CampaignsModule, AiModule, IntegrationsModule, AutomationsModule, JobsModule
  ],
  controllers: [AppController, EnterpriseController],
  providers: [
    AppService,
    BillingService,
    StorageService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
