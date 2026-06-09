import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsService } from './integrations.service';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleAdsService, MetaAdsService],
  exports: [IntegrationsService, GoogleAdsService, MetaAdsService],
})
export class IntegrationsModule {}
