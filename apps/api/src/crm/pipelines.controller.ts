import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/crm/pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.pipelinesService.findAll(req.user.organizationId);
  }

  @Post('deal')
  createDeal(@Req() req: any, @Body() body: any) {
    return this.pipelinesService.createDeal(req.user.organizationId, body);
  }

  @Put('deal/:dealId/stage')
  moveDeal(@Req() req: any, @Param('dealId') dealId: string, @Body() body: { stageId: string }) {
    return this.pipelinesService.moveDeal(req.user.organizationId, dealId, body.stageId);
  }
}
