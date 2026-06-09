import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.pipeline.findMany({
      where: { organizationId },
      include: {
        PipelineStage: {
          orderBy: { order: 'asc' },
          include: {
            deals: {
              include: {
                contact: true,
                lead: true,
                assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
              }
            }
          }
        }
      }
    });
  }

  async createDeal(organizationId: string, data: any) {
    return this.prisma.client.deal.create({
      data: {
        title: data.title || data.name,
        value: data.value || data.amount || 0,
        stageId: data.stageId || data.stage,
        organizationId,
        leadId: data.leadId,
        contactId: data.contactId,
        assignedToId: data.assignedToId
      }
    });
  }

  async moveDeal(organizationId: string, dealId: string, stageId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.organizationId !== organizationId) {
      throw new Error("Deal not found");
    }
    return this.prisma.deal.update({
      where: { id: dealId },
      data: { stageId }
    });
  }
}
