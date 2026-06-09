import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('API key is missing');
    }

    const tokenRecord = await this.prisma.client.apiToken.findUnique({
      where: { token: apiKeyHeader },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach organizationId from token to request context so subsequent services know the tenant
    request.organizationId = tokenRecord.organizationId;
    // We could also attach a mocked user or a service account context here
    request.user = { role: 'ADMIN', organizationId: tokenRecord.organizationId, isApiToken: true };

    return true;
  }
}
