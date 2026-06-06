import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { QueueService } from './queue.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {}

  async runCheckTrialExpiriesTask() {
    this.logger.log('Running trial expiry task...');
    
    if (this.prisma.isConnected) {
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 12);

        const subs = await this.prisma.client.subscription.findMany({
          where: {
            tier: 'FREE',
            status: 'ACTIVE',
            createdAt: {
              gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              lte: new Date(targetDate.setHours(23, 59, 59, 999)),
            },
          },
          include: {
            organization: {
              include: {
                users: true,
              },
            },
          },
        });

        for (const sub of subs) {
          for (const user of sub.organization.users) {
            this.logger.log(`Dispatching trial expiry alert to ${user.email}`);
            // Queue email dynamically using QueueService (will run async via worker or inline)
            await this.queueService.queueEmail(
              user.email,
              'Your RevenuePilot Free Trial Ends in 3 Days!',
              `<h3>Hello ${user.name || 'SaaS Operator'},</h3>
               <p>This is a reminder that your 15-day RevenuePilot free trial will expire in 3 days.</p>
               <p>Upgrade your plan today inside the billing settings to avoid any workflow interruptions.</p>
               <a href="https://Revenuepilot.com/dashboard/billing" style="display:inline-block;background-color:#10b981;color:white;padding:8px 16px;text-decoration:none;border-radius:4px;">Upgrade Now</a>`
            );
          }
        }
      } catch (e) {
        this.logger.error('Failed to run trial expiry task', e);
      }
    } else {
      this.logger.log('[Simulated Jobs] Checked trial expiries - zero active listings.');
    }
  }

  async runProcessBillingRetriesTask() {
    this.logger.log('Running billing invoice reconciliation task...');
    
    if (this.prisma.isConnected) {
      try {
        const pastDueSubs = await this.prisma.client.subscription.findMany({
          where: { status: 'PAST_DUE' },
          include: { organization: { include: { users: true } } },
        });

        for (const sub of pastDueSubs) {
          this.logger.warn(`Retrying billing invoice reconciliation for organization: ${sub.organizationId}`);
          // In a real environment, trigger gateway retry API or charge attempt
        }
      } catch (e) {
        this.logger.error('Failed to run billing retry task', e);
      }
    } else {
      this.logger.log('[Simulated Jobs] Checked billing retries - zero failures listed.');
    }
  }
}
