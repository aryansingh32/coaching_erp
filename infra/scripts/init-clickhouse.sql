-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CoachingOS — ClickHouse Initialization Script                              ║
-- ║                                                                             ║
-- ║  Analytics engine for the coaching platform. All event data flows here      ║
-- ║  via the analytics-worker (NATS subscriber).                                ║
-- ║                                                                             ║
-- ║  Tables:                                                                    ║
-- ║    1. analytics_events   — general platform events (3-year TTL)             ║
-- ║    2. attendance_events  — attendance records (5-year TTL, compliance)       ║
-- ║    3. fee_events         — financial events (7-year TTL, GST compliance)    ║
-- ║    4. audit_log          — API audit trail (7-year TTL, v3 Flaw E)          ║
-- ║                                                                             ║
-- ║  Materialized Views:                                                        ║
-- ║    - mv_daily_attendance       — daily attendance aggregates per batch      ║
-- ║    - mv_monthly_fee_collection — monthly fee collection per institute       ║
-- ║    - mv_test_performance       — test performance aggregates per batch      ║
-- ║    - mv_student_engagement     — student engagement scores                  ║
-- ║                                                                             ║
-- ║  Storage: Tiered (hot SSD → cold MinIO S3 after 1 year)                    ║
-- ║  See: infra/clickhouse-config.xml for storage_policy = 'tiered'            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: analytics_events (v3 Issue 6)
-- ═══════════════════════════════════════════════════════════════════════════
-- General-purpose event table for ALL platform events.
-- Partitioned by month for efficient time-range queries and TTL management.
-- Ordered by (institute_id, date, event_type) for multi-tenant dashboard queries.
--
-- TTL Policy:
--   - Raw events deleted after 3 years
--   - Data moves to MinIO cold storage after 1 year (via tiered storage policy)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS analytics_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),         -- rfid_entry, test_submit, video_watch, login, etc.
    subject             LowCardinality(String) DEFAULT '',   -- Physics, Chemistry, Mathematics
    reference_id        String DEFAULT '',               -- related entity ID (assessment plan, payment ID, etc.)
    properties          String DEFAULT '{}',             -- JSON string for event-specific data
    duration_sec        UInt32 DEFAULT 0,                -- video watch time, class duration, etc.
    score               Nullable(Float32),               -- test score (null for non-test events)
    rank                Nullable(UInt32),                 -- test rank (null for non-test events)
    device_type         LowCardinality(String) DEFAULT 'unknown'   -- android, ios, web, rfid
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), event_type)
-- Retention: raw events kept 3 years, moved to cold storage after 1 year
TTL
    event_time + INTERVAL 3 YEAR DELETE,
    event_time + INTERVAL 1 YEAR TO VOLUME 'cold'
SETTINGS storage_policy = 'tiered';


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: attendance_events
-- ═══════════════════════════════════════════════════════════════════════════
-- Dedicated table for attendance data with longer retention (5 years).
-- Coaching institutes in India may need attendance records for regulatory
-- compliance and parent disputes.
--
-- Sources: RFID punch, manual marking, BBB auto-attendance
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS attendance_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),         -- rfid_entry, rfid_exit, manual_present, manual_absent, online_join
    subject             LowCardinality(String) DEFAULT '',
    reference_id        String DEFAULT '',               -- device_id for RFID, meeting_id for BBB
    properties          String DEFAULT '{}',             -- { card_uid, reader_location, etc. }
    duration_sec        UInt32 DEFAULT 0,
    score               Nullable(Float32),
    rank                Nullable(UInt32),
    device_type         LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), student_id)
-- 5-year retention for compliance
TTL event_time + INTERVAL 5 YEAR DELETE;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: fee_events
-- ═══════════════════════════════════════════════════════════════════════════
-- Financial events with 7-year retention for GST compliance.
-- Every payment, refund, and invoice event is recorded here.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fee_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),         -- fee_payment, fee_refund, fee_reminder_sent, fee_overdue
    subject             LowCardinality(String) DEFAULT '',
    reference_id        String DEFAULT '',               -- razorpay_payment_id, ERPNext Payment Entry name
    properties          String DEFAULT '{}',             -- { amount, mode, receipt_url, etc. }
    duration_sec        UInt32 DEFAULT 0,
    score               Nullable(Float32),               -- amount stored as score for aggregation
    rank                Nullable(UInt32),
    device_type         LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toYYYYMM(event_time))
