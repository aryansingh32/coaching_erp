import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { EventOutbox } from '../entities/event-outbox.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OutboxPollerService {
  private readonly logger = new Logger(OutboxPollerService.name);

  constructor(
    @InjectRepository(EventOutbox)
    private readonly outboxRepository: Repository<EventOutbox>,
    @Inject('NATS_CLIENT') private readonly natsClient: ClientProxy,
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async pollOutbox() {
    const now = new Date();
    
    // Find pending or failed events that are ready to be retried
    const events = await this.outboxRepository.find({
      where: [
        { status: 'pending' },
        { status: 'failed', next_retry_at: LessThanOrEqual(now) }
      ],
      take: 100, // Batch size
    });

    if (events.length === 0) return;

    this.logger.debug(`Found ${events.length} events to process.`);

    for (const event of events) {
      try {
        event.attempts += 1;
        
        // Publish to NATS
        await lastValueFrom(
          this.natsClient.emit(event.event_type, {
            ...event.payload,
            metadata: {
              eventId: event.id,
              instituteId: event.institute_id,
              timestamp: event.created_at,
            }
          })
        );

        event.status = 'published';
        event.published_at = new Date();
        event.last_error = undefined;
      } catch (error: any) {
        this.logger.error(`Failed to publish event ${event.id}: ${error.message}`);
        
        if (event.attempts >= event.max_attempts) {
          event.status = 'dead';
          event.last_error = error.message || 'Unknown error';
          this.logger.warn(`Event ${event.id} marked as DEAD.`);
        } else {
          event.status = 'failed';
          event.last_error = error.message || 'Unknown error';
          // Exponential backoff: 2^attempts * 5 seconds
          const delayMs = Math.pow(2, event.attempts) * 5000;
          event.next_retry_at = new Date(Date.now() + delayMs);
        }
      }

      await this.outboxRepository.save(event);
    }
  }
}
