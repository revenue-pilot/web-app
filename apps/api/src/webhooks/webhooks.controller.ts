import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'AGENCY')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('endpoints')
  @ApiOperation({ summary: 'List webhook endpoints' })
  async getEndpoints(@TenantId() organizationId: string) {
    return this.webhooksService.getEndpoints(organizationId);
  }

  @Post('endpoints')
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  async createEndpoint(
    @TenantId() organizationId: string,
    @Body() body: any
  ) {
    return this.webhooksService.createEndpoint(organizationId, body);
  }

  @Delete('endpoints/:id')
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  async deleteEndpoint(
    @TenantId() organizationId: string,
    @Param('id') id: string
  ) {
    return this.webhooksService.deleteEndpoint(organizationId, id);
  }
}
