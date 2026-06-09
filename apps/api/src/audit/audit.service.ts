import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEntity } from '@prisma/client';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(
    organizationId: string,
    entity: AuditEntity,
    entityId: string,
    action: AuditAction,
    performedBy: string,
    details?: any,
  ) {
    try {
      await this.prisma.client.auditLog.create({
        data: {
          organizationId,
          entity,
          entityId,
          action,
          performedBy,
          detailsJson: details ? JSON.stringify(details) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record audit log', error);
    }
  }
}
