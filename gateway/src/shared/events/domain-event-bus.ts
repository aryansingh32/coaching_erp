import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventOutbox } from '../entities/event-outbox.entity';

@Injectable()
export class DomainEventBus {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(EventOutbox)
    private readonly outboxRepository: Repository<EventOutbox>,
  ) {}

  async publish(
    eventType: string,
    payload: any,
    instituteId?: string,
  ): Promise<void> {
    // 1. Write to Outbox table
    const outboxEvent = this.outboxRepository.create({
      event_type: eventType,
      payload,
      institute_id: instituteId,
      status: 'pending',
      attempts: 0,
    });
    
    await this.outboxRepository.save(outboxEvent);

    // 2. Emit to local listeners
    this.eventEmitter.emit(eventType, { ...payload, outboxEventId: outboxEvent.id, instituteId });
  }
}
