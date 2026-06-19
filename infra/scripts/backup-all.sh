#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  CoachingOS — Full Platform Backup Script (v3 Issue 7)              ║
# ║  Run daily via cron: 0 2 * * * /path/to/backup-all.sh              ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

BACKUP_DIR="/tmp/coaching-backup/$(date +%Y%m%d_%H%M%S)"
S3_BUCKET="${BACKUP_S3_BUCKET:-s3://coaching-backups}"
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting CoachingOS backup — $(date)"

# 1. PostgreSQL (gateway platform DB)
echo "📦 Backing up PostgreSQL..."
docker exec postgres pg_dumpall -U coaching | gzip > "$BACKUP_DIR/postgres.sql.gz"

# 2. ERPNext MariaDB (master identity store)
echo "📦 Backing up ERPNext MariaDB..."
docker exec erpnext-db mysqldump -u root -p"${ERPNEXT_DB_ROOT_PASSWORD}" --all-databases | gzip > "$BACKUP_DIR/erpnext-db.sql.gz"

# 3. Moodle MariaDB
echo "📦 Backing up Moodle MariaDB..."
docker exec moodle-db mysqldump -u root -p"${MOODLE_DB_ROOT_PASSWORD}" moodle | gzip > "$BACKUP_DIR/moodle-db.sql.gz"

# 4. ClickHouse (analytics — only recent data, old data in cold tier)
echo "📦 Backing up ClickHouse recent data..."
docker exec clickhouse clickhouse-client --query "
  SELECT * FROM coaching_analytics.analytics_events
  WHERE event_time >= now() - INTERVAL 7 DAY
  FORMAT Native
" | gzip > "$BACKUP_DIR/clickhouse-recent.native.gz" 2>/dev/null || echo "  ⚠️  ClickHouse backup skipped (may be empty)"

# 5. MinIO objects (selective — skip video HLS which can be re-generated)
echo "📦 Backing up MinIO metadata..."
docker exec minio mc ls local/ > "$BACKUP_DIR/minio-inventory.txt" 2>/dev/null || echo "  ⚠️  MinIO inventory skipped"

# 6. Upload to S3
if command -v aws &>/dev/null; then
  echo "☁️  Uploading to S3: $S3_BUCKET/$(basename $BACKUP_DIR)/"
  aws s3 sync "$BACKUP_DIR" "$S3_BUCKET/$(basename $BACKUP_DIR)/" --quiet
  echo "✅ S3 upload complete"
else
  echo "⚠️  aws CLI not found — backup saved locally at $BACKUP_DIR"
fi

# 7. Cleanup local backups older than 7 days
find /tmp/coaching-backup/ -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "✅ Backup complete — $(date)"
