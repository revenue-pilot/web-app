import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/crm/dashboard')
export class CrmDashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('metrics')
  async getMetrics(@Req() req: any) {
    const organizationId = req.user.organizationId;
    
    // Get leads count
    const totalLeads = await this.prisma.lead.count({ where: { organizationId } });
    const newLeads = await this.prisma.lead.count({ where: { organizationId, stage: 'NEW' } });
    
    // Get deals metrics
    const deals = await this.prisma.deal.findMany({ 
      where: { organizationId },
      include: { stage: true }
    });
    
    const pipelineValue = deals.reduce((acc, deal) => {
      // Forecast value = value * probability
      const prob = deal.stage?.forecastProbability || 0;
      return acc + (deal.value * (prob / 100));
    }, 0);
    
    const totalValue = deals.reduce((acc, deal) => acc + deal.value, 0);
    const wonDeals = deals.filter(d => d.status === 'WON').length;
    
    const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(2) : 0;
    
    return {
      totalLeads,
      newLeads,
      pipelineValue,
      totalValue,
      wonDeals,
      conversionRate
    };
  }
}
