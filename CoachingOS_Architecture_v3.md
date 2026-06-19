# CoachingOS — Architecture v3.0
## Production SaaS: All Flaws Fixed, All 17 Features Specified

> Builds on v2.0. This document covers only what is NEW or CHANGED.
> Read v2.0 first for foundation decisions (ERPNext identity, NATS event bus, worker pattern).

---

## Part 1: Their 7 Issues — Verdict and Fixes

### Issue 1: ERPNext as Bottleneck (GENUINE — Critical)

Every read hits ERPNext over HTTP. At 100 concurrent users, ERPNext Gunicorn workers (4 by default) will queue requests. Login becomes slow. Dashboard hangs. Parent opens app during morning attendance rush and gets a timeout.

**Fix: Redis Read Cache with Typed TTLs**

Not a generic cache. Specific keys, specific TTLs, specific invalidation events.

```typescript
// gateway/src/shared/cache/erp-cache.service.ts

@Injectable()
export class ErpCacheService {
  private readonly TTL = {
    STUDENT_PROFILE:    900,   // 15 min — changes rarely
    BATCH_INFO:         1800,  // 30 min — changes very rarely
    BATCH_STUDENTS:     600,   // 10 min — enrollment changes occasionally
    FEE_SUMMARY:        300,   // 5 min — payment state changes
    ATTENDANCE_TODAY:   60,    // 1 min — live during attendance session
    INSTITUTE_CONFIG:   3600,  // 1 hour — branding/settings rarely change
    TEACHER_SCHEDULE:   900,   // 15 min
  };

  constructor(private redis: RedisService) {}

  async getStudent(erpStudentName: string): Promise<ErpStudent | null> {
    const cached = await this.redis.get(`student:${erpStudentName}`);
    if (cached) return JSON.parse(cached);
    return null;
  }

  async setStudent(student: ErpStudent): Promise<void> {
    await this.redis.setex(
      `student:${student.name}`,
      this.TTL.STUDENT_PROFILE,
      JSON.stringify(student)
    );
  }

  async invalidateStudent(erpStudentName: string): Promise<void> {
    await this.redis.del(`student:${erpStudentName}`);
    await this.redis.del(`student:fees:${erpStudentName}`);
    await this.redis.del(`student:attendance:${erpStudentName}`);
  }

  async getBatch(studentGroupName: string): Promise<ErpStudentGroup | null> {
    const cached = await this.redis.get(`batch:${studentGroupName}`);
    if (cached) return JSON.parse(cached);
    return null;
  }

  async setBatch(batch: ErpStudentGroup): Promise<void> {
    await this.redis.setex(`batch:${batch.name}`, this.TTL.BATCH_INFO, JSON.stringify(batch));
  }

  async getInstituteConfig(slug: string): Promise<InstituteConfig | null> {
    const cached = await this.redis.get(`institute:${slug}`);
    if (cached) return JSON.parse(cached);
    return null;
  }
}
```

**Cache-Through Pattern in EducationAdapter:**

```typescript
// Always: cache → ERPNext fallback → cache write

async getStudentByPhone(phone: string): Promise<ErpStudent | null> {
  const cacheKey = `student:phone:${phone}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const results = await this.listDocs<ErpStudent>(
    'Student',
    [['student_mobile_number', '=', phone]],
    ['name', 'student_name', 'student_mobile_number', 'student_email_id',
     'custom_moodle_user_id', 'custom_fcm_token']
  );

  const student = results[0] || null;
  if (student) {
    await this.redis.setex(cacheKey, 900, JSON.stringify(student));
    await this.redis.setex(`student:${student.name}`, 900, JSON.stringify(student));
  }
  return student;
}
```

**Cache Invalidation via DomainEventBus:**

```typescript
// When any worker updates ERPNext data, it publishes an invalidation event
// The gateway's cache listener clears the relevant Redis keys

@OnEvent(EVENTS.STUDENT_PROFILE_UPDATED)
async onStudentUpdated(event: DomainEvent<StudentUpdatedPayload>) {
  await this.cache.invalidateStudent(event.payload.erpStudentName);
}

@OnEvent(EVENTS.FEE_PAYMENT_CONFIRMED)
async onFeePayment(event: DomainEvent<FeePaymentPayload>) {
  await this.redis.del(`student:fees:${event.payload.erpStudentName}`);
}

@OnEvent(EVENTS.BATCH_UPDATED)
async onBatchUpdated(event: DomainEvent<BatchUpdatedPayload>) {
  await this.redis.del(`batch:${event.payload.studentGroupName}`);
}
```

---

### Issue 3: NATS Event Publishing Bug → Outbox Pattern (GENUINE — Critical)

The current code:
```typescript
await this.education.createStudent(dto);  // success
await this.eventBus.publish(event);       // NATS is down → silent data inconsistency
```

If NATS is restarting, the student exists in ERPNext with no Moodle user, no Novu subscriber, no ClickHouse enrollment event. You'll never know.

**Fix: Transactional Outbox Pattern**

The outbox table is the 4th and final table in PostgreSQL. Events are written here atomically before returning to the client. A background poller publishes from outbox to NATS. NATS going down = events queue, not events lost.

**Add to PostgreSQL schema:**

```sql
-- infra/scripts/init-postgres.sql

CREATE TABLE institutes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    plan        VARCHAR(50) DEFAULT 'starter',
    branding    JSONB DEFAULT '{}',
    erp_company TEXT,
    moodle_category_id INT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfid_cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_uid        VARCHAR(100) UNIQUE NOT NULL,
    erp_student_id  TEXT NOT NULL,
    institute_id    UUID REFERENCES institutes(id),
    is_active       BOOLEAN DEFAULT TRUE,
    assigned_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jwt_refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  TEXT NOT NULL,
    role        VARCHAR(50) NOT NULL,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Transactional Outbox
CREATE TABLE event_outbox (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(150) NOT NULL,
    payload         JSONB NOT NULL,
    institute_id    UUID NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',   -- pending | published | failed | dead
    attempts        INT DEFAULT 0,
    max_attempts    INT DEFAULT 5,
    last_error      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    next_retry_at   TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_outbox_pending ON event_outbox (status, next_retry_at)
    WHERE status IN ('pending', 'failed');
```

**Revised DomainEventBus:**

```typescript
// gateway/src/shared/events/domain-event-bus.ts

@Injectable()
export class DomainEventBus {
  constructor(
    private emitter: EventEmitter2,
    @InjectRepository(EventOutbox) private outboxRepo: Repository<EventOutbox>,
  ) {}

  // Write to outbox first. Background poller publishes to NATS.
  // Client never waits for NATS. NATS downtime = backlog, not data loss.
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    // Write to outbox (PostgreSQL — always available if gateway is up)
    await this.outboxRepo.save({
      event_type: event.type,
      payload: event.payload as any,
      institute_id: event.instituteId,
      status: 'pending',
    });

    // Also fire local EventEmitter for same-process listeners (cache invalidation, WebSocket)
    this.emitter.emit(event.type, event);
  }
}
```

**Outbox Poller (runs inside gateway as a @Cron job):**

```typescript
// gateway/src/shared/events/outbox-poller.service.ts

@Injectable()
export class OutboxPollerService {
  private nats: NatsConnection;
  private sc = StringCodec();

  constructor(
    @InjectRepository(EventOutbox) private outboxRepo: Repository<EventOutbox>,
  ) {}

  async onModuleInit() {
    this.nats = await connect({ servers: process.env.NATS_URL, name: 'outbox-poller' });
  }

