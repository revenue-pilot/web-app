import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { prisma } from 'database';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client = prisma;
  public isConnected = false;

  // Shortcut getters for model access
  get user() { return this.client.user; }
  get lead() { return this.client.lead; }
  get pipeline() { return this.client.pipeline; }
  get deal() { return this.client.deal; }
  get campaign() { return this.client.campaign; }
  get organization() { return this.client.organization; }
  get adAccount() { return this.client.adAccount; }
  get ad() { return this.client.ad; }
  get adGroup() { return this.client.adGroup; }
  get auditLog() { return this.client.auditLog; }
  get loginHistory() { return this.client.loginHistory; }

  async onModuleInit() {
    const maxRetries = 5;
    let delay = 1000; // start with 1s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Attempting database connection (Attempt ${attempt}/${maxRetries})...`);
        await this.client.$connect();
        this.isConnected = true;
        this.logger.log('Prisma Database successfully connected in production mode.');
        return;
      } catch (e) {
        this.isConnected = false;
        this.logger.warn(`Prisma Connection attempt ${attempt} failed. error: ${e.message}`);

        if (attempt === maxRetries) {
          this.logger.error('All Prisma DB connection attempts failed. Database-dependent routes will return service unavailable.');
          return;
        }

        this.logger.log(`Waiting ${delay}ms before next retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
  }
}
