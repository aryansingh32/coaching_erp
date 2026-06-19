import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('live_meetings')
export class LiveMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  meeting_id: string;

  @Column()
  batch_id: string;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column()
  attendee_pw: string;

  @Column()
  moderator_pw: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