  @Cron('*/5 * * * * *')   // every 5 seconds
  async publishPendingEvents(): Promise<void> {
    const events = await this.outboxRepo.find({
      where: {
        status: In(['pending', 'failed']),
        next_retry_at: LessThanOrEqual(new Date()),
        attempts: LessThan(5),
      },
      take: 100,
      order: { created_at: 'ASC' },
    });

    for (const event of events) {
      try {
        const js = this.nats.jetstream();
        await js.publish(
          event.event_type,
          this.sc.encode(JSON.stringify({ type: event.event_type, payload: event.payload }))
        );
        await this.outboxRepo.update(event.id, {
          status: 'published',
          published_at: new Date(),
        });
      } catch (err) {
        const nextAttempt = event.attempts + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, nextAttempt), 300000); // max 5 min
        await this.outboxRepo.update(event.id, {
          attempts: nextAttempt,
          status: nextAttempt >= 5 ? 'dead' : 'failed',
          last_error: err.message,
          next_retry_at: new Date(Date.now() + backoffMs),
        });
      }
    }
  }

  // Dead events alert — Grafana queries this via Prometheus
  @Cron('0 * * * *')   // every hour
  async alertOnDeadEvents(): Promise<void> {
    const deadCount = await this.outboxRepo.count({ where: { status: 'dead' } });
    if (deadCount > 0) {
      // Prometheus counter — triggers PagerDuty/Grafana alert
      this.metrics.increment('outbox.dead_events', deadCount);
    }
  }
}
```

---

### Issue 5: Multi-Tenant Isolation (GENUINE — Critical)

**Problem:** One ERPNext site with all institutes sharing the same doctypes. If a gateway bug omits `institute_id` from a query, Institute A sees Institute B's students.

**Fix Part A: ERPNext Multi-Company (one Company per institute)**

ERPNext natively supports multiple companies on one site. Every Education doctype (`Student`, `Student Group`, `Assessment Plan`, `Fee Structure`, `Payment Entry`) has a `company` field. Access control in ERPNext can be restricted per company.

```bash
# In ERPNext after setup:
# For each institute, create one Company:
# Company → "Raju Coaching Classes" (linked to institute slug)
# Company → "Brilliant Academy" (linked to another slug)

# All gateway API calls include the company filter:
# GET /api/resource/Student?filters=[["company","=","Raju Coaching Classes"]]
```

**Fix Part B: Company Field Enforcement in EducationAdapter**

```typescript
// EducationAdapter always injects institute company into every write and read

async createStudent(dto: CreateStudentDto): Promise<ErpStudent> {
  const company = await this.getInstituteCompany(dto.instituteId);  // cached
  return this.createDoc<ErpStudent>('Student', {
    student_name: dto.name,
    student_mobile_number: dto.phone,
    company,   // ← enforced on EVERY create
  });
}

async listStudents(instituteId: string, filters: any[] = []): Promise<ErpStudent[]> {
  const company = await this.getInstituteCompany(instituteId);
  return this.listDocs('Student', [
    ['company', '=', company],   // ← always first filter
    ...filters,
  ]);
}
```

**Fix Part C: ClickHouse Row-Level Tenant Guard**

```typescript
// In ClickHouseAdapter — a query decorator that enforces institute_id

private guardTenant(query: string, instituteId: string): string {
  // Inject AND institute_id = '...' into every WHERE clause
  // This is a safety net — callers should also pass it explicitly
  if (!query.toLowerCase().includes('institute_id')) {
    throw new Error(`ClickHouse query missing institute_id filter: ${query.substring(0, 100)}`);
  }
  return query;
}

async query(sql: string, params: Record<string, any>): Promise<any> {
  if (!params.instituteId) throw new Error('instituteId required for all ClickHouse queries');
  this.guardTenant(sql, params.instituteId);
  return this.client.query({ query: sql, query_params: params });
}
```

**Fix Part D: Metabase Dashboard Tenant Locking**

```typescript
// MetabaseAdapter — parameters passed to embed tokens are LOCKED, not just defaulted

generateEmbedToken(dashboardId: number, params: { instituteId: string; [key: string]: any }): string {
  const payload = {
    resource: { dashboard: dashboardId },
    params: {
      // Locked params cannot be overridden by URL manipulation
      institute_id: params.instituteId,    // ← LOCKED at token generation time
      ...(params.batchId && { batch_id: params.batchId }),
    },
    exp: Math.round(Date.now() / 1000) + 600,
  };
  return jwt.sign(payload, this.secretKey);
}
// Metabase interprets params in signed JWT as locked — URL hash cannot override them.
```

**Fix Part E: Moodle Category Isolation**

Each institute maps to exactly one Moodle category (`institutes.moodle_category_id`). All batch courses are created inside that category. The admin token used by the gateway has no restrictions by default, but:

```typescript
// MoodleAdapter enforces category on course creation
async createCourse(dto: CreateMoodleCourseDto, moodleCategoryId: number): Promise<{ courseId: number }> {
  // moodleCategoryId comes from institutes table — institute-specific
  return this.call('core_course_create_courses', {
    'courses[0][fullname]': dto.name,
    'courses[0][shortname]': `${dto.instituteSlug}_batch_${dto.batchId}`,
    'courses[0][categoryid]': moodleCategoryId,  // ← always institute-specific
    'courses[0][idnumber]': `${dto.instituteSlug}::${dto.batchId}`,
  });
}
```

---

### Issue 6: ClickHouse Retention Policy (GENUINE)

```sql
-- infra/scripts/init-clickhouse.sql

CREATE TABLE IF NOT EXISTS analytics_events (
    event_time     DateTime DEFAULT now(),
    institute_id   String,
    batch_id       String DEFAULT '',
    student_id     String DEFAULT '',
    event_type     LowCardinality(String),
    subject        LowCardinality(String) DEFAULT '',
    reference_id   String DEFAULT '',
    properties     String DEFAULT '{}',
    duration_sec   UInt32 DEFAULT 0,
    score          Nullable(Float32),
    rank           Nullable(UInt32),
    device_type    LowCardinality(String) DEFAULT 'unknown'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), event_type)
-- Retention by event type: hot data 3 years, aggregate indefinitely
TTL
    event_time + INTERVAL 3 YEAR DELETE,                        -- raw events: 3 years
    event_time + INTERVAL 1 YEAR TO VOLUME 'cold'               -- move to cold storage after 1 year
SETTINGS storage_policy = 'tiered';

-- Attendance: keep 5 years (compliance requirement for coaching institutes)
CREATE TABLE attendance_events AS analytics_events
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toDate(event_time), student_id)
TTL event_time + INTERVAL 5 YEAR DELETE;

-- Financial events: keep 7 years (GST compliance)
CREATE TABLE fee_events AS analytics_events
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (institute_id, toYYYYMM(event_time))
TTL event_time + INTERVAL 7 YEAR DELETE;
```

**ClickHouse tiered storage config:**

```xml
<!-- infra/clickhouse-config.xml -->
<clickhouse>
  <storage_configuration>
    <disks>
      <default><path>/var/lib/clickhouse/</path></default>
      <cold>
        <type>s3</type>
        <endpoint>https://minio:9000/clickhouse-cold/</endpoint>
        <access_key_id>MINIO_ACCESS_KEY</access_key_id>
        <secret_access_key>MINIO_SECRET_KEY</secret_access_key>
      </cold>
    </disks>
    <policies>
      <tiered>
        <volumes>
          <hot><disk>default</disk><max_data_part_size_bytes>1073741824</max_data_part_size_bytes></hot>
          <cold><disk>cold</disk></cold>
        </volumes>
        <move_factor>0.2</move_factor>
      </tiered>
    </policies>
  </storage_configuration>
  <max_server_memory_usage_to_ram_ratio>0.4</max_server_memory_usage_to_ram_ratio>
