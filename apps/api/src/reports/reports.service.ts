import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue.service';
import { StorageService } from '../storage/storage.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly storageService: StorageService,
  ) {}

  async getExecutiveDashboard(organizationId: string) {
    const metrics = await this.prisma.client.campaignMetric.findMany({
      where: { campaign: { organizationId } },
      include: {
        campaign: {
          include: {
            adAccount: {
              include: { client: true }
            }
          }
        }
      }
    });

    const totals = { spend: 0, revenue: 0 };
    const clientPerformanceMap = new Map<string, {
      clientId: string;
      name: string;
      spend: number;
      revenue: number;
    }>();

    for (const metric of metrics) {
      const spend = Number(metric.spend) || 0;
      const revenue = Number(metric.revenue) || 0;
      totals.spend += spend;
      totals.revenue += revenue;

      const client = metric.campaign.adAccount?.client;
      if (client) {
        const existing = clientPerformanceMap.get(client.id) || {
          clientId: client.id,
          name: client.name,
          spend: 0,
          revenue: 0,
        };
        existing.spend += spend;
        existing.revenue += revenue;
        clientPerformanceMap.set(client.id, existing);
      }
    }

    const clientPerformance = Array.from(clientPerformanceMap.values()).map((clientData) => ({
      ...clientData,
      roas: clientData.spend > 0 ? Number((clientData.revenue / clientData.spend).toFixed(2)) : 0,
    }));

    return {
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      globalRoas: totals.spend > 0 ? Number((totals.revenue / totals.spend).toFixed(2)) : 0,
      clientPerformance,
    };
  }

  async getClientDashboard(organizationId: string, clientId: string) {
    const client = await this.prisma.client.client.findFirst({
      where: { id: clientId, organizationId },
      include: {
        adAccounts: {
          include: {
            campaigns: true,
          }
        }
      }
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const metrics = await this.prisma.client.campaignMetric.findMany({
      where: { campaign: { adAccount: { clientId } } },
      include: { campaign: true }
    });

    const campaignsMap = new Map<string, {
      id: string;
      name: string;
      status: string;
      spend: number;
      leads: number;
    }>();

    let totalSpend = 0;
    let totalLeads = 0;

    for (const metric of metrics) {
      const spend = Number(metric.spend) || 0;
      const leads = Number(metric.conversions) || 0;
      totalSpend += spend;
      totalLeads += leads;

      const campaignData = campaignsMap.get(metric.campaign.id) || {
        id: metric.campaign.id,
        name: metric.campaign.name,
        status: metric.campaign.status,
        spend: 0,
        leads: 0,
      };
      campaignData.spend += spend;
      campaignData.leads += leads;
      campaignsMap.set(metric.campaign.id, campaignData);
    }

    if (campaignsMap.size === 0) {
      for (const account of client.adAccounts) {
        for (const campaign of account.campaigns) {
          campaignsMap.set(campaign.id, {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: Number(campaign.budget) || 0,
            leads: 0,
          });
          totalSpend += Number(campaign.budget) || 0;
        }
      }
    }

    const campaigns = Array.from(campaignsMap.values()).map((campaign) => ({
      ...campaign,
      cpl: campaign.leads > 0 ? campaign.spend / campaign.leads : 0,
    }));

    return {
      clientId: client.id,
      clientName: client.name,
      totalSpend,
      totalLeads,
      averageCpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      campaigns,
    };
  }

  async getAgencyDashboard(organizationId: string) {
    const clientsCount = await this.prisma.client.client.count({ where: { organizationId } });
    const activeCampaigns = await this.prisma.client.campaign.count({
      where: { adAccount: { client: { organizationId } }, status: 'ACTIVE' },
    });

    const averageHealth = await this.prisma.client.campaign.aggregate({
      where: { organizationId },
      _avg: { overallHealthScore: true },
    });

    return {
      clientsCount,
      activeCampaigns,
      healthScore: averageHealth._avg.overallHealthScore
        ? Number(averageHealth._avg.overallHealthScore.toFixed(0))
        : 0,
    };
  }

  async listReports(organizationId: string) {
    return this.prisma.client.report.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { client: true }
    });
  }

  async scheduleReport(organizationId: string, data: any) {
    let mappedType = data.type;
    if (mappedType === 'EXECUTIVE') mappedType = 'EXECUTIVE_SUMMARY';
    
    const report = await this.prisma.client.report.create({
      data: {
        organizationId,
        clientId: data.clientId,
        name: data.name,
        type: mappedType,
        format: data.format,
        scheduleCron: data.scheduleCron,
        status: 'PENDING',
      }
    });

    // Queue for immediate generation if no schedule, otherwise just queue it anyway for initial run
    if (!data.scheduleCron) {
      await this.queueService.queueReportGeneration(report.id, report.type);
    } else {
      await this.queueService.queueReportGeneration(report.id, report.type);
    }

    return report;
  }

  async processReportGeneration(job: any): Promise<any> {
    const { reportId } = job.data;
    this.logger.log(`Processing report generation for ${reportId}`);

    const report = await this.prisma.client.report.findUnique({
      where: { id: reportId },
      include: { organization: true, client: true }
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    try {
      await this.prisma.client.report.update({
        where: { id: reportId },
        data: { status: 'PROCESSING' }
      });

      const reportSummary = await this.buildReportSummary(report);

      let fileBuffer: Buffer;
      let contentType: string;
      let extension: string;

      if (report.format === 'PDF') {
        fileBuffer = await this.generatePDFBuffer(report, reportSummary);
        contentType = 'application/pdf';
        extension = '.pdf';
      } else if (report.format === 'XLSX') {
        fileBuffer = await this.generateXLSXBuffer(report, reportSummary);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = '.xlsx';
      } else if (report.format === 'CSV') {
        fileBuffer = await this.generateCSVBuffer(report, reportSummary);
        contentType = 'text/csv';
        extension = '.csv';
      }

      const rawFileName = report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileUrl = await this.storageService.uploadFile(`${rawFileName}${extension}`, fileBuffer, contentType);

      await this.prisma.client.report.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          url: fileUrl,
          lastRunAt: new Date()
        }
      });

      this.logger.log(`Report ${reportId} generated successfully at ${fileUrl}`);
    } catch (error) {
      this.logger.error(`Failed to generate report ${reportId}`, error);
      await this.prisma.client.report.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async buildReportSummary(report: any) {
    const where: any = {
      campaign: {
        organizationId: report.organizationId,
      }
    };

    if (report.clientId) {
      where.campaign.adAccount = { clientId: report.clientId };
    }

    const metrics = await this.prisma.client.campaignMetric.findMany({
      where,
      include: {
        campaign: {
          include: {
            adAccount: {
              include: { client: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const latestMetricByCampaign = new Map<string, any>();
    for (const metric of metrics) {
      if (!latestMetricByCampaign.has(metric.campaignId)) {
        latestMetricByCampaign.set(metric.campaignId, metric);
      }
    }

    const campaignSummaries = Array.from(latestMetricByCampaign.values()).map(metric => ({
      campaignId: metric.campaignId,
      campaignName: metric.campaign.name,
      clientName: metric.campaign.adAccount?.client?.name || 'Unknown',
      spend: metric.spend,
      revenue: metric.revenue,
      leads: metric.conversions,
      roas: metric.roas,
    }));

    const totalSpend = campaignSummaries.reduce((sum, item) => sum + (item.spend || 0), 0);
    const totalRevenue = campaignSummaries.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalLeads = campaignSummaries.reduce((sum, item) => sum + (item.leads || 0), 0);

    return {
      totalSpend,
      totalRevenue,
      roas: totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0,
      totalLeads,
      campaignCount: campaignSummaries.length,
      campaigns: campaignSummaries,
      dateRange: metrics.length > 0 ? `${metrics[metrics.length - 1].date.toISOString().split('T')[0]} - ${metrics[0].date.toISOString().split('T')[0]}` : 'No data available',
    };
  }

  private async generatePDFBuffer(report: any, summary: any): Promise<Buffer> {
    const puppeteer = (await eval(`import('puppeteer')`)).default;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; }
            h1 { color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name}</h1>
            <p><strong>Organization:</strong> ${report.organization.name}</p>
            ${report.client ? `<p><strong>Client:</strong> ${report.client.name}</p>` : ''}
            <p><strong>Type:</strong> ${report.type}</p>
            <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Data Range:</strong> ${summary.dateRange}</p>
          </div>
          <div>
            <h2>Data Summary</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Total Spend</td><td>$${summary.totalSpend.toFixed(2)}</td></tr>
              <tr><td>Total Revenue</td><td>$${summary.totalRevenue.toFixed(2)}</td></tr>
              <tr><td>ROAS</td><td>${summary.roas.toFixed(2)}x</td></tr>
              <tr><td>Total Leads</td><td>${summary.totalLeads}</td></tr>
              <tr><td>Campaign Count</td><td>${summary.campaignCount}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  private async generateXLSXBuffer(report: any, summary: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report Data');

    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 30 }
    ];

    sheet.addRows([
      { metric: 'Report Name', value: report.name },
      { metric: 'Type', value: report.type },
      { metric: 'Total Spend', value: summary.totalSpend },
      { metric: 'Total Revenue', value: summary.totalRevenue },
      { metric: 'ROAS', value: summary.roas },
      { metric: 'Total Leads', value: summary.totalLeads },
      { metric: 'Campaign Count', value: summary.campaignCount },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateCSVBuffer(report: any, summary: any): Promise<Buffer> {
    const content = `Metric,Value\nReport Name,${report.name}\nType,${report.type}\nTotal Spend,${summary.totalSpend}\nTotal Revenue,${summary.totalRevenue}\nROAS,${summary.roas}\nTotal Leads,${summary.totalLeads}\nCampaign Count,${summary.campaignCount}`;
    return Buffer.from(content, 'utf-8');
  }
}
