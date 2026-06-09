import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  getStatus(@Req() req: any) {
    return this.onboardingService.getOnboardingStatus(req.user.organizationId);
  }

  @Put('step')
  updateStep(@Req() req: any, @Body() body: any) {
    return this.onboardingService.updateStep(req.user.organizationId, body);
  }
}
