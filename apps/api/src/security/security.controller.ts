import { Controller, Get, Post, Req, UseGuards, Param } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('login-history')
  getLoginHistory(@Req() req: any) {
    return this.securityService.getLoginHistory(req.user.id);
  }

  @Get('sessions')
  getActiveSessions(@Req() req: any) {
    return this.securityService.getActiveSessions(req.user.id);
  }

  @Post('sessions/revoke')
  revokeSession(@Req() req: any) {
    return this.securityService.revokeSession(req.user.id);
  }

  @Get('audit-logs')
  getAuditLogs(@Req() req: any) {
    return this.securityService.getAuditLogs(req.user.id);
  }
}
