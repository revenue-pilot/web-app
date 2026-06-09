import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Platform Admin')
@Controller('api/v1/admin')
@UseGuards(RolesGuard)
@Roles('ADMIN') // ONLY platform admins can access these routes
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get global revenue metrics' })
  async getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get specific tenant details' })
  async getTenantDetails(@Param('id') id: string) {
    return this.adminService.getTenantDetails(id);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get global audit logs' })
  async getGlobalAuditLogs() {
    return this.adminService.getGlobalAuditLogs();
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'Get global AI usage metrics' })
  async getAiUsage() {
    return this.adminService.getAiUsage();
  }

  @Post('incident')
  @ApiOperation({ summary: 'Trigger an incident alert manually' })
  async triggerIncident(@Body() payload: any) {
    return this.adminService.triggerIncident(payload);
  }
}
