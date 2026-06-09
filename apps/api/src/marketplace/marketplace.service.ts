import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async listApps() {
    return this.prisma.client.marketplaceApp.findMany({
      where: { status: 'ACTIVE' },
    });
  }

  async listInstallations(organizationId: string) {
    return this.prisma.client.marketplaceInstallation.findMany({
      where: { organizationId },
      include: { app: true },
    });
  }

  async installApp(organizationId: string, appId: string) {
    return this.prisma.client.marketplaceInstallation.create({
      data: {
        organizationId,
        appId,
      },
    });
  }

  async uninstallApp(organizationId: string, appId: string) {
    return this.prisma.client.marketplaceInstallation.deleteMany({
      where: {
        organizationId,
        appId,
      },
    });
  }
}
