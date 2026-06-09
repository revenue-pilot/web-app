import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationActionService } from './automation-action.service';
import { ExecutionStatus, ExecutionStepStatus, StepType } from '@prisma/client';

@Injectable()
export class AutomationExecutionService {
  private readonly logger = new Logger(AutomationExecutionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionService: AutomationActionService,
  ) {}

  async findOne(id: string) {
    return this.prisma.client.automationExecution.findUnique({
      where: { id },
      include: { steps: true },
    });
  }

  async cancel(id: string) {
    const exec = await this.prisma.client.automationExecution.update({
      where: { id },
      data: { status: ExecutionStatus.FAILURE },
    });
    this.logger.log(`Cancelled automation execution ${id}`);
    return exec;
  }

  async executeRule(ruleId: string, context: any) {
    context = context || {};
    const rule = await this.prisma.client.automationRule.findUnique({
      where: { id: ruleId },
      include: { actions: true },
    });

    if (!rule || !rule.enabled) {
      this.logger.log(`Rule ${ruleId} is not executable.`);
      return null;
    }

    // Create execution record
    const execution = await this.prisma.client.automationExecution.create({
      data: {
        ruleId: rule.id,
        organizationId: rule.organizationId,
        status: ExecutionStatus.RUNNING,
        triggerSource: context.triggerSource || 'POLLING',
        triggeredBy: context.triggeredBy,
        executionContext: context.payload || {},
      },
    });

    const startTime = Date.now();
    let hasFailure = false;

    // Sort actions by executionOrder
    const actions = rule.actions.sort((a, b) => a.executionOrder - b.executionOrder);

    for (const action of actions) {
      // Create step record
      const step = await this.prisma.client.automationExecutionStep.create({
        data: {
          executionId: execution.id,
          stepType: StepType.ACTION_EXEC,
          stepName: action.actionType,
          status: ExecutionStepStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      const config = action.configJson as any;
      const result = await this.actionService.executeAction(action, context);

      if (result.success) {
        await this.prisma.client.automationExecutionStep.update({
          where: { id: step.id },
          data: {
            status: ExecutionStepStatus.SUCCESS,
            completedAt: new Date(),
            resultJson: result,
          },
        });
      } else {
        hasFailure = true;
        await this.prisma.client.automationExecutionStep.update({
          where: { id: step.id },
          data: {
            status: ExecutionStepStatus.FAILURE,
            completedAt: new Date(),
            errorMessage: result.error,
          },
        });

        if (!config.continueOnError) {
          this.logger.warn(`Execution ${execution.id} aborted due to failure in step ${step.id}`);
          break;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = hasFailure ? ExecutionStatus.FAILURE : ExecutionStatus.SUCCESS;

    // Complete execution
    await this.prisma.client.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        durationMs,
      },
    });

    // Update rule metrics
    const ruleUpdateData: any = {
      executionCount: { increment: 1 },
      lastExecutedAt: new Date(),
    };

    if (finalStatus === ExecutionStatus.SUCCESS) {
      ruleUpdateData.successCount = { increment: 1 };
    } else {
      ruleUpdateData.failureCount = { increment: 1 };
    }

    // Recalculate average execution time (simple moving average approximation or accurate)
    // For exact math we would do: ((avg * count) + duration) / (count + 1)
    const newAverage = rule.averageExecMs 
      ? ((rule.averageExecMs * rule.executionCount) + durationMs) / (rule.executionCount + 1)
      : durationMs;
    
    ruleUpdateData.averageExecMs = newAverage;

    await this.prisma.client.automationRule.update({
      where: { id: rule.id },
      data: ruleUpdateData,
    });

    return execution;
  }
}
