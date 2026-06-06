import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SubscriptionGuard } from '../subscription.guard';
import { Request } from 'express';

@Controller('api/ai')
@UseGuards(SubscriptionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: Request, @Body('message') message: string) {
    if (!message) {
      return { response: "Please provide a message." };
    }
    const email = (req.headers['x-user-email'] as string) || 'arjun@Revenuepilot.com';
    const response = await this.aiService.getChatResponse(message, email);
    return { response };
  }

  @Post('generate-campaign')
  async generateCampaign(@Body() params: any) {
    const campaignStructure = await this.aiService.generateCampaign(params);
    return campaignStructure;
  }
}
