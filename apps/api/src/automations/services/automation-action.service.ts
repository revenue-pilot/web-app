import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActionType } from '@prisma/client';
import { IntegrationsService } from '../../integrations/integrations.service';
import { AuditService } from '../../audit/audit.service';
import { AuditEntity, AuditAction } from '@prisma/client';
import { EmailService } from '../../email/email.service';
import { WebhooksService } from '../../webhooks/webhooks.service';

@Injectable()
export class AutomationActionService {
  private readonly logger = new Logger(AutomationActionService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async executeAction(action: any, context: any) {
    this.logger.log(`Executing action ${action.id} of type ${action.actionType}`);
    const { actionType, configJson } = action;
    const config = configJson as any;

    try {
      switch (actionType) {
        case ActionType.PAUSE_CAMPAIGN:
          if (config.campaignId) {
            await this.integrationsService.handlePauseCampaign(config.campaignId);
          }
          break;
        case ActionType.ENABLE_CAMPAIGN:
          if (config.campaignId) {
            await this.integrationsService.handleEnableCampaign(config.campaignId);
          }
          break;
        case ActionType.UPDATE_BUDGET:
          if (config.campaignId && config.budget) {
            await this.integrationsService.handleUpdateBudget(config.campaignId, config.budget);
          }
          break;
        case ActionType.SEND_NOTIFICATION:
          await this.sendNotification(config);
          break;
        case ActionType.GENERATE_REPORT:
          await this.generateReport(config);
          break;
        case ActionType.CHANGE_LEAD_STAGE:
          await this.changeLeadStage(config);
          break;
        case ActionType.CREATE_AUDIT_EVENT:
          if (config.organizationId && config.entity && config.action) {
            await this.auditService.record(
              config.organizationId,
              config.entity as AuditEntity,
              config.entityId || 'system',
              config.action as AuditAction,
              'AUTOMATION_SYSTEM',
              config.details
            );
          }
          break;
        case ActionType.CREATE_INTERNAL_ALERT:
          this.logger.warn(`INTERNAL ALERT: ${config.message || 'Automation Alert triggered'}`);
          break;
        default:
          this.logger.log(`Action type ${actionType} execution is not fully implemented yet.`);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(`Error executing action ${action.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendNotification(config: any) {
    if (!config.organizationId || !config.message) {
      throw new Error('SEND_NOTIFICATION action requires organizationId and message.');
    }

    // Store notification in database
    const notification = await this.prisma.client.notification.create({
      data: {
        title: config.title || 'Automation Notification',
        message: config.message,
        type: config.type || 'INFO',
      }
    });

    this.logger.log(`Created database notification ${notification.id} for ${config.organizationId}`);

    // Deliver notification via available channels
    let deliverySuccess = false;
    let deliveryErrors: string[] = [];

    // Try email delivery
    if (config.sendViaEmail !== false) {
      try {
        const org = await this.prisma.client.organization.findUnique({
          where: { id: config.organizationId },
          include: { users: true }
        });
        if (org && org.users.length > 0) {
          const recipientEmail = config.recipientEmail || org.users[0].email;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${config.title || 'Automation Notification'}</h2>
              <p>${config.message}</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">Sent from RevenuePilot Automation System</p>
            </div>
          `;
          await this.emailService.sendEmail(recipientEmail, config.title || 'Notification', htmlContent);
          this.logger.log(`Email delivered for notification ${notification.id} to ${recipientEmail}`);
          deliverySuccess = true;
        }
      } catch (error) {
        deliveryErrors.push(`Email delivery failed: ${error.message}`);
        this.logger.warn(`Email delivery failed for notification ${notification.id}: ${error.message}`);
      }
    }

    // Try webhook delivery
    if (config.sendViaWebhook !== false) {
      try {
        await this.webhooksService.dispatchEvent(
          config.organizationId,
          'automation.notification',
          {
            notificationId: notification.id,
            title: config.title,
            message: config.message,
            type: config.type,
            timestamp: new Date().toISOString()
          }
        );
        this.logger.log(`Webhook dispatched for notification ${notification.id}`);
        deliverySuccess = true;
      } catch (error) {
        deliveryErrors.push(`Webhook delivery failed: ${error.message}`);
        this.logger.warn(`Webhook delivery failed for notification ${notification.id}: ${error.message}`);
      }
    }

    if (deliverySuccess) {
      this.logger.log(`Notification ${notification.id} delivered successfully`);
    } else if (deliveryErrors.length > 0) {
      this.logger.warn(`Notification ${notification.id} delivery issues: ${deliveryErrors.join('; ')}`);
    }
  }

  private async generateReport(config: any) {
    if (!config.organizationId || !config.name || !config.type || !config.format) {
      throw new Error('GENERATE_REPORT action requires organizationId, name, type, and format.');
    }

    const report = await this.prisma.client.report.create({
      data: {
        organizationId: config.organizationId,
        clientId: config.clientId,
        name: config.name,
        type: config.type,
        format: config.format,
        status: 'PENDING',
      }
    });

    this.logger.log(`Created automation report ${report.id}`);
  }

  private async changeLeadStage(config: any) {
    if (!config.leadId || !config.newStage) {
      throw new Error('CHANGE_LEAD_STAGE action requires leadId and newStage.');
    }

    await this.prisma.client.lead.update({
      where: { id: config.leadId },
      data: { stage: config.newStage },
    });

    this.logger.log(`Updated lead ${config.leadId} to stage ${config.newStage}`);
  }
}
