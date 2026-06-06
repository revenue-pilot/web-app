import { Module } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';

@Module({
  providers: [GoogleAdsService, MetaAdsService],
  exports: [GoogleAdsService, MetaAdsService],
})
export class IntegrationsModule {}
