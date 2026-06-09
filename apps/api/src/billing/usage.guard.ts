import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService, FeatureLimits } from './usage.service';

export const CHECK_LIMIT_KEY = 'checkLimit';
export const CheckLimit = (feature: FeatureLimits) => SetMetadata(CHECK_LIMIT_KEY, feature);

@Injectable()
export class UsageGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<FeatureLimits>(CHECK_LIMIT_KEY, context.getHandler());
    
    if (!feature) {
      return true; // No limit check needed
    }

    const request = context.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId || request.organizationId || 'system-org';

    return await this.usageService.checkLimit(organizationId, feature);
  }
}
