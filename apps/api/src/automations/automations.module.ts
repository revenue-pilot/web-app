import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationsService } from './automations.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ScheduleModule.forRoot(), IntegrationsModule],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
