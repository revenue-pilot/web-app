import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

/**
 * Simple tracking endpoint. Auth is optional – for now we protect with JWT to associate organization.
 * In production you might allow unauthenticated hits with a public API key.
 */
@UseGuards(JwtAuthGuard)
@Controller('api/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
  async recordEvent(@Req() req: any, @Body() body: any) {
    const organizationId = req.user.organizationId;
    // Merge organizationId into payload for service
    const result = await this.trackingService.recordEvent({
      organizationId,
      visitorId: body.visitorId,
      userAgent: body.userAgent,
      ipAddress: body.ipAddress,
      type: body.type,
      payload: body.payload,
    });
    return result;
  }
}
