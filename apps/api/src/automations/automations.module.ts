import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationsService } from './automations.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AutomationRuleService } from './services/automation-rule.service';
import { AutomationExecutionService } from './services/automation-execution.service';
import { AutomationTriggerService } from './services/automation-trigger.service';
import { AutomationActionService } from './services/automation-action.service';
import { TemplateService } from './templates/template.service';
import { AutomationRulesController } from './controllers/automation-rules.controller';
import { AutomationExecutionsController } from './controllers/automation-executions.controller';
import { AutomationTemplatesController } from './controllers/automation-templates.controller';
import { AuditService } from '../audit/audit.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [ScheduleModule.forRoot(), IntegrationsModule, WebhooksModule, forwardRef(() => JobsModule)],
  controllers: [
    AutomationRulesController,
    AutomationExecutionsController,
    AutomationTemplatesController,
  ],
  providers: [
    AutomationsService,
    AutomationRuleService,
    AutomationExecutionService,
    { provide: 'AutomationExecutionService', useExisting: AutomationExecutionService },
    AutomationTriggerService,
    AutomationActionService,
    TemplateService,
    AuditService,
  ],
  exports: [
    AutomationsService,
    AutomationRuleService,
    AutomationExecutionService,
    AutomationTriggerService,
    AutomationActionService,
    TemplateService,
  ],
})
export class AutomationsModule {}
