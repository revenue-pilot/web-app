import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.lead.findMany({
      where: { organizationId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(organizationId: string, id: string) {
    return this.prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        activities: { orderBy: { date: 'desc' } },
        deals: true,
      }
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.lead.create({
      data: {
        ...data,
        organizationId,
      }
    });
  }

  async update(organizationId: string, id: string, data: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.organizationId !== organizationId) {
      throw new Error("Lead not found");
    }
    return this.prisma.lead.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    // Check ownership first or use deleteMany
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.organizationId !== organizationId) {
      throw new Error("Lead not found");
    }
    return this.prisma.lead.delete({
      where: { id }
    });
  }
}
