import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('Reports')
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboards/executive')
  @Roles('ADMIN', 'AGENCY')
  @ApiOperation({ summary: 'Get Executive Dashboard' })
  async getExecutiveDashboard(@TenantId() organizationId: string) {
    return this.reportsService.getExecutiveDashboard(organizationId);
  }

  @Get('dashboards/agency')
  @Roles('ADMIN', 'AGENCY')
  @ApiOperation({ summary: 'Get Agency Dashboard' })
  async getAgencyDashboard(@TenantId() organizationId: string) {
    return this.reportsService.getAgencyDashboard(organizationId);
  }

  @Get('dashboards/client/:clientId')
  @Roles('ADMIN', 'AGENCY', 'CLIENT')
  @ApiOperation({ summary: 'Get Client Dashboard' })
  async getClientDashboard(
    @TenantId() organizationId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.reportsService.getClientDashboard(organizationId, clientId);
  }

  @Get()
  @ApiOperation({ summary: 'List all reports' })
  async listReports(@TenantId() organizationId: string) {
    return this.reportsService.listReports(organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule or Generate Report' })
  async generateReport(
    @TenantId() organizationId: string,
    @Body() config: any,
  ) {
    return this.reportsService.scheduleReport(organizationId, config);
  }
}
