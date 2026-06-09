import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType } from '@prisma/client';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Record a tracking event.
   * Expected payload structure:
   * {
   *   organizationId: string;
   *   visitorId?: string; // optional, if not provided a new Visitor will be created
   *   userAgent?: string;
   *   ipAddress?: string;
   *   type: EventType;
   *   payload: any; // arbitrary JSON payload for the event
   * }
   */
  async recordEvent(data: {
    organizationId: string;
    visitorId?: string;
    userAgent?: string;
    ipAddress?: string;
    type: EventType;
    payload: any;
  }) {
    const { organizationId, visitorId, userAgent, ipAddress, type, payload } = data;
    // Ensure Visitor exists
    let visitorIdToUse = visitorId;
    if (!visitorIdToUse) {
      const visitor = await this.prisma.client.visitor.create({
        data: {
          organizationId,
          userAgent,
          ipAddress,
        },
      });
      visitorIdToUse = visitor.id;
    }

    // Create a Session (for simplicity start a new session for every event)
    const session = await this.prisma.client.session.create({
      data: {
        visitorId: visitorIdToUse,
        // startedAt defaults to now
      },
    });

    // Create Event linked to session
    await this.prisma.client.event.create({
      data: {
        sessionId: session.id,
        type,
        payload,
        // timestamp defaults to now
      },
    });

    this.logger.log(`Tracked event ${type} for organization ${organizationId}`);
    return { visitorId: visitorIdToUse, sessionId: session.id };
  }
}
