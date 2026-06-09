import { Controller, Get, Param, Post, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AutomationExecutionService } from '../services/automation-execution.service';
import { AuditService } from '../../audit/audit.service';

@ApiTags('Automation')
@Controller('api/v1/automation/executions')
export class AutomationExecutionsController {
  constructor(
    private readonly executionService: AutomationExecutionService,
    private readonly auditService: AuditService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get automation execution details' })
  @ApiResponse({ status: 200, description: 'Execution details' })
  async findOne(@Param('id') id: string) {
    return this.executionService.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a running automation execution' })
  @ApiResponse({ status: 200, description: 'Cancellation acknowledged' })
  async cancel(@Param('id') id: string) {
    const result = await this.executionService.cancel(id);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'UPDATE' as any, 'system', { executionId: id, reason: 'Cancelled by user' });
    return result;
  }
}
