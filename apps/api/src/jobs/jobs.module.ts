import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { QueueService } from './queue.service';
import { EmailService } from '../email/email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [PrismaModule, AutomationsModule],
  providers: [
    JobsService,
    QueueService,
    EmailService,
  ],
  exports: [JobsService, QueueService, EmailService],
})
export class JobsModule {}
