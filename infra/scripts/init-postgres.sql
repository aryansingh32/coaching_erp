-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CoachingOS — PostgreSQL Initialization Script                              ║
-- ║                                                                             ║
-- ║  This script runs ONCE on first container start via                         ║
-- ║  /docker-entrypoint-initdb.d/init.sql                                       ║
-- ║                                                                             ║
-- ║  Tables (6 total — platform-only, NOT domain data):                         ║
-- ║    1. institutes          — tenant configuration (v2 Issue 1)               ║
-- ║    2. rfid_cards          — RFID card-to-student mapping (v2 Issue 1)       ║
-- ║    3. jwt_refresh_tokens  — refresh token hashes (v2 Issue 1)              ║
-- ║    4. event_outbox        — transactional outbox for NATS (v3 Issue 3)     ║
-- ║    5. question_bank       — test questions per institute (v3 Module 11)     ║
-- ║    6. test_attempts       — student test attempt tracking (v3 Module 11)    ║
-- ║                                                                             ║
-- ║  All domain entities (Student, Guardian, Instructor, Batch, Fee, etc.)      ║
-- ║  live in ERPNext + Education. See v2 Issue 1 for the full rationale.        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable required extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for text search

-- ─────────────────────────────────────────────────────────────────────────────
-- Create Metabase database
-- ─────────────────────────────────────────────────────────────────────────────
-- Metabase uses PostgreSQL for its internal metadata storage (questions,
-- dashboards, user sessions). This is separate from coaching_db.
-- The Metabase service connects with MB_DB_DBNAME=metabase.
CREATE DATABASE metabase OWNER coaching;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: institutes
-- ═══════════════════════════════════════════════════════════════════════════
-- Each row represents one coaching institute (tenant).
-- The slug is used for subdomain routing: {slug}.coachingos.local
-- erp_company links to the ERPNext Company doctype for multi-company isolation.
-- moodle_category_id links to the Moodle course category for this tenant.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE institutes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(100) UNIQUE NOT NULL,       -- 'raju-coaching' → raju-coaching.coachingos.local
    name                TEXT NOT NULL,                      -- 'Raju Coaching Classes'
    plan                VARCHAR(50) DEFAULT 'starter',      -- starter | growth | professional
    branding            JSONB DEFAULT '{}',                 -- { logoUrl, primaryColor, tagline }
    erp_company         TEXT,                               -- ERPNext Company name for this tenant
    moodle_category_id  INT,                                -- Moodle category ID for course isolation
    is_active           BOOLEAN DEFAULT TRUE,               -- false = suspended tenant
    settings            JSONB DEFAULT '{}',                 -- feature flags, custom configs
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by slug (used on every API request for tenant resolution)
CREATE INDEX idx_institutes_slug ON institutes (slug) WHERE is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: rfid_cards
-- ═══════════════════════════════════════════════════════════════════════════
-- Maps physical RFID card UIDs to ERPNext Student records.
-- One card per student; cards can be deactivated and reassigned.
-- The rfid-service looks up card_uid on every punch event.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE rfid_cards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_uid            VARCHAR(100) UNIQUE NOT NULL,       -- hex string from RFID reader
    erp_student_id      TEXT NOT NULL,                      -- ERPNext Student.name (e.g. "EDU-STU-2024-00001")
    institute_id        UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    is_active           BOOLEAN DEFAULT TRUE,
    assigned_at         TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at      TIMESTAMPTZ                         -- when card was deactivated
);

