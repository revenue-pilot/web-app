import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { QueueService } from '../../jobs/queue.service';

@Injectable()
export class AutomationRuleService {
  private readonly logger = new Logger(AutomationRuleService.name);
  private queueService: QueueService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.queueService = this.moduleRef.get(QueueService, { strict: false });
  }

  async create(user: any, dto: any) {
    const { triggerType, actionType, configJson, ...restDto } = dto;
    const data: any = {
      ...restDto,
      organizationId: user.organizationId,
      createdBy: user.id,
      createdByType: 'USER',
    };

    if (triggerType) {
      data.triggers = {
        create: [{ triggerType, configJson: configJson || {} }]
      };
    }

    if (actionType) {
      data.actions = {
        create: [{ actionType, configJson: configJson || {} }]
      };
    }

    const rule = await this.prisma.client.automationRule.create({ data });
    this.logger.log(`Created automation rule ${rule.id}`);
    return rule;
  }

  async findAll() {
    return this.prisma.client.automationRule.findMany();
  }

  async findOne(id: string) {
    return this.prisma.client.automationRule.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateRuleDto) {
    const rule = await this.prisma.client.automationRule.update({ where: { id }, data: dto as any });
    this.logger.log(`Updated automation rule ${id}`);
    return rule;
  }

  async remove(id: string) {
    await this.prisma.client.automationRule.delete({ where: { id } });
    this.logger.log(`Deleted automation rule ${id}`);
  }

  async publish(id: string) {
    const rule = await this.prisma.client.automationRule.update({ where: { id }, data: { enabled: true } });
    return rule;
  }

  async archive(id: string) {
    const rule = await this.prisma.client.automationRule.update({ where: { id }, data: { enabled: false } });
    return rule;
  }

  async execute(id: string) {
    // Enqueue execution job
    const job = await this.queueService.queueAutomationRule(id);
    return { id: job.id };
  }
}
