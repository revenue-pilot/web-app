import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async getLoginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginTime: 'desc' },
      take: 10,
    });
  }

  async getActiveSessions(userId: string) {
    // Currently, we only have one refreshToken per user.
    // In a multi-session setup, we'd query a Session table.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    return [
      {
        id: 'current-session',
        device: 'Current Device', // Would ideally map from LoginHistory
        isActive: !!user.refreshToken,
      }
    ];
  }

  async revokeSession(userId: string, sessionId?: string) {
    // Since we just have one refreshToken in User model for now, we revoke it.
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Session revoked successfully' };
  }

  async getAuditLogs(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
