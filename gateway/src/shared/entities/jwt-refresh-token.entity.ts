import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('jwt_refresh_tokens')
export class JwtRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject_id: string;

  @Column()
  role: string;

  @Column()
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn()
  created_at: Date;
}
