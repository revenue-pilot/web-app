import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(userId: string, data: { name: string, domain?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const organization = await this.prisma.organization.create({
      data: {
        name: data.name,
        domain: data.domain,
        users: {
          connect: { id: userId }
        }
      }
    });

    // Update user to be part of the new organization if they weren't, or just leave them in their original one.
    // If they create it, they become ADMIN of that organization.
    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: organization.id, role: 'ADMIN' }
    });

    return organization;
  }

  async getMyOrganization(userId: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { organization: true }
    });
    return user?.organization;
  }

  async getTeamMembers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });
  }

  async assignRole(adminId: string, targetUserId: string, role: 'ADMIN' | 'AGENCY' | 'CLIENT') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can assign roles');
    }

    if (!targetUser || targetUser.organizationId !== admin.organizationId) {
      throw new ForbiddenException('Cannot modify user outside your organization');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    return { message: 'Role updated successfully', user: { id: updated.id, role: updated.role } };
  }
}
