import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('event_outbox')
export class EventOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_type: string;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column({ nullable: true })
  institute_id: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'published' | 'failed' | 'dead';

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  max_attempts: number;

  @Column('text', { nullable: true })
  last_error: string;

  @Column({ type: 'timestamp', nullable: true })
  next_retry_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