-- 7-year retention for GST/tax compliance
TTL event_time + INTERVAL 7 YEAR DELETE;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: audit_log (v3 Flaw E — Compliance Audit Trail)
-- ═══════════════════════════════════════════════════════════════════════════
-- Records all write operations (POST, PUT, PATCH, DELETE) made through
-- the gateway. Used for:
--   - Compliance: who deleted a student? who changed a fee amount?
--   - Dispute resolution: parent claims fee was paid but not recorded
--   - Security: detect unauthorized access patterns
--
-- NOTE: Request body is NOT logged (may contain PII/credentials).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
    timestamp           DateTime DEFAULT now(),
    actor_id            String,                          -- ERPNext Student/Instructor name or 'anonymous'
    actor_role          LowCardinality(String),          -- student, instructor, admin, parent, superadmin
    institute_id        String,
    action              String,                          -- 'POST /api/v1/students', 'DELETE /api/v1/rfid/...'
    resource_type       LowCardinality(String),          -- students, batches, fees, tests, rfid, etc.
    resource_id         String,                          -- the created/modified resource ID
    ip_address          String,
    user_agent          String
)
ENGINE = MergeTree()
ORDER BY (institute_id, timestamp)
-- 7-year retention for compliance with educational data regulations
TTL timestamp + INTERVAL 7 YEAR DELETE;


-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: test_events
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS test_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),
    subject             LowCardinality(String) DEFAULT '',
    reference_id        String DEFAULT '',
    properties          String DEFAULT '{}',
    duration_sec        UInt32 DEFAULT 0,
    score               Nullable(Float32),
    rank                Nullable(UInt32),
    device_type         LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), student_id)
TTL event_time + INTERVAL 5 YEAR DELETE;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: class_events
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS class_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),
    subject             LowCardinality(String) DEFAULT '',
    reference_id        String DEFAULT '',
    properties          String DEFAULT '{}',
    duration_sec        UInt32 DEFAULT 0,
    score               Nullable(Float32),
    rank                Nullable(UInt32),
    device_type         LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), student_id)
TTL event_time + INTERVAL 3 YEAR DELETE;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 7: lms_events
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lms_events (
    event_time          DateTime DEFAULT now(),
    institute_id        String,
    batch_id            String DEFAULT '',
    student_id          String DEFAULT '',
    event_type          LowCardinality(String),
    subject             LowCardinality(String) DEFAULT '',
    reference_id        String DEFAULT '',
    properties          String DEFAULT '{}',
    duration_sec        UInt32 DEFAULT 0,
    score               Nullable(Float32),
    rank                Nullable(UInt32),
    device_type         LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), student_id)
TTL event_time + INTERVAL 3 YEAR DELETE;

-- MATERIALIZED VIEWS — Pre-aggregated dashboards for sub-second queries
-- ═══════════════════════════════════════════════════════════════════════════
-- These materialized views are incrementally maintained by ClickHouse.
-- New data inserted into the source tables automatically updates these views.
-- Dashboard queries hit these views instead of scanning raw event tables.

-- ─────────────────────────────────────────────────────────────────────────
-- MV 1: Daily Attendance Summary per Batch
-- ─────────────────────────────────────────────────────────────────────────
-- Used by: Admin dashboard attendance chart, batch attendance reports
-- Query: SELECT * FROM mv_daily_attendance WHERE institute_id = '...'
--         AND event_date >= today() - 30
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_attendance
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (institute_id, event_date, batch_id)
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    batch_id,
    countIf(event_type IN ('rfid_entry', 'manual_present', 'online_join')) AS present_count,
    countIf(event_type = 'manual_absent') AS absent_count,
    uniqExact(student_id) AS unique_students
FROM attendance_events
GROUP BY
    toDate(event_time),
    institute_id,
    batch_id;


-- ─────────────────────────────────────────────────────────────────────────
-- MV 2: Monthly Fee Collection per Institute
-- ─────────────────────────────────────────────────────────────────────────
-- Used by: Admin dashboard fee collection chart, monthly revenue reports
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_fee_collection
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(event_month)
ORDER BY (institute_id, event_month)
AS SELECT
    toStartOfMonth(event_time) AS event_month,
    institute_id,
    countIf(event_type = 'fee_payment') AS payment_count,
    sumIf(score, event_type = 'fee_payment') AS total_collected,
    countIf(event_type = 'fee_refund') AS refund_count,
    sumIf(score, event_type = 'fee_refund') AS total_refunded,
    countIf(event_type = 'fee_overdue') AS overdue_count
