import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TemplateService } from '../templates/template.service';
import { AuditService } from '../../audit/audit.service';

@ApiTags('Automation')
@Controller('api/v1/automation/templates')
export class AutomationTemplatesController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List automation templates' })
  @ApiResponse({ status: 200, description: 'Templates list' })
  async findAll() {
    return this.templateService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create automation template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, definition: { type: 'object' } }, required: ['name', 'definition'] } })
  async create(@Body() body: any) {
    const tmpl = await this.templateService.create(body);
    await this.auditService.record('system-org', 'CAMPAIGN', tmpl.id, 'CREATE' as any, 'system', { templateId: tmpl.id });
    return tmpl;
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Export automation template as JSON' })
  @ApiResponse({ status: 200, description: 'Exported JSON' })
  async export(@Param('id') id: string) {
    return this.templateService.export(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import automation template from JSON' })
  @ApiResponse({ status: 201, description: 'Template imported' })
  @ApiBody({ schema: { type: 'object' } })
  async import(@Body() body: any) {
    const tmpl = await this.templateService.import(body);
    await this.auditService.record('system-org', 'CAMPAIGN', tmpl.id, 'CREATE' as any, 'system', { templateId: tmpl.id });
    return tmpl;
  }
}
