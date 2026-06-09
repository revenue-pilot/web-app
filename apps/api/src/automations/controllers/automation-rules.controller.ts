import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AutomationRuleService } from '../services/automation-rule.service';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { AuditService } from '../../audit/audit.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';

@ApiTags('Automation')
@Controller('api/v1/automation/rules')
@UseGuards(JwtAuthGuard)
export class AutomationRulesController {
  constructor(
    private readonly ruleService: AutomationRuleService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create automation rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiBody({ type: CreateRuleDto })
  async create(@Req() req: any, @Body() dto: CreateRuleDto) {
    const rule = await this.ruleService.create(req.user, dto);
    await this.auditService.record('system-org', 'CAMPAIGN', rule.id, 'CREATE' as any, 'system', { ruleId: rule.id });
    return rule;
  }

  @Get()
  @ApiOperation({ summary: 'List automation rules' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async findAll() {
    return this.ruleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  async findOne(@Param('id') id: string) {
    return this.ruleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update automation rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  @ApiBody({ type: UpdateRuleDto })
  async update(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    const rule = await this.ruleService.update(id, dto);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'UPDATE' as any, 'system', { ruleId: id });
    return rule;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete automation rule' })
  @ApiResponse({ status: 204, description: 'Rule deleted' })
  async remove(@Param('id') id: string) {
    await this.ruleService.remove(id);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'DELETE' as any, 'system', { ruleId: id });
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish automation rule' })
  async publish(@Param('id') id: string) {
    const rule = await this.ruleService.publish(id);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'UPDATE' as any, 'system', { ruleId: id, action: 'PUBLISHED' });
    return rule;
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive automation rule' })
  async archive(@Param('id') id: string) {
    const rule = await this.ruleService.archive(id);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'UPDATE' as any, 'system', { ruleId: id, action: 'ARCHIVED' });
    return rule;
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute automation rule' })
  async execute(@Param('id') id: string) {
    const exec = await this.ruleService.execute(id);
    await this.auditService.record('system-org', 'CAMPAIGN', id, 'UPDATE' as any, 'system', { ruleId: id, executionId: exec.id });
    return exec;
  }
}
