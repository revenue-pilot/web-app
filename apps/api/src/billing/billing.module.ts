import { Module, Global } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
