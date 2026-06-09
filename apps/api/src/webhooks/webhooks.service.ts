import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

import { QueueService } from '../jobs/queue.service';
import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class WebhooksService implements OnModuleInit {
  private readonly logger = new Logger(WebhooksService.name);

  private queueService: QueueService;

  constructor(
    private moduleRef: ModuleRef,
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  onModuleInit() {
    this.queueService = this.moduleRef.get(QueueService, { strict: false });
  }

  async dispatchEvent(organizationId: string, eventType: string, payload: any) {
    const endpoints = await this.prisma.client.webhookEndpoint.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: eventType }
      }
    });

    for (const endpoint of endpoints) {
      this.queueService.queueWebhook(endpoint, eventType, payload).catch(err => {
        this.logger.error(`Failed to queue webhook for ${endpoint.url}: ${err.message}`);
      });
    }
  }

  async fireWebhook(endpoint: any, eventType: string, payload: any) {
    const startTime = Date.now();
    const signaturePayload = JSON.stringify({ eventType, payload });
    const signature = crypto.createHmac('sha256', endpoint.secret).update(signaturePayload).digest('hex');

    let status = 'FAILED';
    let responseCode = null;

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint.url, {
          eventType,
          payload
        }, {
          headers: {
            'x-webhook-signature': signature,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 seconds timeout
        })
      );
      
      status = 'SUCCESS';
      responseCode = response.status;
    } catch (error: any) {
      status = 'FAILED';
      responseCode = error.response?.status || 500;
    }

    const durationMs = Date.now() - startTime;

    // Log the delivery
    await this.prisma.client.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        eventType,
        payload,
        status,
        responseCode,
        durationMs
      }
    });
  }

  async getEndpoints(organizationId: string) {
    return this.prisma.client.webhookEndpoint.findMany({
      where: { organizationId }
    });
  }

  async createEndpoint(organizationId: string, data: any) {
    return this.prisma.client.webhookEndpoint.create({
      data: {
        organizationId,
        url: data.url,
        secret: data.secret || crypto.randomBytes(32).toString('hex'),
        events: data.events || []
      }
    });
  }

  async deleteEndpoint(organizationId: string, id: string) {
    return this.prisma.client.webhookEndpoint.deleteMany({
      where: { id, organizationId }
    });
  }
}