-- Fast lookup by card UID (used on every RFID punch — must be fast)
CREATE INDEX idx_rfid_card_uid ON rfid_cards (card_uid) WHERE is_active = TRUE;
-- Find all cards for a student (admin panel)
CREATE INDEX idx_rfid_student ON rfid_cards (erp_student_id);
-- Find all cards for an institute (admin panel)
CREATE INDEX idx_rfid_institute ON rfid_cards (institute_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: jwt_refresh_tokens
-- ═══════════════════════════════════════════════════════════════════════════
-- Stores bcrypt hashes of refresh tokens. Used for:
--   - Token rotation (old token invalidated on refresh)
--   - Forced logout (revoke all tokens for a subject)
--   - Session management (list active sessions)
--
-- subject_id is the ERPNext Student/Instructor/Guardian name.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE jwt_refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id          TEXT NOT NULL,                      -- ERPNext Student/Instructor name
    role                VARCHAR(50) NOT NULL,               -- 'student' | 'instructor' | 'parent' | 'admin'
    institute_id        UUID REFERENCES institutes(id) ON DELETE CASCADE,
    token_hash          TEXT NOT NULL,                      -- bcrypt hash of the refresh token
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked             BOOLEAN DEFAULT FALSE,
    revoked_at          TIMESTAMPTZ,
    user_agent          TEXT,                               -- device/browser info for session management
    ip_address          INET,                               -- last known IP
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Find valid tokens for a subject (used on refresh and logout-all)
CREATE INDEX idx_refresh_subject ON jwt_refresh_tokens (subject_id, role)
    WHERE revoked = FALSE;
-- Cleanup job: delete expired tokens
CREATE INDEX idx_refresh_expires ON jwt_refresh_tokens (expires_at)
    WHERE revoked = FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: event_outbox (v3 Issue 3 — Transactional Outbox Pattern)
-- ═══════════════════════════════════════════════════════════════════════════
-- Every domain event is written here ATOMICALLY before returning to the client.
-- A background poller (OutboxPollerService, runs every 5 seconds) reads
-- pending/failed events and publishes them to NATS JetStream.
--
-- If NATS is down, events queue here instead of being lost.
-- This is the CRITICAL reliability guarantee for the async worker pattern.
--
-- Status lifecycle: pending → published (or pending → failed → published/dead)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE event_outbox (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          VARCHAR(150) NOT NULL,              -- e.g. 'student.created', 'fee.payment.confirmed'
    payload             JSONB NOT NULL,                     -- event-specific data
    institute_id        UUID NOT NULL,                      -- tenant context for the event
    status              VARCHAR(20) DEFAULT 'pending',      -- pending | published | failed | dead
    attempts            INT DEFAULT 0,                      -- retry counter
    max_attempts        INT DEFAULT 5,                      -- after this, status → 'dead'
    last_error          TEXT,                               -- error message from last failed attempt
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    next_retry_at       TIMESTAMPTZ DEFAULT NOW(),          -- exponential backoff timestamp
    published_at        TIMESTAMPTZ                         -- when successfully published to NATS
);

-- The outbox poller query: fetch pending/failed events due for retry, oldest first
-- Partial index for maximum efficiency — only indexes rows that need processing
CREATE INDEX idx_outbox_pending ON event_outbox (status, next_retry_at)
    WHERE status IN ('pending', 'failed');
-- Monitor dead events (Grafana alert when count > 0)
CREATE INDEX idx_outbox_dead ON event_outbox (status, created_at)
    WHERE status = 'dead';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: question_bank (v3 Module 11 — Examination System)
-- ═══════════════════════════════════════════════════════════════════════════
-- Test questions created by teachers. Each question belongs to an institute.
-- Questions are mirrored to Moodle Quiz when a test is published.
--
-- Supports: MCQ, integer-type, multi-correct, subjective
-- JEE/NEET-style negative marking supported via marks_positive/marks_negative
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE question_bank (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id        UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    subject             VARCHAR(100) NOT NULL,              -- 'Physics', 'Chemistry', 'Mathematics'
    topic               VARCHAR(200),                       -- 'Electrostatics', 'Organic Chemistry'
    question_type       VARCHAR(20) NOT NULL                -- 'mcq' | 'integer' | 'multi-correct' | 'subjective'
                        CHECK (question_type IN ('mcq', 'integer', 'multi-correct', 'subjective')),
    question_text       TEXT NOT NULL,                      -- markdown-formatted question
    options             JSONB,                              -- for MCQ: [{"text":"Option A","isCorrect":true}, ...]
    correct_answer      TEXT,                               -- for integer-type: "42"; for subjective: model answer
    explanation         TEXT,                               -- shown after submission for learning
    difficulty          VARCHAR(10) DEFAULT 'medium'        -- easy | medium | hard
                        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    marks_positive      DECIMAL(5,2) DEFAULT 4,             -- marks for correct answer (JEE: +4)
    marks_negative      DECIMAL(5,2) DEFAULT 1,             -- marks deducted for wrong answer (JEE: -1)
    image_url           TEXT,                               -- MinIO URL for question image/diagram
    tags                TEXT[] DEFAULT '{}',                 -- searchable tags: {'jee-mains', '2024', 'pyq'}
    created_by          TEXT NOT NULL,                      -- ERPNext Instructor name
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Filter questions by subject+topic for test creation UI
CREATE INDEX idx_qb_subject_topic ON question_bank (institute_id, subject, topic);
-- Filter by difficulty for balanced test generation
CREATE INDEX idx_qb_difficulty ON question_bank (institute_id, difficulty);
-- Full-text search on question content
CREATE INDEX idx_qb_text_search ON question_bank USING gin (question_text gin_trgm_ops);
-- Tag-based filtering (GIN index for array containment queries)
CREATE INDEX idx_qb_tags ON question_bank USING gin (tags);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: test_attempts (v3 Module 11 — Examination System)
-- ═══════════════════════════════════════════════════════════════════════════
-- Tracks each student's test attempt including:
--   - Start time (used with Redis timer for countdown)
--   - Auto-saved answers (every 30 seconds from client)
--   - Final submission with score calculation
--   - Rank and percentile (computed after all submissions)
--
-- test_id references ERPNext Assessment Plan name.
-- After submission, results are synced to ERPNext Assessment Result.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE test_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id             TEXT NOT NULL,                      -- ERPNext Assessment Plan name
    student_id          TEXT NOT NULL,                      -- ERPNext Student name
    institute_id        UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    submitted_at        TIMESTAMPTZ,                        -- null until submission
    answers             JSONB NOT NULL DEFAULT '{}',        -- { "questionId": "selectedOption", ... }
    score               DECIMAL(8,2),                       -- calculated on submission
    max_score           DECIMAL(8,2),                       -- total possible marks
    rank                INT,                                -- within this test (computed after deadline)
    percentile          DECIMAL(5,2),                       -- within this test
    time_taken_sec      INT,                                -- total seconds from start to submit
    is_submitted        BOOLEAN DEFAULT FALSE,
    is_auto_submitted   BOOLEAN DEFAULT FALSE,              -- true if submitted by timer expiry
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Find a student's attempt for a specific test (uniqueness: one attempt per student per test)
CREATE UNIQUE INDEX idx_attempt_unique ON test_attempts (test_id, student_id);
-- List all attempts for a test (for leaderboard and analytics)
CREATE INDEX idx_attempt_test ON test_attempts (test_id, is_submitted, score DESC NULLS LAST);
-- Find all attempts by a student (student dashboard)
CREATE INDEX idx_attempt_student ON test_attempts (student_id, institute_id);
-- Pending submissions (for auto-submit BullMQ job)
CREATE INDEX idx_attempt_pending ON test_attempts (started_at)
    WHERE is_submitted = FALSE;


-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update trigger to tables with updated_at
CREATE TRIGGER tr_institutes_updated_at
    BEFORE UPDATE ON institutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_question_bank_updated_at
    BEFORE UPDATE ON question_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: Default platform configuration
-- ═══════════════════════════════════════════════════════════════════════════
-- Insert a demo institute for development/testing purposes.
-- Remove or modify this in production.
INSERT INTO institutes (slug, name, plan, branding, settings) VALUES
(
    'demo-academy',
    'Demo Academy',
    'professional',
    '{"logoUrl": "", "primaryColor": "#2563EB", "tagline": "Excellence in Education"}',
    '{"max_students": null, "max_batches": null, "live_classes": true, "rfid_attendance": true}'
);
