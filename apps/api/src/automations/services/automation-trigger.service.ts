import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TriggerType, ConditionOperator, Campaign, CampaignMetric } from '@prisma/client';

export interface TriggerEvaluationContext {
  campaigns: Campaign[];
  metrics: CampaignMetric[];
  now: Date;
}

@Injectable()
export class AutomationTriggerService {
  private readonly logger = new Logger(AutomationTriggerService.name);
  constructor(private readonly prisma: PrismaService) {}

  async evaluateRuleTriggers(ruleId: string, context: TriggerEvaluationContext): Promise<boolean> {
    const rule = await this.prisma.client.automationRule.findUnique({
      where: { id: ruleId },
      include: { triggers: true },
    });

    if (!rule || !rule.triggers || rule.triggers.length === 0) {
      return false;
    }

    // Default to AND operator for multiple triggers at root level if not specified by compound logic
    // Actually, let's assume the triggers are evaluated with AND logic unless grouped in a special COMPOUND config
    let result = true;
    for (const trigger of rule.triggers) {
      const isMet = await this.evaluateTrigger(trigger, context);
      if (!isMet) {
        result = false;
        break;
      }
    }
    return result;
  }

  async evaluateTrigger(trigger: any, context: TriggerEvaluationContext): Promise<boolean> {
    const { triggerType, configJson } = trigger;
    const config = configJson as any;

    if (trigger.conditionOperator) {
      // It's a compound condition at root level
      return this.evaluateCompoundCondition(trigger, context);
    }

    return this.evaluateSingleCondition(triggerType, config, context);
  }

  private async evaluateCompoundCondition(trigger: any, context: TriggerEvaluationContext): Promise<boolean> {
    const { conditionOperator, configJson } = trigger;
    const config = configJson as any;
    
    // Support nested conditions inside configJson.conditions
    const conditions = config.conditions || [];
    
    if (!conditions || conditions.length === 0) {
      return false;
    }

    if (conditionOperator === 'AND') {
      for (const cond of conditions) {
        const isMet = await this.evaluateNestedCondition(cond, context);
        if (!isMet) return false;
      }
      return true;
    } else if (conditionOperator === 'OR') {
      for (const cond of conditions) {
        const isMet = await this.evaluateNestedCondition(cond, context);
        if (isMet) return true;
      }
      return false;
    }

    return false;
  }

  private async evaluateNestedCondition(cond: any, context: TriggerEvaluationContext): Promise<boolean> {
    if (cond.operator === 'AND' || cond.operator === 'OR') {
      return this.evaluateCompoundCondition({ conditionOperator: cond.operator, configJson: cond }, context);
    }
    return this.evaluateSingleCondition(cond.type, cond, context);
  }

  private async evaluateSingleCondition(triggerType: TriggerType, config: any, context: TriggerEvaluationContext): Promise<boolean> {
    const { operator, value, targetId } = config; // targetId is optional campaignId
    
    // Determine the relevant campaigns or metrics to evaluate
    let metricsToEvaluate = context.metrics;
    let campaignsToEvaluate = context.campaigns;
    
    if (targetId) {
       metricsToEvaluate = metricsToEvaluate.filter(m => m.campaignId === targetId);
       campaignsToEvaluate = campaignsToEvaluate.filter(c => c.id === targetId);
    }

    // If no data to evaluate, return false
    if (metricsToEvaluate.length === 0 && campaignsToEvaluate.length === 0 && triggerType !== TriggerType.TIME && triggerType !== TriggerType.MANUAL) {
        return false;
    }

    // We take the latest metric for the campaign
    // Or aggregate? Let's take the latest metric or average for simplicity, or sum.
    // For now, let's evaluate against the most recent metric for each campaign.
    // If ANY campaign meets the condition, we return true (or we can require all, depending on rule)
    // Let's assume if any campaign meets the condition, the trigger fires for that campaign.
    // Wait, triggers should probably return which campaigns fired, but for now we just return boolean.

    for (const campaign of campaignsToEvaluate) {
        const metric = metricsToEvaluate.find(m => m.campaignId === campaign.id);
        if (!metric && triggerType !== TriggerType.SYNC_FAILURE) continue;

        let actualValue: number | string | Date | null = null;

        switch (triggerType) {
            case TriggerType.SPEND: actualValue = metric.spend; break;
            case TriggerType.REVENUE: actualValue = metric.revenue; break;
            case TriggerType.LEADS: actualValue = metric.conversions; break; // Map leads to conversions for now
            case TriggerType.ROAS: actualValue = metric.roas; break;
            case TriggerType.CPA: actualValue = metric.cpa; break;
            case TriggerType.CTR: actualValue = metric.ctr; break;
            case TriggerType.CPC: actualValue = metric.cpc; break;
            case TriggerType.CPM: actualValue = metric.cpm; break;
            case TriggerType.CONVERSIONS: actualValue = metric.conversions; break;
            case TriggerType.HEALTH_SCORE: actualValue = campaign.overallHealthScore; break;
            case TriggerType.CAMPAIGN_STATUS: actualValue = campaign.status; break;
            case TriggerType.SYNC_FAILURE:
              // Check for recent sync failures in the last 24 hours
              const syncFailures = await this.prisma.client.syncJob.findMany({
                where: {
                  organizationId: (context as any).organizationId,
                  status: 'FAILED',
                  startedAt: {
                    gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
                  }
                },
                take: 1
              });
              if (syncFailures.length > 0) {
                return true; // Sync failure detected
              }
              break;
            case TriggerType.TIME: actualValue = context.now; break;
            case TriggerType.MANUAL: return true;
        }

        if (actualValue !== null) {
            if (this.compareValues(actualValue, operator, value)) {
                return true;
            }
        }
    }

    // Handle Time-based triggers globally if not campaign-specific
    if (triggerType === TriggerType.TIME) {
        return this.compareValues(context.now, operator, new Date(value));
    }

    return false;
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'GT': return actual > expected;
      case 'LT': return actual < expected;
      case 'GTE': return actual >= expected;
      case 'LTE': return actual <= expected;
      case 'EQ': return actual === expected;
      case 'NEQ': return actual !== expected;
      case 'AFTER': return new Date(actual) > new Date(expected);
      case 'BEFORE': return new Date(actual) < new Date(expected);
      default: return false;
    }
  }
}