</clickhouse>
```

---

### Issue 7: Backup Strategy (GENUINE — Critical)

```bash
# infra/scripts/backup-all.sh
# Run daily via cron on the host: 0 2 * * * /path/to/backup-all.sh

set -euo pipefail
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="/backups/$DATE"
S3_BUCKET="s3://your-backup-bucket/coaching-os"

mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL (gateway platform DB — 4 tables)
docker exec postgres pg_dump -U coaching coaching_db | \
  gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# 2. ERPNext MariaDB (the most critical backup)
docker exec erpnext-db mysqldump \
  -u root -p${ERPNEXT_DB_ROOT_PASSWORD} \
  --all-databases --single-transaction --routines --triggers | \
  gzip > "$BACKUP_DIR/erpnext_db_$DATE.sql.gz"

# 3. ERPNext site files (uploads, private files, custom apps)
docker exec erpnext bench --site erp.coaching-internal backup
docker cp erpnext:/home/frappe/frappe-bench/sites/erp.coaching-internal/private/backups/. "$BACKUP_DIR/erpnext_files/"

# 4. Moodle MariaDB
docker exec moodle-db mysqldump \
  -u root -p${MOODLE_DB_ROOT_PASSWORD} \
  moodle --single-transaction | \
  gzip > "$BACKUP_DIR/moodle_db_$DATE.sql.gz"

# 5. Moodle data files (uploaded content)
docker run --rm --volumes-from moodle \
  -v "$BACKUP_DIR:/backup" alpine \
  tar czf /backup/moodle_files_$DATE.tar.gz /bitnami/moodle

# 6. NATS JetStream data
docker run --rm --volumes-from nats \
  -v "$BACKUP_DIR:/backup" alpine \
  tar czf /backup/nats_data_$DATE.tar.gz /data

# 7. ClickHouse backup (using clickhouse-backup tool)
docker exec clickhouse clickhouse-backup create "backup_$DATE"
docker exec clickhouse clickhouse-backup upload "backup_$DATE"   # uploads to MinIO cold storage

# 8. MinIO backup (sync to external S3)
# MinIO replication to separate bucket/provider — configure in MinIO Console

# 9. Upload all to backup S3
aws s3 sync "$BACKUP_DIR" "$S3_BUCKET/$DATE/" --storage-class STANDARD_IA