FROM fee_events
GROUP BY
    toStartOfMonth(event_time),
    institute_id;


-- ─────────────────────────────────────────────────────────────────────────
-- MV 3: Test Performance Aggregates per Batch
-- ─────────────────────────────────────────────────────────────────────────
-- Used by: Test analytics page, batch performance comparison
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_test_performance
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (institute_id, event_date, batch_id, reference_id)
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    batch_id,
    reference_id AS test_id,
    count() AS attempt_count,
    avg(score) AS avg_score,
    max(score) AS max_score,
    min(score) AS min_score,
    avg(duration_sec) AS avg_time_sec
FROM test_events
WHERE event_type = 'test_submit'
GROUP BY
    toDate(event_time),
    institute_id,
    batch_id,
    reference_id;


-- ─────────────────────────────────────────────────────────────────────────
-- MV 4: Student Engagement Score (30-day rolling)
-- ─────────────────────────────────────────────────────────────────────────
-- Used by: Dropout risk assessment, student engagement dashboard
-- Tracks activity count per student per day for engagement scoring
CREATE TABLE IF NOT EXISTS student_engagement (
    event_date          Date,
    institute_id        String,
    student_id          String,
    attendance_events   UInt64,
    test_events         UInt64,
    video_events        UInt64,
    login_events        UInt64,
    total_video_sec     UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (institute_id, student_id, event_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement_attendance
TO student_engagement
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    student_id,
    countIf(event_type IN ('rfid_entry', 'manual_present', 'online_join')) AS attendance_events,
    0 AS test_events,
    0 AS video_events,
    0 AS login_events,
    0 AS total_video_sec
FROM attendance_events
GROUP BY toDate(event_time), institute_id, student_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement_test
TO student_engagement
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    student_id,
    0 AS attendance_events,
    countIf(event_type = 'test_submit') AS test_events,
    0 AS video_events,
    0 AS login_events,
    0 AS total_video_sec
FROM test_events
GROUP BY toDate(event_time), institute_id, student_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement_lms
TO student_engagement
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    student_id,
    0 AS attendance_events,
    0 AS test_events,
    countIf(event_type = 'video_watch') AS video_events,
    0 AS login_events,
    sumIf(toUInt64(duration_sec), event_type = 'video_watch') AS total_video_sec
FROM lms_events
GROUP BY toDate(event_time), institute_id, student_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement_analytics
TO student_engagement
AS SELECT
    toDate(event_time) AS event_date,
    institute_id,
    student_id,
    0 AS attendance_events,
    0 AS test_events,
    0 AS video_events,
    countIf(event_type = 'login') AS login_events,
    0 AS total_video_sec
FROM analytics_events
GROUP BY toDate(event_time), institute_id, student_id;



-- ═══════════════════════════════════════════════════════════════════════════
-- USEFUL QUERIES (reference — not executed, just documentation)
-- ═══════════════════════════════════════════════════════════════════════════

-- Dropout Risk Query (from v3 Module 14):
-- SELECT
--     student_id,
--     countIf(event_type = 'rfid_entry' AND event_time >= now() - INTERVAL 30 DAY) /
--     max(toUInt32(30)) * 100 as attendance_pct_30d,
--     maxIf(event_time, event_type = 'test_submit') as last_test_date,
--     maxIf(event_time, event_type = 'video_watch') as last_video_date,
--     CASE
--         WHEN attendance_pct_30d < 60
--          AND last_test_date < now() - INTERVAL 14 DAY
--          AND last_video_date < now() - INTERVAL 7 DAY
--         THEN 'high'
--         WHEN attendance_pct_30d < 75 OR last_test_date < now() - INTERVAL 21 DAY
--         THEN 'medium'
--         ELSE 'low'
--     END as risk_level
-- FROM analytics_events
-- WHERE institute_id = {instituteId:String}
--   AND event_time >= now() - INTERVAL 30 DAY
-- GROUP BY student_id;
