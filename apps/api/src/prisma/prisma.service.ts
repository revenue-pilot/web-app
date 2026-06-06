import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { prisma } from 'database';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client = prisma;
  public isConnected = false;

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
