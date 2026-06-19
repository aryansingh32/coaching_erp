#!/bin/bash

# Define new tables
cat << 'SQL' > new_tables.sql

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

SQL

sed -i '/-- MATERIALIZED VIEWS/e cat new_tables.sql' infra/scripts/init-clickhouse.sql

