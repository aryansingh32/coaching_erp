import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export class GatewaySchema1739900000000 implements MigrationInterface {
  name = 'GatewaySchema1739900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS institutes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        plan varchar NOT NULL DEFAULT 'starter',
        branding jsonb,
        features jsonb DEFAULT '{}'::jsonb,
        integrations jsonb DEFAULT '{}'::jsonb,
        erp_company varchar,
        moodle_category_id varchar,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE institutes
      ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}'::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE institutes
      ADD COLUMN IF NOT EXISTS integrations jsonb DEFAULT '{}'::jsonb
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rfid_cards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        card_uid varchar NOT NULL UNIQUE,
        erp_student_id varchar,
        institute_id uuid NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        assigned_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_rfid_institute FOREIGN KEY (institute_id)
          REFERENCES institutes(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS jwt_refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id varchar NOT NULL,
        role varchar NOT NULL,
        token_hash varchar NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked boolean NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_outbox (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type varchar NOT NULL,
        payload jsonb NOT NULL,
        institute_id varchar,
        status varchar NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        max_attempts integer NOT NULL DEFAULT 3,
        last_error text,
        next_retry_at TIMESTAMP,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        institute_id uuid NOT NULL,
        subject varchar NOT NULL,
        topic varchar,
        question_type varchar NOT NULL,
        question_text text NOT NULL,
        options jsonb,
        correct_answer jsonb,
        explanation text,
        difficulty varchar,
        marks_positive numeric(5,2) NOT NULL DEFAULT 0,
        marks_negative numeric(5,2) NOT NULL DEFAULT 0,
        image_url varchar,
        created_by varchar,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_question_institute FOREIGN KEY (institute_id)
          REFERENCES institutes(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS test_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id varchar NOT NULL,
        student_id varchar NOT NULL,
        institute_id varchar NOT NULL,
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        answers jsonb,
        score numeric(8,2),
        rank integer,
        percentile numeric(5,2),
        time_taken_sec integer,
        is_submitted boolean NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS live_meetings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id varchar NOT NULL UNIQUE,
        batch_id varchar NOT NULL,
        tenant_id varchar NOT NULL,
        name varchar NOT NULL,
        attendee_pw varchar NOT NULL,
        moderator_pw varchar NOT NULL,
        status varchar NOT NULL DEFAULT 'active',
        created_by varchar,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_live_meetings_tenant_status
      ON live_meetings (tenant_id, status)
    `);

    await queryRunner.query(`
      INSERT INTO institutes (id, slug, name, plan, branding, features, integrations, erp_company)
      VALUES (
        '${DEFAULT_TENANT_ID}',
        'demo-institute',
        'Demo Institute',
        'professional',
        '{"primaryColor":"#1e40af","instituteName":"Demo Institute"}'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        'CoachingOS'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        plan = EXCLUDED.plan,
        branding = EXCLUDED.branding
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS live_meetings`);
    await queryRunner.query(`DROP TABLE IF EXISTS test_attempts`);
    await queryRunner.query(`DROP TABLE IF EXISTS question_bank`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_outbox`);
    await queryRunner.query(`DROP TABLE IF EXISTS jwt_refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS rfid_cards`);
    await queryRunner.query(`DELETE FROM institutes WHERE id = '${DEFAULT_TENANT_ID}'`);
    await queryRunner.query(`DROP TABLE IF EXISTS institutes`);
  }
}
