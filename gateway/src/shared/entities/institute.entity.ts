import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RfidCard } from './rfid-card.entity';

@Entity('institutes')
export class Institute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ default: 'starter' })
  plan: string;

  @Column('jsonb', { nullable: true })
  branding: Record<string, any>;

  @Column('jsonb', { nullable: true, default: {} })
  features: Record<string, boolean>;

  @Column('jsonb', { nullable: true, default: {} })
  integrations: Record<string, any>;

  @Column({ nullable: true })
  erp_company: string;

  @Column({ nullable: true })
  moodle_category_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RfidCard, card => card.institute)
  rfid_cards: RfidCard[];
}
