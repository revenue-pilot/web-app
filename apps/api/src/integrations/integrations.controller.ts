import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Integrations')
@Controller('api/v1/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly googleAdsService: GoogleAdsService,
    private readonly metaAdsService: MetaAdsService,
  ) {}

  @Get('google-ads/auth')
  @ApiOperation({ summary: 'Get Google Ads OAuth URL' })
  getGoogleAuthUrl(@Query('state') state: string) {
    return { url: this.googleAdsService.getAuthUrl(state) };
  }

  @Post('google-ads/callback')
  @ApiOperation({ summary: 'Handle Google Ads OAuth callback' })
  async handleGoogleCallback(
    @TenantId() orgId: string,
    @Body('code') code: string
  ) {
    await this.googleAdsService.handleCallback(code, orgId);
    return { success: true };
  }

  @Get('meta-ads/auth')
  @ApiOperation({ summary: 'Get Meta Ads OAuth URL' })
  getMetaAuthUrl(@Query('state') state: string) {
    return { url: this.metaAdsService.getAuthUrl(state) };
  }

  @Post('meta-ads/callback')
  @ApiOperation({ summary: 'Handle Meta Ads OAuth callback' })
  async handleMetaCallback(
    @TenantId() orgId: string,
    @Body('code') code: string
  ) {
    await this.metaAdsService.handleCallback(code, orgId);
    return { success: true };
  }
}
