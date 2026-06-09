import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // In a real app, this should only come from request.user.organizationId (set by JWT/Auth Guard)
    // However, if the route is public or uses an API key, we ensure the guard injects it into req.organizationId.
    return request.user?.organizationId || request.organizationId || 'system-org';
  },
);
