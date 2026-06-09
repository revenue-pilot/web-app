import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { JobsService } from './jobs.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisClient: Redis | null = null;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private isRedisConnected = false;
  private fallbackActivated = false;
  private fallbackIntervals: NodeJS.Timeout[] = [];

  private jobsService: JobsService;
  private emailService: EmailService;
  private webhooksService: WebhooksService;

  constructor(
    private moduleRef: ModuleRef,
    private prisma: PrismaService,
    private automationsService: AutomationsService,
    private integrationsService: IntegrationsService,
  ) {}

  async onModuleInit() {
    this.jobsService = this.moduleRef.get(JobsService, { strict: false });
    this.emailService = this.moduleRef.get(EmailService, { strict: false });
    this.webhooksService = this.moduleRef.get(WebhooksService, { strict: false });

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`QueueService initializing... target REDIS_URL: ${redisUrl}`);

    try {
      const isTls = redisUrl.startsWith('rediss://');
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // REQUIRED by BullMQ
        enableReadyCheck: false,
        lazyConnect: true, // Do NOT auto-connect on construction; we'll test manually
        connectTimeout: 3000,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        retryStrategy() {
          return null; // Disable auto-retry during startup probe; enable after confirmed connection
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connection established.');
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
      });

      // Race the connection + ping against a 3 second timeout so we never block bootstrap
      const pingResult = await Promise.race([
        this.redisClient.connect().then(() => this.redisClient!.ping()),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);

      if (pingResult === 'PONG') {
        this.isRedisConnected = true;
        // Re-enable retry strategy after confirmed connection
        (this.redisClient as any).options.retryStrategy = (times: number) =>
          Math.min(times * 2000, 15000);

        this.redisClient.on('error', (err) => {
          this.logger.error(`Redis runtime error: ${err.message}`);
        });

        this.logger.log('Initializing BullMQ queue and background worker...');
        this.queue = new Queue('background-jobs', {
          connection: this.redisClient as any,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: 100,
          },
        });

        this.initializeWorker();
        await this.setupRepeatableJobs();
      } else {
        this.logger.warn('Redis not reachable within 3s. Activating emergency in-memory scheduler...');
        try { this.redisClient.disconnect(); } catch (_) { /* ignore */ }
        this.redisClient = null;
        this.startFallbackScheduler();
      }
    } catch (e) {
      this.logger.error(`Failed to connect to Redis/initialize BullMQ: ${e.message}`);
      this.logger.warn('Activating emergency in-memory scheduler fallback...');
      if (this.redisClient) {
        try { this.redisClient.disconnect(); } catch (_) { /* ignore */ }
        this.redisClient = null;
      }
      this.startFallbackScheduler();
    }
  }

  async onModuleDestroy() {
    // Clear intervals
    for (const interval of this.fallbackIntervals) {
      clearInterval(interval);
    }
    this.fallbackIntervals = [];

    // Shut down worker and queue
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  /**
   * Helper to check if BullMQ/Redis is currently active
   */
  isActive(): boolean {
    return this.isRedisConnected && this.queue !== null;
  }

  /**
   * Queue a transactional email to run asynchronously
   */
  async queueEmail(to: string, subject: string, html: string) {
    if (this.isActive()) {
      this.logger.log(`Queueing email to ${to} via BullMQ...`);
      await this.queue!.add('sendEmail', { to, subject, html });
    } else {
      this.logger.warn(`Redis offline. Sending email inline (Emergency fallback) to ${to}`);
      await this.emailService.sendEmailDirect(to, subject, html);
    }
  }

  /**
   * Queue a webhook payload
   */
  async queueWebhook(endpoint: any, eventType: string, payload: any) {
    if (this.isActive()) {
      this.logger.log(`Queueing webhook for ${endpoint.url} via BullMQ...`);
      await this.queue!.add('fireWebhook', { endpoint, eventType, payload });
    } else {
      this.logger.warn(`Redis offline. Firing webhook inline (Emergency fallback) to ${endpoint.url}`);
      await this.webhooksService.fireWebhook(endpoint, eventType, payload);
    }
  }

  /**
   * Queue AI telemetry and cost log recording
   */
  async queueAiLog(email: string, action: string, provider: string, tokens: number, cost: number) {
    if (this.isActive()) {
      this.logger.log(`Queueing AI usage log for ${email} via BullMQ...`);
      await this.queue!.add('logAiUsage', { email, action, provider, tokens, cost });
    } else {
      this.logger.warn(`Redis offline. Writing AI usage log inline (Emergency fallback) for ${email}`);
      await this.writeAiUsageInline(email, action, provider, tokens, cost);
    }
  }

  /**
   * Queue Automation Rule execution
   */
  async queueAutomationRule(ruleId: string, context?: any) {
    if (this.isActive()) {
      return await this.queue!.add('executeRule', { ruleId, context });
    } else {
      this.logger.warn(`Redis offline. Cannot execute rule ${ruleId}`);
    }
  }

  /**
   * Queue Report Generation
   */
  async queueReportGeneration(reportId: string, type: string) {
    if (this.isActive()) {
      return await this.queue!.add('generateReport', { reportId, type });
    } else {
      this.logger.warn(`Redis offline. Cannot generate report ${reportId}`);
    }
  }

  /**
   * Setup worker to process items
   */
  private initializeWorker() {
    this.worker = new Worker(
      'background-jobs',
      async (job: Job) => {
        this.logger.log(`Worker processing job ${job.id} of type: ${job.name}`);
        switch (job.name) {
          // Existing core jobs
          case 'checkTrialExpiries':
            await this.jobsService.runCheckTrialExpiriesTask();
            break;
          case 'processBillingRetries':
            await this.jobsService.runProcessBillingRetriesTask();
            break;
          case 'evaluateRules':
            await this.automationsService.evaluateRules();
            break;
          case 'sendEmail':
            const { to, subject, html } = job.data;
            await this.emailService.sendEmailDirect(to, subject, html);
            break;
          case 'fireWebhook':
            const { endpoint, eventType, payload } = job.data;
            await this.webhooksService.fireWebhook(endpoint, eventType, payload);
            break;
          case 'logAiUsage':
            const { email, action, provider, tokens, cost } = job.data;
            await this.writeAiUsageInline(email, action, provider, tokens, cost);
            break;
          // Provider sync jobs
          case 'syncGoogleCampaigns':
            await this.integrationsService.handleGoogleCampaignSync(job.data);
            break;
          case 'syncGoogleMetrics':
            await this.integrationsService.handleGoogleMetricsSync(job.data);
            break;
          case 'syncMetaCampaigns':
            await this.integrationsService.handleMetaCampaignSync(job.data);
            break;
          case 'syncMetaMetrics':
            await this.integrationsService.handleMetaMetricsSync(job.data);
            break;
          // Bulk operation jobs
          case 'bulkCreateCampaigns':
            await this.integrationsService.handleBulkCreateCampaigns(job.data);
            break;
          case 'bulkUpdateCampaigns':
            await this.integrationsService.handleBulkUpdateCampaigns(job.data);
            break;
          case 'bulkDeleteCampaigns':
            await this.integrationsService.handleBulkDeleteCampaigns(job.data);
            break;
          // Health score calculation job
          case 'calculateHealthScores':
            await this.integrationsService.handleHealthScoreCalculation(job.data);
            break;
          // Automations
          case 'executeRule':
            // we will need automationExecutionService for this, but to avoid circular deps, let's lazy load
            const automationExecutionService = this.moduleRef.get('AutomationExecutionService', { strict: false });
            if (automationExecutionService) {
              await automationExecutionService.executeRule(job.data.ruleId, job.data.context);
            }
            break;
          case 'pollTriggers':
            await this.automationsService.pollTriggers();
            break;
          // Reports
          case 'generateReport':
            const reportsService = this.moduleRef.get('ReportsService', { strict: false });
            if (reportsService) {
              await reportsService.processReportGeneration(job);
            }
            break;
          default:
            this.logger.warn(`Worker received unknown job name: ${job.name}`);
        }
      },
      {
        connection: this.redisClient! as any,
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });
  }

  /**
   * Setup repeatable cron tasks in BullMQ
   */
  private async setupRepeatableJobs() {
    if (!this.queue) return;

    // Clean old repeatable jobs first to avoid duplicate configurations
    const oldJobs = await this.queue.getRepeatableJobs();
    for (const job of oldJobs) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    this.logger.log('Registering repeatable cron jobs in BullMQ...');
    
    // checkTrialExpiries: daily at midnight
    await this.queue.add(
      'checkTrialExpiries',
      {},
      {
        repeat: {
          pattern: '0 0 * * *',
        },
      },
    );

    // processBillingRetries: hourly
    await this.queue.add(
      'processBillingRetries',
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
      },
    );

    // evaluateRules: once per minute
    await this.queue.add(
      'evaluateRules',
      {},
      {
        repeat: {
          pattern: '* * * * *',
        },
      },
    );

    // pollTriggers: every 5 minutes
    await this.queue.add(
      'pollTriggers',
      {},
      {
        repeat: {
          pattern: '*/5 * * * *',
        },
      },
    );
  }

  /**
   * Start fallback interval schedulers (emergency backup when Redis is offline)
   */
  private startFallbackScheduler() {
    if (this.fallbackActivated) return;
    this.fallbackActivated = true;
    this.isRedisConnected = false;
    
    // Clear existing fallback intervals if any
    for (const interval of this.fallbackIntervals) {
      clearInterval(interval);
    }
    this.fallbackIntervals = [];

    this.logger.log('Starting emergency in-memory setInterval fallback tasks...');

    // Run checkTrialExpiries task once every 24 hours
    const dailyTimer = setInterval(async () => {
      this.logger.log('[Fallback Scheduler] Triggering daily trial expiry task...');
      try {
        await this.jobsService.runCheckTrialExpiriesTask();
      } catch (err) {
        this.logger.error(`[Fallback Scheduler] Daily trial expiry task failed: ${err.message}`);
      }
    }, 24 * 60 * 60 * 1000);

    // Run processBillingRetries task once every 1 hour
    const hourlyTimer = setInterval(async () => {
      this.logger.log('[Fallback Scheduler] Triggering hourly billing retry task...');
      try {
        await this.jobsService.runProcessBillingRetriesTask();
      } catch (err) {
        this.logger.error(`[Fallback Scheduler] Hourly billing retry task failed: ${err.message}`);
      }
    }, 60 * 60 * 1000);

    // Run evaluateRules task once every 1 minute
    const rulesTimer = setInterval(async () => {
      this.logger.log('[Fallback Scheduler] Triggering automation rules evaluation task...');
      try {
        await this.automationsService.evaluateRules();
      } catch (err) {
        this.logger.error(`[Fallback Scheduler] Automation rules evaluation failed: ${err.message}`);
      }
    }, 60 * 1000);

    this.fallbackIntervals.push(dailyTimer, hourlyTimer, rulesTimer);
  }

  /**
   * Inline writing helper for AI logs
   */
  private async writeAiUsageInline(email: string, action: string, provider: string, tokens: number, cost: number) {
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.client.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await this.prisma.client.auditLog.create({
            data: {
              organizationId: user.organizationId,
              entity: 'OTHER',
              entityId: user.id,
              action: 'UPDATE',
              performedBy: user.email || 'system',
              userId: user.id,
              detailsJson: JSON.stringify({
                aiAction: action,
                tokensUsed: tokens,
                costEstimate: `$${cost.toFixed(6)}`,
                provider,
              }),
            },
          });
          this.logger.log(`AI audit log saved successfully for user ${user.id}`);
        }
      } catch (e) {
        this.logger.error('Failed to write AI usage audit log dynamically', e);
      }
    } else {
      this.logger.log(`Database unavailable; AI usage audit log skipped for user ${email}. Action: ${action}, tokens: ${tokens}, cost: $${cost}`);
    }
  }
}
