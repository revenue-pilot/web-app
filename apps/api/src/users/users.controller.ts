import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Post('2fa/generate')
  generate2FASecret(@Req() req: any) {
    return this.usersService.generate2FASecret(req.user.id);
  }

  @Post('2fa/verify')
  verify2FAAndEnable(@Req() req: any, @Body() body: { token: string }) {
    return this.usersService.verify2FAAndEnable(req.user.id, body.token);
  }

  @Post('2fa/disable')
  disable2FA(@Req() req: any) {
    return this.usersService.disable2FA(req.user.id);
  }
}
