import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { TrackingModule } from './tracking/tracking.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AutomationsModule } from './automations/automations.module';
import { BillingModule } from './billing/billing.module';
import { EmailModule } from './email/email.module';
import { StorageService } from './storage/storage.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SecurityModule } from './security/security.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CrmModule } from './crm/crm.module';
import { ReportsModule } from './reports/reports.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { EnterpriseController } from './enterprise.controller';
import { SubscriptionGuard } from './subscription.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().optional(),
        JWT_SECRET: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        REDIS_URL: Joi.string().optional(),
        SENTRY_DSN: Joi.string().optional(),
      })
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // limit each IP to 100 requests per ttl
    }]),
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? {
            url: process.env.REDIS_URL,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: process.env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
            retryStrategy: process.env.NODE_ENV === 'test' ? () => null : undefined,
          }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: process.env.NODE_ENV === 'test' ? () => null : undefined,
          },
    }),
    PrismaModule, TrackingModule, CampaignsModule, AiModule, IntegrationsModule, AutomationsModule, JobsModule, AuthModule, UsersModule, SecurityModule, OrganizationsModule, OnboardingModule, CrmModule, ReportsModule, MarketplaceModule, WebhooksModule, HealthModule, AdminModule, EmailModule, BillingModule
  ],
  controllers: [AppController, EnterpriseController],
  providers: [
    AppService,
    StorageService,
    SubscriptionGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
