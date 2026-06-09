import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.automationTemplate.findMany();
  }

  async create(data: any) {
    this.logger.log(`Creating template ${data.name}`);
    return this.prisma.client.automationTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category || 'GENERAL',
        workflowJson: data.definition || {},
        isSystem: data.isSystem || false,
        isPublic: data.isPublic || false,
      },
    });
  }

  async export(id: string) {
    const template = await this.prisma.client.automationTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Create an exportable JSON representation
    return {
      version: '1.0',
      type: 'automation_template',
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        definition: template.workflowJson,
      }
    };
  }

  async import(exportData: any) {
    if (exportData.type !== 'automation_template' || !exportData.data) {
      throw new Error('Invalid template format');
    }
    
    return this.create(exportData.data);
  }
}
