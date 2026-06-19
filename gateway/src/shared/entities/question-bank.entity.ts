import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Institute } from './institute.entity';

@Entity('question_bank')
export class QuestionBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institute_id: string;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column()
  subject: string;

  @Column({ nullable: true })
  topic: string;

  @Column()
  question_type: 'mcq' | 'integer' | 'multi-correct' | 'subjective';

  @Column('text')
  question_text: string;

  @Column('jsonb', { nullable: true })
  options: Record<string, any>;

  @Column('jsonb', { nullable: true })
  correct_answer: any;

  @Column('text', { nullable: true })
  explanation: string;

  @Column({ nullable: true })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  marks_positive: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  marks_negative: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
