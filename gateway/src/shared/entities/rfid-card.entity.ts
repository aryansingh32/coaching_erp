import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Institute } from './institute.entity';

@Entity('rfid_cards')
export class RfidCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  card_uid: string;

  @Column({ nullable: true })
  erp_student_id: string;

  @Column()
  institute_id: string;

  @ManyToOne(() => Institute, institute => institute.rfid_cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  assigned_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
