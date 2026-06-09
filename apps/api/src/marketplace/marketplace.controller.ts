import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { RolesGuard } from '../auth/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Marketplace')
@Controller('api/v1/marketplace')
@UseGuards(RolesGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('apps')
  @ApiOperation({ summary: 'List all available apps' })
  async listApps() {
    return this.marketplaceService.listApps();
  }

  @Get('installations')
  @ApiOperation({ summary: 'List installed apps' })
  async listInstallations(@TenantId() organizationId: string) {
    return this.marketplaceService.listInstallations(organizationId);
  }

  @Post('apps/:appId/install')
  @ApiOperation({ summary: 'Install an app' })
  async installApp(
    @TenantId() organizationId: string,
    @Param('appId') appId: string,
  ) {
    return this.marketplaceService.installApp(organizationId, appId);
  }

  @Post('apps/:appId/uninstall') // We can use POST for uninstall if frontend relies on it based on apiClient
  @ApiOperation({ summary: 'Uninstall an app' })
  async uninstallApp(
    @TenantId() organizationId: string,
    @Param('appId') appId: string,
  ) {
    return this.marketplaceService.uninstallApp(organizationId, appId);
  }
}
