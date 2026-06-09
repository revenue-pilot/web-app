import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { QueueService } from './queue.service';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationsModule } from '../automations/automations.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, AutomationsModule, IntegrationsModule],
  providers: [
    JobsService,
    QueueService,
  ],
  exports: [JobsService, QueueService],
})
export class JobsModule {}