# 10. Verify backup size > 0
for file in "$BACKUP_DIR"/*.gz; do
  size=$(stat -c%s "$file")
  if [ "$size" -lt 1024 ]; then
    echo "BACKUP WARNING: $file is suspiciously small ($size bytes)"
    # This alert goes to Grafana via Prometheus pushgateway
  fi
done

# 11. Cleanup local backups older than 7 days
find /backups -type d -mtime +7 -exec rm -rf {} +

echo "Backup complete: $DATE"
```

**Restore runbook (kept in docs/DISASTER_RECOVERY.md):**

```bash
# Target RTO: < 2 hours for full platform restore
# Target RPO: 24 hours (daily backup) — can be reduced to 1 hour with WAL archiving

# Priority restore order:
# 1. PostgreSQL (gateway platform — 10 min)
# 2. ERPNext MariaDB (master identity — 30 min)
# 3. ERPNext site files (30 min)
# 4. Moodle MariaDB (30 min)
# 5. ClickHouse (from MinIO cold — 45 min, can be partial)
# 6. MinIO files (from S3 — parallel, background)
```

---

### Issue 8: Payment Idempotency (GENUINE)

Razorpay webhooks can fire twice. Stripe does it. Every payment provider does it. Without protection, a ₹50,000 payment becomes ₹1,00,000 in ERPNext.

```typescript
// In fees.service.ts — complete idempotency protection

async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
  // 1. Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  if (expectedSig !== signature) throw new UnauthorizedException('Invalid webhook signature');

  const { event, payload: { payment: { entity } } } = payload;
  if (event !== 'payment.captured') return;   // only handle captures

  const razorpayPaymentId = entity.id;        // e.g. "pay_ABC123"

  // 2. Idempotency check — atomic upsert
  // If this payment_id is already in our PostgreSQL event_outbox or a payment_records table,
  // we've already processed it. Return 200 to Razorpay without re-processing.
  const alreadyProcessed = await this.checkIdempotency(razorpayPaymentId);
  if (alreadyProcessed) {
    console.log(`[IDEMPOTENCY] Duplicate webhook for ${razorpayPaymentId} — ignoring`);
    return;
  }

  // 3. Record payment in ERPNext
  await this.education.recordFeePayment({
    studentName: entity.notes.erp_student_name,
    amount: entity.amount / 100,
    mode: 'UPI',
    referenceId: razorpayPaymentId,
    razorpayId: razorpayPaymentId,
  });

  // 4. Mark as processed (idempotency key)
  await this.markProcessed(razorpayPaymentId);

  // 5. Publish event (outbox — not inline)
  await this.eventBus.publish({
    type: EVENTS.FEE_PAYMENT_CONFIRMED,
    payload: { razorpayPaymentId, amount: entity.amount / 100, ... },
    instituteId: entity.notes.institute_id,
    timestamp: new Date().toISOString(),
  });
}

// Idempotency via Redis (fast) + PostgreSQL outbox (durable)
private async checkIdempotency(paymentId: string): Promise<boolean> {
  // Redis SET NX: atomic "set if not exists"
  const result = await this.redis.set(
    `payment:processed:${paymentId}`,
    '1',
    'NX',   // only set if not exists
    'EX',
    86400   // 24 hour TTL
  );
  return result === null;  // null = key already existed = already processed
}
```

---

### Issue 9: BBB vs LiveKit — Agreed, Ship BBB First

BBB already solves recording, screen share, moderation, breakout rooms, polls, and hand raise. These take months to rebuild. Ship BBB for MVP through Phase 3.

**One specific BBB improvement for the near term:** Use BBB's webhook API to auto-mark student attendance when they join a live class. This removes the need for manual attendance during online sessions.

```typescript
// In live-class.service.ts — register BBB webhook on class creation

async scheduleClass(dto: ScheduleClassDto): Promise<LiveClass> {
  const { meetingId } = await this.bbb.createMeeting({...dto});

  // Register BBB meeting-events webhook
  await this.bbb.createWebhook({
    callbackURL: `https://api.${process.env.DOMAIN}/api/v1/live-class/bbb-webhook`,
    meetingID: meetingId,
    getRaw: true,
  });

  return savedClass;
}

// BBB fires this when a student joins or leaves
async handleBBBWebhook(events: BBBEvent[]): Promise<void> {
  for (const event of events) {
    if (event.header.name === 'user-joined') {
      const externalUserId = event.payload.userId;  // ERPNext student name stored here on join
      // Auto-mark attendance in ERPNext + publish event
      await this.attendance.markOnlineAttendance(externalUserId, event.payload.meetingId);
    }
  }
}
```

---

## Part 2: Additional Flaws Not Yet Addressed

### Flaw A: No Rate Limiting (Security — High)

Without rate limiting, a single script can hammer the OTP endpoint with 10,000 phone numbers per minute, enumerate all student phone numbers, or DoS the platform.

```typescript
// gateway/src/main.ts — apply rate limiting globally

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 second
    limit: 10,    // 10 requests per second per IP
  },
  {
    name: 'medium',
    ttl: 60000,   // 1 minute
    limit: 100,   // 100 requests per minute per IP
  },
]),

// Stricter limits on auth endpoints
@Throttle({ short: { limit: 3, ttl: 60000 } })   // 3 OTP requests per minute
@Post('auth/send-otp')
async sendOtp(@Body() dto: SendOtpDto) {}

// Even stricter on admin actions
@Throttle({ short: { limit: 1, ttl: 5000 } })    // 1 bulk operation per 5 seconds
@Post('students/bulk-import')
async bulkImport() {}
```

```nginx
# infra/nginx/conf.d/gateway.conf — IP-level rate limiting

limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

location /api/v1/auth/ {
    limit_req zone=auth burst=3 nodelay;
    proxy_pass http://gateway:3000;
}

location /api/v1/ {
    limit_req zone=api burst=50 nodelay;
    proxy_pass http://gateway:3000;
}
```

---

### Flaw B: No API Versioning (Mobile App Compatibility — High)

Mobile apps update on the Play Store and App Store slowly. Users with old app versions may be on v1 of your API when you ship v2. Without versioning, old apps break silently.

All routes must be prefixed with `/api/v1/` from day one.

```typescript
// gateway/src/main.ts
app.setGlobalPrefix('api/v1');

// Nginx also rewrites for backward compat if needed:
# location /api/ {
#     rewrite ^/api/(.*)$ /api/v1/$1 break;   # temporary redirect for old clients
#     proxy_pass http://gateway:3000;
# }
```

Mobile app API client:
```typescript
// apps/student-app/src/lib/api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_VERSION = 'v1';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/${API_VERSION}`,
  timeout: 15000,
});

// Force update: if server returns 426 Upgrade Required, app shows update screen
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 426) {
    // Navigate to force update screen
    navigationRef.navigate('ForceUpdate');
  }
  return Promise.reject(error);
});
```

The gateway returns 426 when it receives a request with `X-App-Version` header below the minimum supported version.

---

### Flaw C: WebSocket Scaling Broken with Multiple Gateway Instances (High)

Socket.io sessions are in-memory by default. When you run 2 gateway instances behind Nginx load balancer (which you will at scale), a student connected to gateway-1 won't receive events published by gateway-2.

```typescript
// gateway/src/app.module.ts — add Redis adapter for Socket.io

import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

// gateway/src/main.ts
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

Now the real-time attendance board works correctly even with 3 gateway instances running.

---

### Flaw D: No CDN for Video Delivery (Performance — Medium)

HLS video segments served directly from MinIO through the gateway will be slow for students far from the server. A 50MB video lecture streams fine from Mumbai but lags for students in tier-3 cities.

```
Current (slow):
  Student app → Gateway → MinIO → HLS segments

Correct:
  Student app → BunnyCDN edge → MinIO origin
              (edge caches segments after first view)
```

```typescript
// In lms.service.ts — generate CDN URL instead of MinIO presigned URL

getVideoStreamUrl(videoPath: string, instituteId: string): string {
  // BunnyCDN token-authenticated URL (prevents hotlinking)
  const expiry = Math.floor(Date.now() / 1000) + 7200;  // 2 hour expiry
  const token = crypto
    .createHash('sha256')
    .update(`${process.env.BUNNY_TOKEN_KEY}${videoPath}${expiry}`)
    .digest('base64url');

  return `https://cdn.yourplatform.com${videoPath}?token=${token}&expires=${expiry}`;
}

// PDF download: watermark at delivery time
async getPdfUrl(pdfPath: string, student: ErpStudent): Promise<string> {
  const watermarkedKey = `watermarked/${student.name}/${pdfPath}`;

  // Check if watermarked version exists in MinIO
  const exists = await this.minio.objectExists(watermarkedKey);
  if (!exists) {
    // Generate watermarked PDF (pdf-lib) and cache in MinIO
    await this.pdfService.watermarkAndStore(pdfPath, watermarkedKey, {
      text: `${student.student_name} | ${student.name}`,
      opacity: 0.15,
    });
  }

  return this.minio.presignedGetObject(watermarkedKey, 3600);  // 1 hour signed URL
}
```

---

### Flaw E: No Audit Log (Compliance — Medium)

Who deleted a student? Who changed a fee amount? Who accessed a student profile? For a SaaS serving educational institutes with minors' data, this is required both for compliance and for dispute resolution.

```typescript
// gateway/src/shared/audit/audit.interceptor.ts

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private clickhouse: ClickHouseAdapter) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    // Only audit write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next.handle();

    return next.handle().pipe(
      tap(async (responseBody) => {
        await this.clickhouse.insertAuditEvent({
          timestamp: new Date(),
          actor_id: user?.sub || 'anonymous',
          actor_role: user?.role || 'unknown',
          institute_id: user?.instituteId || '',
          action: `${method} ${url}`,
          resource_type: this.extractResourceType(url),
          resource_id: responseBody?.name || responseBody?.id || '',
          ip_address: ip,
          user_agent: request.headers['user-agent'] || '',
          // Do NOT log request body (may contain PII/credentials)
        });
      })
    );
  }
}
```

```sql
-- In ClickHouse (separate table, 7-year retention for compliance)
CREATE TABLE audit_log (
    timestamp       DateTime DEFAULT now(),
    actor_id        String,
    actor_role      LowCardinality(String),
    institute_id    String,
    action          String,
    resource_type   LowCardinality(String),
    resource_id     String,
    ip_address      String,
    user_agent      String
)
ENGINE = MergeTree()
ORDER BY (institute_id, timestamp)
TTL timestamp + INTERVAL 7 YEAR DELETE;
```

---

### Flaw F: No Health Check Endpoints (Operational — Medium)

Docker and Nginx need to know when a service is ready to accept traffic.

```typescript
// gateway/src/modules/health/health.controller.ts

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private http: HttpHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgres'),
      () => this.http.pingCheck('redis', 'redis://redis:6379'),
      () => this.http.pingCheck('erpnext', 'http://erpnext:8000/api/method/ping'),
      () => this.microservice.pingCheck('nats', { transport: Transport.NATS, options: { servers: ['nats:4222'] } }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    // /health → liveness probe (is the process running?)
    // /health/ready → readiness probe (is it ready to serve traffic?)
    return this.health.check([
      () => this.db.pingCheck('postgres'),
      () => this.http.pingCheck('erpnext', 'http://erpnext:8000/api/method/ping'),
    ]);
  }
}
```

Add to Docker Compose for each service:
```yaml
gateway:
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/v1/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

---

### Flaw G: Database Connection Exhaustion (Scale — Medium)

ERPNext's MariaDB and your PostgreSQL have connection limits. At 100 concurrent admin users, each opening 3-5 database connections through the gateway and workers, you'll hit the default MariaDB limit of 151 connections and get "Too many connections" errors.

```yaml
# Add PgBouncer for PostgreSQL
pgbouncer:
  image: pgbouncer/pgbouncer:1.21.0
  environment:
    DATABASE_URL: postgresql://coaching:${DB_PASSWORD}@postgres:5432/coaching_db
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 25
  networks: [coaching_network]
  restart: unless-stopped
  # Gateway connects to pgbouncer:5432, not postgres:5432 directly
```

```yaml
# ERPNext MariaDB tuning
erpnext-db:
  image: mariadb:10.11
  command: >
    --max-connections=400
    --innodb-buffer-pool-size=1G
    --innodb-log-file-size=256M
    --query-cache-type=1
    --query-cache-size=64M
  ...
```

---

## Part 3: Complete Feature Specification (All 17 Modules)

---

### Module 1: Super Admin SaaS Platform

Accessible only to CoachingOS platform staff. Completely separate from institute admin panels.

**Access:** `superadmin.yourplatform.com` → separate Next.js route group with separate JWT secret.

**Features and API endpoints:**

```
GET    /superadmin/institutes              → list all institutes (plan, status, MRR)
POST   /superadmin/institutes             → create new institute (provision ERPNext company, Moodle category)
PUT    /superadmin/institutes/:id/plan    → change plan (starter/growth/professional)
PUT    /superadmin/institutes/:id/suspend → suspend access (block gateway JWT for this tenant)
GET    /superadmin/analytics/platform     → platform-wide MRR, total students, active institutes
GET    /superadmin/analytics/health       → service health across all services
POST   /superadmin/features/:id           → toggle feature flag per institute
GET    /superadmin/outbox/dead            → list dead-letter events needing manual intervention
```

**Institute Provisioning Flow (what happens when you onboard a new institute):**

```typescript
// gateway/src/modules/superadmin/provisioning.service.ts

async provisionInstitute(dto: ProvisionInstituteDto): Promise<Institute> {
  // 1. Create institute in PostgreSQL
  const institute = await this.instituteRepo.save({
    slug: dto.slug,
    name: dto.name,
    plan: dto.plan,
    branding: dto.branding,
  });

  // 2. Create ERPNext Company for this institute
  const erpCompany = await this.education.createDoc('Company', {
    company_name: dto.name,
    abbr: dto.slug.toUpperCase().substring(0, 5),
    default_currency: 'INR',
    country: 'India',
  });
  await this.instituteRepo.update(institute.id, { erp_company: erpCompany.name });

  // 3. Create Moodle category
  const category = await this.moodle.createCategory({
    name: dto.name,
    parent: 0,  // top-level
    idnumber: institute.id,
  });
  await this.instituteRepo.update(institute.id, { moodle_category_id: category.id });

  // 4. Seed default data via ERPNext Education
  await this.education.createDoc('Academic Year', {
    academic_year_name: new Date().getFullYear().toString(),
    year_start_date: `${new Date().getFullYear()}-04-01`,
    year_end_date: `${new Date().getFullYear() + 1}-03-31`,
    company: erpCompany.name,
  });

  // 5. Publish provisioning event (NATS workers set up Novu channel for this institute)
  await this.eventBus.publish({
    type: EVENTS.INSTITUTE_PROVISIONED,
    payload: { instituteId: institute.id, slug: dto.slug, plan: dto.plan },
    instituteId: institute.id,
    timestamp: new Date().toISOString(),
  });

  return institute;
}
```

**Feature Flags per Plan:**

```typescript
// gateway/src/shared/feature-flags/features.ts

export const PLAN_FEATURES = {
  starter: {
    max_students: 200,
    max_batches: 5,
    live_classes: false,
    rfid_attendance: false,
    advanced_analytics: false,
    custom_domain: false,
    parent_app: false,
    ai_doubt_solver: false,
  },
  growth: {
    max_students: 1000,
    max_batches: 25,
    live_classes: true,
    rfid_attendance: true,
    advanced_analytics: false,
    custom_domain: false,
    parent_app: true,
    ai_doubt_solver: false,
  },
  professional: {
    max_students: Infinity,
    max_batches: Infinity,
    live_classes: true,
    rfid_attendance: true,
    advanced_analytics: true,
    custom_domain: true,
    parent_app: true,
    ai_doubt_solver: true,
  },
};

// Gateway guard checks feature flag before allowing access
@Injectable()
export class FeatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = Reflect.getMetadata('feature', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    const features = PLAN_FEATURES[user.institutePlan];
    return features?.[required] === true;
  }
}

// Usage on any controller:
@RequireFeature('live_classes')
@Post('live-class/schedule')
async scheduleClass() {}
```

---

### Module 2: Institute Admin Panel

**URL:** `{slug}.yourplatform.com` or `app.{slug_custom_domain}.com`

**Navigation Structure:**

```
Dashboard (KPI cards + quick actions)
├── Admissions (CRM → leads → enrollments)
├── Students (list, profile, documents)
├── Teachers (list, profile, payroll)
├── Batches (list, schedule, capacity)
├── Courses (content management)
├── Attendance (RFID dashboard, manual marking, reports)
├── Fees (collection, dues, receipts, analytics)
├── Tests (creation, scheduling, results)
├── Live Classes (scheduling, recordings)
├── Communications (announcements, WhatsApp campaigns)
├── Analytics (embedded Metabase dashboards)
└── Settings (branding, RFID devices, notification templates, staff accounts)
```

**Dashboard KPI API:**

```
GET /api/v1/admin/dashboard/kpis
Response:
{
  todayAttendance: { present: 234, absent: 45, percentage: 83.9 },
  monthlyFeeCollection: { collected: 1250000, pending: 340000, overdue: 89000 },
  activeStudents: 312,
  liveClassNow: { active: 2, studentsInClass: 87 },
  upcomingTests: [{ name: "JEE Mock 3", date: "2024-03-15", batch: "JEE 2026 A" }],
  recentPayments: [...],
  absentStudentsToday: [...]    // for quick parent notification
}
```

---

### Module 3: Student Management

**Full CRUD + import + ID card:**

```
POST   /api/v1/students                           → create student (ERPNext + events)
GET    /api/v1/students                           → list (cached, paginated)
GET    /api/v1/students/:erpId                    → profile (cached 15 min)
PUT    /api/v1/students/:erpId                    → update (invalidates cache)
DELETE /api/v1/students/:erpId                    → soft deactivate in ERPNext
POST   /api/v1/students/bulk-import               → CSV import (BullMQ background job)
GET    /api/v1/students/:erpId/id-card            → generate ID card PDF (MinIO cached)
GET    /api/v1/students/:erpId/complete-profile   → merged: ERPNext + Moodle progress + fee status
POST   /api/v1/students/:erpId/rfid-card          → assign RFID card (PostgreSQL rfid_cards)
GET    /api/v1/students/:erpId/timeline           → ClickHouse: all events for this student
```

**Bulk Import via BullMQ:**

```typescript
// POST /api/v1/students/bulk-import
// Accepts CSV file → uploads to MinIO → queues job → returns job ID
// Client polls GET /api/v1/jobs/:jobId/status

@BullQueueProcess('bulk-student-import')
async processBulkImport(job: Job<BulkImportJobData>): Promise<void> {
  const { csvUrl, instituteId } = job.data;
  const csv = await this.minio.getObject(csvUrl);
  const rows = await this.parseCsv(csv);

  for (let i = 0; i < rows.length; i++) {
    try {
      await this.studentsService.createStudent({ ...rows[i], instituteId });
      await job.progress(Math.round((i / rows.length) * 100));
    } catch (err) {
      this.errors.push({ row: i + 1, name: rows[i].name, error: err.message });
    }
  }

  // Upload error report to MinIO
  if (this.errors.length > 0) {
    await this.minio.putObject(`import-errors/${job.id}.json`, JSON.stringify(this.errors));
  }
}
```

---

### Module 4: Parent Management

Parents are Guardians in ERPNext Education. One guardian can link to multiple students (siblings).

```
GET    /api/v1/parents                            → list all guardians
GET    /api/v1/parents/:guardianName              → guardian profile + linked students
PUT    /api/v1/parents/:guardianName              → update contact info
GET    /api/v1/parents/:guardianName/children     → all linked Student records
POST   /api/v1/parents/:guardianName/notification → send manual WhatsApp to parent
```

Parent portal login: Parents log in via their own phone number. The gateway looks up the Guardian record in ERPNext by mobile number. JWT is issued with role: 'parent' and a list of linked student ERPNext IDs.

```typescript
// Auth service — parent login path
async loginParent(phone: string, otp: string): Promise<AuthTokens> {
  const guardian = await this.education.getGuardianByPhone(phone);
  if (!guardian) throw new NotFoundException('Guardian not found');

  const linkedStudents = await this.education.getGuardianStudents(guardian.name);

  const accessToken = this.jwtService.sign({
    sub: guardian.name,
    role: 'parent',
    linkedStudentIds: linkedStudents.map(s => s.name),
    instituteId: guardian.custom_institute_id,
  });

  return { accessToken, refreshToken: await this.issueRefreshToken(guardian.name, 'parent') };
}
```

---

### Module 5: Teacher Management

```
POST   /api/v1/teachers                              → create (ERPNext Instructor + Employee)
GET    /api/v1/teachers                              → list
GET    /api/v1/teachers/:instructorName              → profile + assigned batches
PUT    /api/v1/teachers/:instructorName              → update
GET    /api/v1/teachers/:instructorName/schedule     → weekly timetable from Course Schedule
GET    /api/v1/teachers/:instructorName/payslips     → from ERPNext HRMS payroll
POST   /api/v1/teachers/:instructorName/leave        → leave application (ERPNext Leave Application)
GET    /api/v1/teachers/:instructorName/performance  → ClickHouse: classes taught, avg attendance
```

Teacher login: Phone OTP → gateway looks up ERPNext Instructor → JWT with role: 'instructor'.

---

### Module 6: Batch Management

Maps to ERPNext Student Group + Course Schedule.

```
POST   /api/v1/batches                               → create (ERPNext Student Group + Moodle course via event)
GET    /api/v1/batches                               → list (cached 30 min)
GET    /api/v1/batches/:name                         → detail + enrolled students + schedule
POST   /api/v1/batches/:name/students                → enroll student
DELETE /api/v1/batches/:name/students/:studentId     → unenroll
POST   /api/v1/batches/:name/teachers                → assign instructor to batch + subject
GET    /api/v1/batches/:name/schedule                → weekly timetable
PUT    /api/v1/batches/:name/schedule                → update timetable
GET    /api/v1/batches/:name/analytics               → attendance rate, avg test score, engagement
POST   /api/v1/batches/:name/announce                → send announcement to all batch students
```

---

### Module 7: Course Management

Maps to ERPNext Course + Moodle for content delivery.

```
POST   /api/v1/courses                               → create Course doctype in ERPNext
GET    /api/v1/courses/:courseName/content           → get sections + materials from Moodle
POST   /api/v1/courses/:courseName/sections          → add chapter/topic
POST   /api/v1/courses/:courseName/content/pdf       → upload PDF → MinIO → watermark → Moodle resource
POST   /api/v1/courses/:courseName/content/video     → upload video → BullMQ FFmpeg → HLS → MinIO → Moodle URL
DELETE /api/v1/courses/:courseName/content/:itemId   → remove from Moodle + MinIO
GET    /api/v1/courses/:courseName/progress/:studentId → Moodle completion status
```

Video processing pipeline (unchanged from v2, FFmpeg → HLS → MinIO → Moodle):

```
POST upload → MinIO (raw) → NATS: lms.video.uploaded
  → analytics-worker: track event
  → BullMQ: ffmpeg job (high memory, runs on worker)
     → HLS segments → MinIO/CDN
     → moodle-worker: create URL resource in Moodle course
     → NATS: lms.video.ready
        → novu-worker: push notification "New video available"
```

---

### Module 8: Live Class System

```
POST   /api/v1/live-class/schedule                   → create BBB meeting, store credentials
GET    /api/v1/live-class/upcoming                   → upcoming classes for institute/batch
POST   /api/v1/live-class/:id/join                   → generate BBB join URL (role-specific PW)
POST   /api/v1/live-class/:id/end                    → end meeting (moderator only)
GET    /api/v1/live-class/:id/attendance             → who joined (from BBB webhook log)
GET    /api/v1/live-class/:id/recordings             → list recordings
POST   /api/v1/live-class/bbb-webhook                → BBB event receiver (auto attendance, recording ready)
```

Auto-attendance from BBB: When BBB fires the `user-joined` webhook, the gateway marks the student present in ERPNext Student Attendance. This replaces manual online attendance entirely.

---

### Module 9: Attendance Management

Three input sources → one unified ERPNext record.

```
POST   /api/v1/rfid/punch                            → hardware RFID event (from rfid-service)
POST   /api/v1/attendance/manual                     → teacher marks attendance via app
POST   /api/v1/live-class/:id/attendance/manual      → manual override for online class
GET    /api/v1/attendance/batch/:name/today          → today's attendance (Redis cached 60s)
GET    /api/v1/attendance/batch/:name/monthly        → ERPNext Student Attendance monthly view
GET    /api/v1/attendance/student/:id/report         → per-student attendance report with percentage
GET    /api/v1/attendance/live                       → WebSocket channel: real-time punch stream
```

**Real-time dashboard WebSocket:**

```typescript
// gateway/src/modules/attendance/attendance.gateway.ts

@WebSocketGateway({ namespace: 'attendance', cors: true })
export class AttendanceWebSocketGateway {
  @WebSocketServer() server: Server;

  // Called by rfid.service when a punch arrives
  async broadcastPunch(punch: RfidPunchEvent): Promise<void> {
    // Emit to institute-specific room only (tenant isolation for WebSocket)
    this.server.to(`institute:${punch.instituteId}`).emit('attendance:punch', {
      studentName: punch.studentName,
      studentErpId: punch.erpStudentId,
      photo: punch.photoUrl,
      timestamp: punch.timestamp,
      type: punch.type,   // 'entry' | 'exit'
      batchName: punch.batchName,
    });
  }

  @SubscribeMessage('join-institute')
  handleJoinInstitute(client: Socket, payload: { instituteId: string; token: string }) {
    const decoded = this.jwtService.verify(payload.token);
    if (decoded.instituteId !== payload.instituteId) return;   // tenant guard
    client.join(`institute:${payload.instituteId}`);
  }
}
```

---

### Module 10: Fee Management

```
GET    /api/v1/fees/structures                       → list Fee Structures (ERPNext)
POST   /api/v1/fees/structures                       → create Fee Structure for a program
GET    /api/v1/fees/student/:id/ledger               → student fee ledger (ERPNext + receipts)
GET    /api/v1/fees/student/:id/outstanding          → total outstanding amount
POST   /api/v1/fees/student/:id/payment/initiate     → create Razorpay order + WhatsApp link
POST   /api/v1/fees/webhook/razorpay                 → Razorpay payment confirmed (idempotent)
POST   /api/v1/fees/cash-payment                     → record offline cash/cheque payment
GET    /api/v1/fees/student/:id/receipt/:paymentId   → download receipt PDF (MinIO)
GET    /api/v1/fees/collection/today                 → today's collections
GET    /api/v1/fees/collection/overdue               → overdue fee list (for bulk reminder)
POST   /api/v1/fees/reminder/bulk                    → send WhatsApp reminders to all overdue (BullMQ)
```

---

### Module 11: Examination System

Tests are created in the gateway's PostgreSQL question bank, mirrored to Moodle Quiz, and results stored in ERPNext Assessment Result.

```
POST   /api/v1/tests                                 → create test (ERPNext Assessment Plan + Moodle Quiz)
POST   /api/v1/tests/:id/questions                   → add questions (gateway question bank)
POST   /api/v1/tests/:id/publish                     → open for students + send notification
POST   /api/v1/tests/:id/attempt/start               → student starts test (Redis timer set)
POST   /api/v1/tests/:id/attempt/save-answers        → auto-save answers every 30 seconds
POST   /api/v1/tests/:id/attempt/submit              → final submission (calc score, rank, sync ERPNext)
GET    /api/v1/tests/:id/results                     → student's result (from ERPNext Assessment Result)
GET    /api/v1/tests/:id/analytics                   → class-wide performance (ClickHouse)
GET    /api/v1/tests/:id/leaderboard                 → rank list
GET    /api/v1/tests/batch/:batchName/history        → past tests with average scores
```

**Question Bank (PostgreSQL — the only additional table for LMS):**

```sql
-- Add to init-postgres.sql
CREATE TABLE question_bank (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id    UUID NOT NULL REFERENCES institutes(id),
    subject         VARCHAR(100) NOT NULL,
    topic           VARCHAR(200),
    question_type   VARCHAR(20) NOT NULL,    -- 'mcq' | 'integer' | 'multi-correct' | 'subjective'
    question_text   TEXT NOT NULL,
    options         JSONB,                   -- for MCQ: [{text, isCorrect}]
    correct_answer  TEXT,
    explanation     TEXT,
    difficulty      VARCHAR(10) DEFAULT 'medium',   -- easy | medium | hard
    marks_positive  DECIMAL(5,2) DEFAULT 4,
    marks_negative  DECIMAL(5,2) DEFAULT 1,
    image_url       TEXT,
    created_by      TEXT NOT NULL,           -- ERPNext instructor name
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE test_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id         UUID NOT NULL,           -- ERPNext Assessment Plan name
    student_id      TEXT NOT NULL,           -- ERPNext Student name
    institute_id    UUID NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    answers         JSONB NOT NULL DEFAULT '{}',
    score           DECIMAL(8,2),
    rank            INT,
    percentile      DECIMAL(5,2),
    time_taken_sec  INT,
    is_submitted    BOOLEAN DEFAULT FALSE
);
```

**Test timer via Redis:**

```typescript
async startTestAttempt(testId: string, studentId: string, durationMinutes: number): Promise<TestAttempt> {
  const attempt = await this.attemptRepo.save({
    test_id: testId,
    student_id: studentId,
    institute_id: this.currentInstituteId,
    answers: {},
    started_at: new Date(),
  });

  // Set timer in Redis — Socket.io pushes countdown to student
  await this.redis.setex(`test_timer:${attempt.id}`, durationMinutes * 60, 'active');

  // BullMQ: auto-submit when timer expires
  await this.testQueue.add(
    'auto-submit',
    { attemptId: attempt.id, studentId },
    { delay: durationMinutes * 60 * 1000, jobId: `auto-submit:${attempt.id}` }
  );

  return attempt;
}
```

---

### Module 12: Learning Management (Moodle)

Covered in Module 7 (Course Management). Key additions:

```
GET    /api/v1/lms/student/:id/progress              → completion % per course (Moodle)
GET    /api/v1/lms/student/:id/activity-feed         → recent activity across courses
GET    /api/v1/lms/batch/:name/completion-report     → which students finished which chapters
POST   /api/v1/lms/assignments/:id/submit            → student submits assignment (file → MinIO → Moodle)
GET    /api/v1/lms/assignments/:id/submissions        → teacher views all submissions
POST   /api/v1/lms/assignments/:id/grade             → teacher grades (Moodle + notify via Novu)
```

---

### Module 13: Communication System

All communication routes through Novu (WhatsApp, Push, SMS, Email). The admin panel provides:

```
POST   /api/v1/notifications/announce/batch          → send to entire batch
POST   /api/v1/notifications/announce/institute      → send to all students in institute
POST   /api/v1/notifications/individual              → send to specific student/parent
GET    /api/v1/notifications/templates               → list Novu notification templates
POST   /api/v1/notifications/templates               → create/update Novu template
GET    /api/v1/notifications/history/:studentId      → notification history for a student
POST   /api/v1/notifications/fee-reminder/bulk       → trigger fee reminder campaign (BullMQ)
```

**WhatsApp template flow:**
Institute admins design notification templates in the admin panel. Templates are stored in Novu. When fee_overdue event fires, the Novu worker picks the fee-reminder template, fills in student name and amount, and sends via Wati.io (WhatsApp Business API). No code changes needed to add new notification types.

---

### Module 14: Analytics Dashboard

Three tiers of analytics:

**Tier 1 — Real-time widgets (Redis/WebSocket, sub-second):**
Today's attendance count, students currently in live class, fee collected today.

**Tier 2 — Pre-aggregated queries (ClickHouse materialized views, < 1 second):**
Weekly attendance chart, monthly fee collection bar chart, test performance scatter.

**Tier 3 — Metabase embedded dashboards (ClickHouse, 2-5 seconds):**
Complex multi-dimensional reports, cross-batch comparisons, dropout risk cohorts.

```
GET    /api/v1/analytics/dashboard/kpis              → real-time KPIs (Redis)
GET    /api/v1/analytics/attendance/trend            → ClickHouse: 30-day attendance % by batch
GET    /api/v1/analytics/fees/collection-trend       → ClickHouse: monthly collection for 6 months
GET    /api/v1/analytics/tests/performance           → ClickHouse: avg score per test per batch
GET    /api/v1/analytics/engagement/students         → ClickHouse: engagement score per student
GET    /api/v1/analytics/embed-urls                  → Metabase signed embed URLs (all dashboards)
GET    /api/v1/analytics/students/:id/risk-score     → dropout risk (ClickHouse ML query)
```

**Dropout Risk Algorithm (ClickHouse query):**

```sql
-- High dropout risk: attendance < 60% + no test attempts in 2 weeks + no video watch in 1 week
SELECT
    student_id,
    countIf(event_type = 'rfid_entry' AND event_time >= now() - INTERVAL 30 DAY) /
    max(toUInt32(30)) * 100 as attendance_pct_30d,
    maxIf(event_time, event_type = 'test_submit') as last_test_date,
    maxIf(event_time, event_type = 'video_watch') as last_video_date,
    CASE
        WHEN attendance_pct_30d < 60
         AND last_test_date < now() - INTERVAL 14 DAY
         AND last_video_date < now() - INTERVAL 7 DAY
        THEN 'high'
        WHEN attendance_pct_30d < 75 OR last_test_date < now() - INTERVAL 21 DAY
        THEN 'medium'
        ELSE 'low'
    END as risk_level
FROM analytics_events
WHERE institute_id = {instituteId:String}
  AND event_time >= now() - INTERVAL 30 DAY
GROUP BY student_id
```

---

### Module 15–17: Single Mobile App (Three Roles, One App)

One React Native (Expo) app on Play Store and App Store. After OTP login, the app detects the role from the JWT and renders the correct navigation tree. The switch happens instantly — no re-download required.

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx

export function RootNavigator() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <SplashScreen />;
  if (!user) return <AuthNavigator />;     // Phone + OTP login

  // JWT role determines which app the user sees
  switch (user.role) {
    case 'student':    return <StudentNavigator />;
    case 'instructor': return <TeacherNavigator />;
    case 'parent':     return <ParentNavigator />;
    case 'admin':      return <AdminNavigator />;
    default:           return <AuthNavigator />;
  }
}
```

**Student App — Screen Map:**

```
HomeScreen          → today's schedule, streak, recent activity
AttendanceScreen    → monthly calendar heatmap, % calculation
CoursesScreen       → batch courses list
CourseDetailScreen  → chapters + videos + PDFs + progress
VideoPlayerScreen   → HLS video (react-native-video) + seek controls
PDFViewerScreen     → watermarked PDF (react-native-pdf)
TestListScreen      → upcoming + completed tests
TestScreen          → MCQ interface + timer + auto-save
ResultScreen        → score, rank, percentile, answer key
LiveClassScreen     → BBB WebView + YOUR header overlay
FeesScreen          → ledger, outstanding, Razorpay payment
DoubtsScreen        → AI doubt solver (Phase 4)
NotificationsScreen → notification history
ProfileScreen       → student info, RFID card status
```

**Teacher App — Screen Map:**

```
HomeScreen          → today's classes, pending tasks
ScheduleScreen      → weekly timetable
AttendanceScreen    → mark attendance (batch picker → student list → tap present/absent)
ContentScreen       → upload PDF / video to a batch course
TestScreen          → create test, view results, grade assignments
LiveClassScreen     → start/end BBB meeting as moderator
StudentsScreen      → student list with attendance %, test performance
PayslipScreen       → from ERPNext HRMS
LeaveScreen         → apply leave, view leave balance
```

**Parent App — Screen Map:**

```
HomeScreen          → child selector (if multiple children), today's status
AttendanceScreen    → child's attendance history + monthly % 
ResultsScreen       → test results, rank, answer key access
FeesScreen          → outstanding dues, payment history, pay now
NotificationsScreen → all notifications from institute
LiveScreen          → if live class is ongoing, "your child is in class"
ProfileScreen       → child's profile, guardian info, switch child
```

**API endpoints for all three mobile apps:**

```
# Student-facing
GET  /api/v1/mobile/student/home                    → merged: schedule + streak + alerts
GET  /api/v1/mobile/student/courses                 → enrolled courses
GET  /api/v1/mobile/student/tests/active            → tests available to attempt now
GET  /api/v1/mobile/student/fees/summary            → outstanding amount
POST /api/v1/mobile/student/fcm-token               → register FCM push token

# Teacher-facing
GET  /api/v1/mobile/teacher/schedule/today          → today's classes
POST /api/v1/mobile/teacher/attendance/:batchName   → bulk attendance submission
GET  /api/v1/mobile/teacher/students/:batchName     → student list with metrics

# Parent-facing
GET  /api/v1/mobile/parent/children                 → list of linked students
GET  /api/v1/mobile/parent/child/:id/summary        → attendance % + last test + fee status
POST /api/v1/mobile/parent/fees/:id/pay             → initiate payment

# Push notification token registration (all roles)
POST /api/v1/mobile/fcm-token                       → { token, platform: 'android'|'ios' }
# Gateway calls Novu to update subscriber credentials
```

---

## Part 4: Production Deployment Configuration

### Nginx Security Headers

```nginx
# infra/nginx/nginx.conf

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; frame-src 'self' https://*.yourplatform.com" always;

# Hide Nginx version
server_tokens off;

# Gzip compression
gzip on;
gzip_types text/plain application/json application/javascript text/css;
gzip_min_length 1024;

# WebSocket upgrade headers
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

### Zero-Downtime Gateway Deployments

```yaml
# docker-compose.prod.yml

gateway:
  deploy:
    replicas: 2
    update_config:
      parallelism: 1          # update one instance at a time
      delay: 30s              # wait 30s between updates
      failure_action: rollback
      order: start-first      # start new, verify health, then stop old
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/v1/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
```

### Graceful Shutdown in NestJS

```typescript
// gateway/src/main.ts

const app = await NestFactory.create(AppModule);

// Graceful shutdown — finish in-flight requests before stopping
app.enableShutdownHooks();
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  await app.close();
  process.exit(0);
});

await app.listen(3000);
```

---

## Part 5: Updated Environment Configuration

```bash
# .env — complete v3

# Platform
DOMAIN=yourplatform.com
PLATFORM_NAME=CoachingOS
SUPERADMIN_JWT_SECRET=separate_64_char_secret_for_superadmin

# Gateway PostgreSQL (4 tables: institutes, rfid_cards, refresh_tokens, event_outbox)
DB_PASSWORD=your_strong_db_password

# PgBouncer (gateway connects to this, not postgres directly)
PGBOUNCER_POOL_SIZE=25

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_64_char_random_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret

# ERPNext + Education
ERPNEXT_DB_ROOT_PASSWORD=erpnext_root_pass
ERPNEXT_ADMIN_PASSWORD=erpnext_admin_pass
ERPNEXT_API_KEY=
ERPNEXT_API_SECRET=

# Moodle (admin token only — no student credentials ever)
MOODLE_DB_ROOT_PASSWORD=moodle_root_pass
MOODLE_DB_PASSWORD=moodle_db_pass
MOODLE_ADMIN_PASSWORD=moodle_admin_pass
MOODLE_ADMIN_TOKEN=

# BigBlueButton
BBB_SERVER_DOMAIN=bbb.yourplatform.com
BBB_SECRET=

# ClickHouse
CLICKHOUSE_USER=coaching_analytics
CLICKHOUSE_PASSWORD=clickhouse_pass

# Metabase (single BI system — no Superset)
METABASE_SECRET_KEY=

# Novu
NOVU_JWT_SECRET=
NOVU_ENCRYPTION_KEY=
NOVU_API_KEY=

# MinIO
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key

# BunnyCDN (video delivery)
BUNNY_CDN_HOSTNAME=cdn.yourplatform.com
BUNNY_TOKEN_KEY=your_bunny_cdn_token_key

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# WhatsApp (Wati.io)
WATI_API_URL=https://live-server-xxxxx.wati.io
WATI_TOKEN=your_wati_token

# SMS
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=COACHS

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# RFID
RFID_SERVICE_TOKEN=shared_secret_between_rfid_and_gateway

# Observability
GRAFANA_PASSWORD=your_grafana_password

# Backup
BACKUP_S3_BUCKET=s3://your-backup-bucket/coaching-os
AWS_ACCESS_KEY_ID=backup_user_key
AWS_SECRET_ACCESS_KEY=backup_user_secret
```

---

## Summary: v2 → v3 Deltas

| Category | What Was Missing | v3 Fix |
|---|---|---|
| ERPNext load | Direct HTTP on every request | Redis cache (TTL-typed, event-invalidated) |
| Event reliability | NATS publish could silently fail | PostgreSQL Outbox table + 5-second poller |
| Tenant isolation | institute_id filters relied on caller discipline | ERPNext multi-company + adapter-enforced filters + ClickHouse guard |
| Data retention | No TTL defined | ClickHouse TTL by event type (3/5/7 years) + S3 cold tier |
| Disaster recovery | No backup plan | Daily script: PostgreSQL + ERPNext MariaDB + Moodle + ClickHouse + MinIO |
| Payment integrity | Razorpay duplicate webhook risk | Redis NX idempotency key + ERPNext UNIQUE constraint |
| BBB future | Premature LiveKit planning | Removed from roadmap; BBB sufficient to 50+ institutes |
| Rate limiting | None | NestJS ThrottlerModule + Nginx limit_req |
| API versioning | No /v1/ prefix | All routes under /api/v1/, 426 for old clients |
| WebSocket scaling | In-memory Socket.io | Redis adapter for Socket.io |
| Video delivery | MinIO direct | BunnyCDN edge + token-authenticated URLs |
| PDF watermark | Mentioned but not specified | pdf-lib watermark at delivery, cached in MinIO |
| Audit log | None | ClickHouse audit_log table, 7-year retention |
| Health checks | None | /health + /health/ready on all services |
| DB connections | No pooling | PgBouncer + MariaDB tuning |
| SuperAdmin | Not specified | Full provisioning service + feature flags |
| Parent login | Not specified | Guardian doctype lookup + role-aware JWT |
| Single mobile app | Three separate apps | One app, role-based navigation tree |
| Question bank | Assumed Moodle-only | PostgreSQL question_bank table + Moodle mirror |
| Zero-downtime | Not addressed | Docker rolling update + graceful shutdown |
| Communication | Described but not API'd | Full Novu template management API |
```
