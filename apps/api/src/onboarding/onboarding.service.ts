import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getOnboardingStatus(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        industry: true,
        goals: true,
        onboardingStep: true,
        isOnboarded: true,
      },
    });
    return org;
  }

  async updateStep(organizationId: string, data: {
    industry?: string;
    goals?: string[];
    onboardingStep?: number;
    isOnboarded?: boolean;
    name?: string;
  }) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }
}
