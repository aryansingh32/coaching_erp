import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  test_id: string;

  @Column()
  student_id: string;

  @Column()
  institute_id: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date;

  @Column('jsonb', { nullable: true })
  answers: Record<string, any>;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'int', nullable: true })
  rank: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentile: number;

  @Column({ type: 'int', nullable: true })
  time_taken_sec: number;

  @Column({ default: false })
  is_submitted: boolean;

  @CreateDateColumn()
  created_at: Date;
}
