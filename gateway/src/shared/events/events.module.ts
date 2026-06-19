import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventOutbox } from '../entities/event-outbox.entity';
import { DomainEventBus } from './domain-event-bus';
import { OutboxPollerService } from './outbox-poller.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventOutbox]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  providers: [DomainEventBus, OutboxPollerService],
  exports: [DomainEventBus],
})
export class EventsModule {}
