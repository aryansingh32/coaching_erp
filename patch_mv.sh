#!/bin/bash

cat << 'SQL' > new_mv.sql
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
SQL

# Replace the old MV definition. We can use perl to replace from 'CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement' to '    student_id;'
perl -i -0777 -pe 's/CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_engagement\nENGINE = SummingMergeTree\(\).*?GROUP BY\n    toDate\(event_time\),\n    institute_id,\n    student_id;/`cat new_mv.sql`/ges' infra/scripts/init-clickhouse.sql
