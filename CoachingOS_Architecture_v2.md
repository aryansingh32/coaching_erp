# CoachingOS — Revised Architecture v2.0
## 8 Critical Flaws Analyzed and Fixed

> This document supersedes the v1 plan. Every section that changes is marked `[REVISED]`. Sections unchanged from v1 are kept with `[UNCHANGED]` for reference.

---

## Verdict: All 8 Issues Are Genuine

| # | Issue | Severity | Verdict |
|---|-------|----------|---------|
| 1 | Central PostgreSQL as identity source of truth | Critical | GENUINE — creates 3-way identity sync problem |
| 2 | Moodle password stored in central DB | High | GENUINE — security anti-pattern, unnecessary |
| 3 | Running both Metabase and Superset | Medium | GENUINE — double maintenance with no payoff |
| 4 | NestJS Gateway becoming a monolith | High | GENUINE — requires architectural guardrails now |
| 5 | BBB branding assumption via CSS | Medium | GENUINE — fragile; complete white-label is impossible without deeper work |
| 6 | No event bus, synchronous service chain | Critical | GENUINE — single failure cascades to entire request |
| 7 | No observability stack | High | GENUINE — debugging in production will be impossible |
| 8 | Education module ignored | High | GENUINE — ERPNext+Education already solves your domain model |

---

## Part 1: Issue Analysis and Solutions

### Issue 1 [CRITICAL]: Central PostgreSQL as Identity Source of Truth

**Why it matters:** The v1 plan stores students in three separate systems: a custom PostgreSQL `students` table, ERPNext's `Student` doctype, and Moodle's `mdl_user` table. Every student mutation now requires three writes to stay consistent. When any one write fails, you have ghost records, sync bugs, and hours of manual reconciliation.

**Root cause:** The plan treated ERPNext as a dumb ledger when it actually ships a complete coaching domain model via the Education module.

**The fix:** ERPNext + Education becomes the single master record for all people data. The gateway's PostgreSQL drops to a thin platform layer.

**What ERPNext+Education already provides out of the box:**
- `Student` — primary student record with all personal details
- `Guardian` — parent/guardian linked to Student
- `Instructor` — teacher record
- `Program` — course type (e.g., "JEE Mains 2026")
- `Student Group` — a batch of students in a Program
- `Course` — individual subject
- `Student Admission` — enrollment workflow
- `Program Enrollment` — active enrollment record
- `Course Schedule` — timetable per batch
- `Student Attendance` — per-student daily attendance
- `Assessment Plan` / `Assessment Result` — test scheduling and results
- `Fee Structure` / `Fee Schedule` — billing templates and student invoices

**Revised identity ownership:**

```
ERPNext + Education   →   Master: Student, Guardian, Instructor, Batch, Course, Fees, Admissions
Moodle                →   LMS only: one User per Student, auto-created, never exposed
PostgreSQL (gateway)  →   Platform only: Institute/Tenant config, RFID card mapping, JWT refresh tokens
ClickHouse            →   Events only: all analytics events, no master data
Novu                  →   Notification routing only: subscriber mirrors ERPNext Student IDs
```

**What gets deleted from the v1 plan's PostgreSQL schema:**
- `students` table → gone, lives in ERPNext Student doctype
- `teachers` table → gone, lives in ERPNext Instructor + Employee
- `batches` table → gone, lives in ERPNext Student Group
- `student_batch` join → gone, lives in ERPNext Program Enrollment
- `fees` records → gone, lives in ERPNext Fee Schedule + Payment Entry

**What stays in PostgreSQL:**
```sql
-- The gateway's entire PostgreSQL schema becomes 3 tables

CREATE TABLE institutes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,   -- 'raju-coaching'
    name        TEXT NOT NULL,
    plan        VARCHAR(50) DEFAULT 'starter',
    branding    JSONB DEFAULT '{}',
    erp_company TEXT,                           -- ERPNext company name for this tenant
    moodle_category_id INT,                     -- Moodle category for this tenant
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfid_cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_uid        VARCHAR(100) UNIQUE NOT NULL,
    erp_student_id  TEXT NOT NULL,              -- ERPNext Student.name (e.g. "EDU-STU-2024-00001")
    institute_id    UUID REFERENCES institutes(id),
    is_active       BOOLEAN DEFAULT TRUE,
    assigned_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jwt_refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  TEXT NOT NULL,                  -- ERPNext Student/Instructor name
    role        VARCHAR(50) NOT NULL,            -- 'student' | 'instructor' | 'admin'
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

That is the complete PostgreSQL schema for the gateway. Three tables.

---

### Issue 2 [HIGH]: Moodle Password Storage

**Why it matters:** Storing `moodle_password_hash` in the central DB means: (a) students effectively have Moodle credentials that can be stolen, (b) the gateway is doing double-auth work, and (c) Moodle stops being a headless backend — it becomes a system with real user accounts that need lifecycle management.

**The fix:** Moodle operates exclusively via its admin web service token. Students never have Moodle credentials. The gateway impersonates students using Moodle's `core_user_*` admin APIs. Every Moodle operation is a server-to-server call using the admin token.

**Revised auth model for Moodle:**

```
Student action: "Get my course content"
  ↓
Gateway validates student's JWT (issued by gateway)
  ↓
Gateway calls Moodle admin API:
  core_course_get_contents?courseid=42&wstoken=ADMIN_TOKEN
  (with studentId context for completion/grade lookups)
  ↓
Gateway formats and returns data to student
  ↓
Student never touches Moodle directly. Ever.
```

**For operations that Moodle requires user-context (like quiz attempts):**
Moodle supports `userid` override on many admin API calls. For the rest, use the `core_role_assign_users` to temporarily grant a capability and call as admin. In practice, the quiz engine (`mod_quiz_*`) accepts `userid` parameters from admin tokens for all read operations. Write operations (submitting answers) use a lightweight Moodle plugin that accepts admin-signed requests.

**What gets deleted:** `moodle_username`, `moodle_password_hash`, `getMoodleTokenForStudent()`, Redis moodle token cache.

**What remains:** One `MOODLE_ADMIN_TOKEN` env var. One admin service account. Zero per-student credentials.

---

### Issue 3 [MEDIUM]: Metabase + Superset Redundancy

**Why it matters:** Two BI systems share the same ClickHouse data source but require separate setup, separate auth, separate dashboard maintenance, and separate upgrade paths. They serve the same purpose.

**The fix:** Drop Superset entirely. Keep Metabase.

**Why Metabase wins for this stack:**
- Signed JWT embedding is a first-class feature. Superset's embedding is newer and less stable.
- Metabase has native ClickHouse support via the official driver.
- Metabase's "Native Query" editor covers everything Superset's SQL Lab offers.
- Your internal analytics team uses Metabase directly. Your customers see Metabase charts embedded invisibly in your admin panel. One system, two audiences.

**The only reason to keep Superset:** if your data team requires Python/Jinja templating in SQL queries. That is not a coaching platform requirement.

**Action:** Remove `superset` from `docker-compose.yml`. Remove `superset` from the services list. The `superset/` cloned repo can stay on disk for reference but is not deployed.

---

### Issue 4 [HIGH]: NestJS Gateway Becoming a Monolith

**Why it matters:** Placing Auth, Students, Attendance, Fees, LMS, Tests, CRM, Analytics, Notifications, and RFID inside one NestJS process is fine at week 4. At week 40, with 50+ institutes, it becomes a 25,000-line application where a bug in the CRM module can take down attendance processing.

**The fix has two parts:**

**Part A — Modular Monolith with Hard Domain Boundaries:**
The gateway is refactored into strictly bounded NestJS modules that communicate only through a shared event bus interface, never by importing each other's services.

```
Allowed:
  AttendanceModule publishes 'attendance.marked' event to EventBus
  NovuModule subscribes to 'attendance.marked' event

Not allowed:
  AttendanceService imports NotificationsService and calls it directly
```

This discipline means any module can be extracted to a separate process with zero refactoring — you only change the EventBus from in-process to NATS.

**Part B — NATS JetStream as the boundary for heavy workers:**
Operations that touch external services (Moodle, ERPNext, ClickHouse, Novu) run as separate NestJS microservices connected via NATS, not inside the gateway process. See Issue 6 for the full event bus design.

---

### Issue 5 [MEDIUM]: BBB Branding via CSS Assumption

**Why it matters:** BBB's HTML5 client is a React application. You can inject CSS to hide logos and top bars. What you cannot control: error messages, browser permission dialogs, the "BigBlueButton" string in browser tabs, WebRTC connection screens, and recording watermarks. Physics Wallah-style custom live class UI requires owning the entire frontend.

**The two-track solution:**

**Track A — MVP (ship in 3 months):** BBB with CSS injection is acceptable. You own the outer UI (your header, your branding, your leave-class button). Inside the WebView, BBB's interface shows. Students accept this because the course, subject, and institute name are all yours. This is the 80% solution.

**Track B — Phase 4 migration to LiveKit:** LiveKit is an open-source, self-hostable WebRTC platform with React/React Native SDKs. You build the entire class UI yourself using LiveKit's room SDK. Full white-label, custom participant grid, custom whiteboard overlay, custom recording triggers. LiveKit runs in Docker (unlike BBB which needs bare metal).

```yaml
# Add to docker-compose.yml in Phase 4
livekit:
  image: livekit/livekit-server:v1.5
  command: --config /etc/livekit.yaml
  volumes:
    - ./livekit/livekit.yaml:/etc/livekit.yaml
  ports:
    - "7880:7880"
    - "7881:7881"
    - "7882:7882/udp"
  networks:
    - coaching_network
```

The BBB adapter interface (`createMeeting`, `getJoinUrl`, `endMeeting`) is preserved. In Phase 4, you implement `LiveKitAdapter` with the same interface. The rest of the codebase switches by swapping the injected adapter.

---

### Issue 6 [CRITICAL]: No Event Bus

**Why it matters:** In the v1 plan, creating a student does these things in sequence: PostgreSQL insert → Moodle API → ERPNext API → Novu API. If Moodle is restarting at that moment, the entire student creation fails. The student doesn't exist. The parent gets an error. The admin tries again. Now you have a duplicate in ERPNext. This is a production disaster.

**The fix:** NATS JetStream as the event bus. Every cross-service operation becomes a publish-subscribe pattern with durable delivery guarantees.

**Architecture:**

```
Gateway (REST API process)
    │
    ├── Handles HTTP requests
    ├── Validates JWTs
    ├── Reads from ERPNext/PostgreSQL for GET requests
    └── For write operations:
         ├── Writes to ERPNext (the master record)
         ├── Publishes event to NATS JetStream
         └── Returns success to client immediately

NATS JetStream (message broker with persistence)
    │
    ├── Stream: STUDENT_EVENTS (subjects: student.created, student.enrolled, student.updated)
    ├── Stream: BATCH_EVENTS   (subjects: batch.created, batch.enrollment.added)
    ├── Stream: ATTENDANCE     (subjects: attendance.rfid_punch, attendance.manual)
    ├── Stream: FEE_EVENTS     (subjects: fee.payment.initiated, fee.payment.confirmed)
    ├── Stream: LMS_EVENTS     (subjects: content.uploaded, video.processed, test.submitted)
    └── Stream: CLASS_EVENTS   (subjects: class.scheduled, class.recording.ready)

Worker Services (separate NestJS microservices, each subscribes to relevant streams)
    │
    ├── moodle-worker     → subscribes: student.created, batch.created, content.uploaded, test.submitted
    ├── novu-worker       → subscribes: student.created, attendance.rfid_punch, fee.payment.confirmed, test.submitted
    └── analytics-worker  → subscribes: ALL streams (writes every event to ClickHouse)
```

**Resilience model:**
- Gateway returns 201 Created as soon as ERPNext Student record is created and the event is published to NATS.
- If Moodle is down, the `moodle-worker` retries with exponential backoff for up to 24 hours.
- If Novu is unreachable, `novu-worker` retries. The welcome WhatsApp arrives a few minutes late. The student record is already created and correct.
- NATS JetStream persists messages to disk, so a full platform restart loses nothing.

---

### Issue 7 [HIGH]: No Observability Stack

**Why it matters:** When a coaching institute calls at 9 AM saying "3 students checked in with RFID but attendance didn't show in the dashboard," you need to trace the exact path of those events in under 5 minutes. Without observability, you grep Docker logs manually for 3 hours.

**The fix:** PLG stack (Prometheus + Loki + Grafana) with OpenTelemetry.

Added to the Docker Compose in Part 3. Every service emits:
- **Metrics** (Prometheus): request rates, error rates, queue depths, service response times
- **Logs** (Loki via Promtail): structured JSON logs from every container
- **Traces** (Tempo via OpenTelemetry): distributed trace from RFID punch → NATS → attendance marked → Novu triggered

Pre-built alert rules (Prometheus AlertManager):
- NATS queue depth > 500 unprocessed messages for > 5 minutes
- ERPNext API error rate > 5% for > 2 minutes
- Moodle response time P99 > 10 seconds
- ClickHouse insert lag > 30 seconds

---

### Issue 8 [HIGH]: Education Module Ignored

**Why it matters:** Your folder contains `education/` — the Frappe Education app. The v1 plan uses raw ERPNext doctypes and recreates coaching-specific concepts (batches, admissions, timetables, assessment results) from scratch in PostgreSQL. The Education module already has all of this.

**The fix:** Install Frappe Education on your ERPNext instance. Use its doctypes as your primary domain model. Map every gateway concept to an Education doctype first; only create custom fields when the Education doctype is missing something.

**Full mapping table covered in Part 8.**

---

## Part 2: Revised Core Architecture

### 2.1 The Three Sacred Rules (Revised)

**Rule 1 — No service is ever directly accessible to end users.** (Unchanged.) All ports except 80/443 are firewalled. Users only hit Nginx → Gateway → Internal services.

**Rule 2 [REVISED] — ERPNext+Education is the source of truth for all domain entities.** Not a custom PostgreSQL table. ERPNext Student is THE student record. Every other system holds a reference or a mirror. The gateway's PostgreSQL holds only platform-level state.

**Rule 3 — Your UI owns every pixel, and your event bus owns every side effect.** No synchronous service chain. Every write publishes an event. Workers handle side effects independently. One failure never cascades to another.

---

### 2.2 Revised Architecture Diagram

```
                              INTERNET
                                  │
                    ┌─────────────▼────────────┐
                    │         NGINX            │
                    │    (SSL / port 80, 443)  │
                    │   Wildcard cert only     │
                    └────────┬────────┬────────┘
                             │        │
               ┌─────────────▼─┐  ┌───▼──────────────┐
               │  Next.js Web  │  │  NestJS Gateway   │
               │  Admin Panel  │  │  (REST API only)  │
               └───────────────┘  └────────┬──────────┘
                                           │
                              ┌────────────▼────────────────┐
                              │    NATS JetStream           │
                              │    (persistent event bus)   │
                              └────┬────────┬───────┬───────┘
                                   │        │       │
                         ┌─────────▼─┐ ┌────▼──┐ ┌─▼──────────┐
                         │  moodle   │ │ novu  │ │ analytics  │
                         │  worker   │ │worker │ │  worker    │
                         └─────┬─────┘ └───┬───┘ └─────┬──────┘
                               │           │            │
                        ┌──────▼──┐  ┌─────▼──┐  ┌─────▼──────┐
                        │ Moodle  │  │  Novu  │  │ ClickHouse │
                        │  LMS    │  │  Notif │  │ Analytics  │
                        └─────────┘  └────────┘  └────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │    ERPNext + Education (master)     │
                    │    Student · Guardian · Batch       │
                    │    Fees · Attendance · Assessment   │
                    └─────────────────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │ Gateway PostgreSQL (platform only)  │
                    │  institutes · rfid_cards · tokens   │
                    └─────────────────────────────────────┘

Supporting:
  Redis       → OTP cache, BullMQ queues, WebSocket scaling
  MinIO       → File storage (PDFs, HLS video segments, receipts)
  BBB         → Live class engine (separate bare metal server)
  Metabase    → Embedded BI (invisible iframe in admin panel)
  PLG Stack   → Prometheus + Loki + Grafana (internal ops only)
```

---

## Part 3: Updated Infrastructure [REVISED]

### 3.1 Revised Port Architecture

```
EXTERNAL (Internet-facing)
  :443  HTTPS  → Nginx
  :80   HTTP   → Nginx (redirects to 443)

NGINX ROUTING
  api.yourplatform.com          → gateway:3000
  app.yourplatform.com          → web:3001
  {slug}.yourplatform.com       → web:3001 (tenant subdomain routing)

INTERNAL DOCKER NETWORK (coaching_network — never exposed)
  gateway:3000             ← NestJS API Gateway
  web:3001                 ← Next.js Admin Panel
  moodle:80                ← Moodle LMS
  moodle-db:3306           ← Moodle MariaDB
  erpnext:8000             ← ERPNext + Education
  erpnext-db:3306          ← ERPNext MariaDB
  postgres:5432            ← Gateway platform DB (3 tables)
  redis:6379               ← Sessions, queues, OTP
  minio:9000               ← Object storage
  nats:4222                ← NATS JetStream (NEW)
  novu-api:3000            ← Novu notification engine
  novu-mongo:27017         ← Novu MongoDB
  clickhouse:8123          ← ClickHouse HTTP
  metabase:3000            ← Metabase BI
  rfid-service:4000        ← RFID punch receiver
  mosquitto:1883           ← MQTT for hardware readers
  prometheus:9090          ← Metrics (NEW — internal only)
  grafana:3000             ← Dashboards (NEW — internal only)
  loki:3100                ← Logs (NEW)
  tempo:3200               ← Traces (NEW)
  moodle-worker:3010       ← NATS worker (NEW)
  novu-worker:3011         ← NATS worker (NEW)
  analytics-worker:3012    ← NATS worker (NEW)

BBB SERVER (separate Ubuntu 20.04 VM — not in Docker)
  bbb-server:443           ← BigBlueButton
```

---

### 3.2 Revised Docker Compose [REVISED]

```yaml
# infra/docker-compose.yml

version: '3.9'

networks:
  coaching_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
  redis_data:
  minio_data:
  moodle_data:
  moodle_db_data:
  erpnext_data:
  erpnext_db_data:
  clickhouse_data:
  metabase_data:
  novu_data:
  nats_data:          # NEW
  prometheus_data:    # NEW
  grafana_data:       # NEW
  loki_data:          # NEW
  tempo_data:         # NEW

services:

  # ════════════════════════════════════════
  # NGINX
  # ════════════════════════════════════════
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on: [gateway, web]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # GATEWAY — NestJS REST API
  # ════════════════════════════════════════
  gateway:
    build:
      context: ../gateway
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://coaching:${DB_PASSWORD}@postgres:5432/coaching_db

      # NATS (NEW)
      NATS_URL: nats://nats:4222

      # ERPNext + Education (MASTER IDENTITY)
      ERPNEXT_URL: http://erpnext:8000
      ERPNEXT_API_KEY: ${ERPNEXT_API_KEY}
      ERPNEXT_API_SECRET: ${ERPNEXT_API_SECRET}

      # Moodle (HEADLESS LMS — admin token only)
      MOODLE_URL: http://moodle:80
      MOODLE_ADMIN_TOKEN: ${MOODLE_ADMIN_TOKEN}

      # BBB
      BBB_URL: https://${BBB_SERVER_DOMAIN}/bigbluebutton/api
      BBB_SECRET: ${BBB_SECRET}

      # ClickHouse
      CLICKHOUSE_URL: http://clickhouse:8123
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}

      # Metabase
      METABASE_URL: http://metabase:3000
      METABASE_SECRET_KEY: ${METABASE_SECRET_KEY}

      # Novu
      NOVU_API_URL: http://novu-api:3000
      NOVU_API_KEY: ${NOVU_API_KEY}

      # MinIO
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}

      # Auth
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}

      # Redis
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379

      # Payments
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
      RAZORPAY_WEBHOOK_SECRET: ${RAZORPAY_WEBHOOK_SECRET}

      # Tracing
      OTEL_EXPORTER_OTLP_ENDPOINT: http://tempo:4317
      OTEL_SERVICE_NAME: gateway

    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
      nats: { condition: service_healthy }
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # NATS JETSTREAM (NEW — Event Bus)
  # ════════════════════════════════════════
  nats:
    image: nats:2.10-alpine
    command: >
      -js
      -sd /data
      -m 8222
    volumes:
      - nats_data:/data
    ports:
      - "8222:8222"   # monitoring UI — internal only, do NOT expose via Nginx
    networks: [coaching_network]
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8222/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ════════════════════════════════════════
  # WORKER: Moodle (NEW)
  # ════════════════════════════════════════
  moodle-worker:
    build:
      context: ../workers/moodle-worker
      dockerfile: Dockerfile
    environment:
      NATS_URL: nats://nats:4222
      MOODLE_URL: http://moodle:80
      MOODLE_ADMIN_TOKEN: ${MOODLE_ADMIN_TOKEN}
      ERPNEXT_URL: http://erpnext:8000
      ERPNEXT_API_KEY: ${ERPNEXT_API_KEY}
      ERPNEXT_API_SECRET: ${ERPNEXT_API_SECRET}
      OTEL_SERVICE_NAME: moodle-worker
      OTEL_EXPORTER_OTLP_ENDPOINT: http://tempo:4317
    depends_on: [nats, moodle]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # WORKER: Novu Notifications (NEW)
  # ════════════════════════════════════════
  novu-worker:
    build:
      context: ../workers/novu-worker
      dockerfile: Dockerfile
    environment:
      NATS_URL: nats://nats:4222
      NOVU_API_URL: http://novu-api:3000
      NOVU_API_KEY: ${NOVU_API_KEY}
      ERPNEXT_URL: http://erpnext:8000
      ERPNEXT_API_KEY: ${ERPNEXT_API_KEY}
      ERPNEXT_API_SECRET: ${ERPNEXT_API_SECRET}
      OTEL_SERVICE_NAME: novu-worker
      OTEL_EXPORTER_OTLP_ENDPOINT: http://tempo:4317
    depends_on: [nats, novu-api]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # WORKER: Analytics (NEW)
  # ════════════════════════════════════════
  analytics-worker:
    build:
      context: ../workers/analytics-worker
      dockerfile: Dockerfile
    environment:
      NATS_URL: nats://nats:4222
      CLICKHOUSE_URL: http://clickhouse:8123
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
      OTEL_SERVICE_NAME: analytics-worker
      OTEL_EXPORTER_OTLP_ENDPOINT: http://tempo:4317
    depends_on: [nats, clickhouse]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # POSTGRESQL — Gateway platform DB only
  # ════════════════════════════════════════
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: coaching_db
      POSTGRES_USER: coaching
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-postgres.sql:/docker-entrypoint-initdb.d/init.sql
    networks: [coaching_network]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coaching -d coaching_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ════════════════════════════════════════
  # REDIS
  # ════════════════════════════════════════
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes: [redis_data:/data]
    networks: [coaching_network]
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ════════════════════════════════════════
  # ERPNEXT + EDUCATION (MASTER IDENTITY)
  # ════════════════════════════════════════
  erpnext-db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: ${ERPNEXT_DB_ROOT_PASSWORD}
    volumes: [erpnext_db_data:/var/lib/mysql]
    networks: [coaching_network]
    restart: unless-stopped

  erpnext:
    image: frappe/erpnext:v15
    command: gunicorn --workers 4 --worker-class gthread frappe.app:application
    environment:
      DB_HOST: erpnext-db
      DB_PORT: 3306
      REDIS_CACHE: redis://:${REDIS_PASSWORD}@redis:6379/1
      REDIS_QUEUE: redis://:${REDIS_PASSWORD}@redis:6379/2
      FRAPPE_SITE_NAME_HEADER: erp.coaching-internal
      SITE_CONFIG_ALLOW_CORS: "1"
    volumes: [erpnext_data:/home/frappe/frappe-bench/sites]
    depends_on: [erpnext-db, redis]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # MOODLE — Headless LMS backend
  # ════════════════════════════════════════
  moodle-db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: ${MOODLE_DB_ROOT_PASSWORD}
      MYSQL_DATABASE: moodle
      MYSQL_USER: moodle
      MYSQL_PASSWORD: ${MOODLE_DB_PASSWORD}
    volumes: [moodle_db_data:/var/lib/mysql]
    networks: [coaching_network]
    restart: unless-stopped

  moodle:
    image: bitnami/moodle:4.3
    environment:
      MOODLE_DATABASE_HOST: moodle-db
      MOODLE_DATABASE_NAME: moodle
      MOODLE_DATABASE_USER: moodle
      MOODLE_DATABASE_PASSWORD: ${MOODLE_DB_PASSWORD}
      MOODLE_USERNAME: admin
      MOODLE_PASSWORD: ${MOODLE_ADMIN_PASSWORD}
      MOODLE_EMAIL: admin@coaching.internal
      MOODLE_SITE_NAME: "CoachingOS LMS"
    volumes: [moodle_data:/bitnami/moodle]
    depends_on: [moodle-db]
    networks: [coaching_network]
    restart: unless-stopped
    # No ports exposed — accessible only from moodle-worker and gateway

  # ════════════════════════════════════════
  # CLICKHOUSE
  # ════════════════════════════════════════
  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    environment:
      CLICKHOUSE_DB: coaching_analytics
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./scripts/init-clickhouse.sql:/docker-entrypoint-initdb.d/init.sql
      - ./clickhouse-config.xml:/etc/clickhouse-server/config.d/limits.xml
    networks: [coaching_network]
    restart: unless-stopped
    ulimits:
      nofile: { soft: 262144, hard: 262144 }

  # ════════════════════════════════════════
  # METABASE (replaces both Metabase + Superset)
  # ════════════════════════════════════════
  metabase:
    image: metabase/metabase:v0.49.0
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: metabase
      MB_DB_PORT: 5432
      MB_DB_USER: coaching
      MB_DB_PASS: ${DB_PASSWORD}
      MB_DB_HOST: postgres
      MB_EMBEDDING_SECRET_KEY: ${METABASE_SECRET_KEY}
      MB_ENABLE_EMBEDDING: "true"
      MB_APPLICATION_NAME: "Analytics"
      MB_APPLICATION_LOGO_URL: ""
    volumes:
      - ./metabase-plugins:/plugins   # ClickHouse driver JAR goes here
    depends_on: [postgres]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # NOVU
  # ════════════════════════════════════════
  novu-api:
    image: ghcr.io/novuhq/novu/api:0.24.0
    environment:
      NODE_ENV: production
      MONGO_URL: mongodb://novu-mongo:27017/novu
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${NOVU_JWT_SECRET}
      STORE_ENCRYPTION_KEY: ${NOVU_ENCRYPTION_KEY}
    depends_on: [novu-mongo, redis]
    networks: [coaching_network]
    restart: unless-stopped

  novu-mongo:
    image: mongo:6.0
    volumes: [novu_data:/data/db]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # MINIO
  # ════════════════════════════════════════
  minio:
    image: minio/minio:RELEASE.2024-01-01T00-00-00Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes: [minio_data:/data]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # RFID SERVICE
  # ════════════════════════════════════════
  rfid-service:
    build:
      context: ../rfid-service
      dockerfile: Dockerfile
    environment:
      PORT: 4000
      GATEWAY_URL: http://gateway:3000
      MQTT_BROKER: mqtt://mosquitto:1883
      RFID_SERVICE_TOKEN: ${RFID_SERVICE_TOKEN}
    networks: [coaching_network]
    restart: unless-stopped

  mosquitto:
    image: eclipse-mosquitto:2.0
    volumes: [./mosquitto.conf:/mosquitto/config/mosquitto.conf]
    networks: [coaching_network]
    restart: unless-stopped

  # ════════════════════════════════════════
  # OBSERVABILITY STACK (NEW)
  # ════════════════════════════════════════
  prometheus:
    image: prom/prometheus:v2.48.0
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./observability/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.enable-lifecycle'
    networks: [coaching_network]
    restart: unless-stopped
    # NOT exposed via Nginx to internet

  grafana:
    image: grafana/grafana:10.2.0
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_SERVER_ROOT_URL: https://ops.${DOMAIN}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./observability/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./observability/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    depends_on: [prometheus, loki, tempo]
    networks: [coaching_network]
    restart: unless-stopped

  loki:
    image: grafana/loki:2.9.0
    command: -config.file=/etc/loki/config.yaml
    volumes:
      - ./observability/loki-config.yaml:/etc/loki/config.yaml:ro
      - loki_data:/loki
    networks: [coaching_network]
    restart: unless-stopped

  promtail:
    image: grafana/promtail:2.9.0
    command: -config.file=/etc/promtail/config.yaml
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./observability/promtail-config.yaml:/etc/promtail/config.yaml:ro
    networks: [coaching_network]
    restart: unless-stopped

  tempo:
    image: grafana/tempo:2.3.0
    command: -config.file=/etc/tempo/config.yaml
    volumes:
      - ./observability/tempo-config.yaml:/etc/tempo/config.yaml:ro
      - tempo_data:/tmp/tempo
    networks: [coaching_network]
    restart: unless-stopped

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.88.0
    volumes:
      - ./observability/otel-collector.yaml:/etc/otel/config.yaml:ro
    command: --config /etc/otel/config.yaml
    depends_on: [tempo]
    networks: [coaching_network]
    restart: unless-stopped
```

---

## Part 4: ERPNext Education — First-Class Domain Model [NEW]

### 4.1 Coaching Domain Mapped to Education Doctypes

This is the definitive mapping. When building gateway logic, always reach for an Education doctype first.

| Your Concept | Education Doctype | Custom Fields Needed |
|---|---|---|
| Student profile | `Student` | `custom_phone` (phone), `custom_fcm_token` (push) |
| Parent/guardian | `Guardian` | none — Guardian links to Student natively |
| Subject | `Course` | none |
| Exam type / Package | `Program` | `custom_price`, `custom_slug` |
| Batch (group of students) | `Student Group` | `custom_batch_type` (regular/crash), `custom_schedule_json` |
| Teacher | `Instructor` (+ `Employee` for HR) | none |
| Student enrollment in batch | `Program Enrollment` | `custom_payment_plan` |
| Timetable | `Course Schedule` | none |
| Student attendance per day | `Student Attendance` | none |
| Exam scheduling | `Assessment Plan` | none |
| Test result per student | `Assessment Result` | `custom_rank`, `custom_percentile` |
| Admission / lead conversion | `Student Admission` | `custom_lead_source`, `custom_assigned_to` |
| Fee template for a program | `Fee Structure` | none |
| Fee invoice per student | `Fee Schedule` | none |

### 4.2 ERPNext+Education Setup Script

```bash
# infra/scripts/erpnext-setup.sh

# Wait for ERPNext container to be healthy
until docker exec erpnext bench --version; do sleep 5; done

# Create the site
docker exec erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench new-site erp.coaching-internal \
    --db-host erpnext-db \
    --mariadb-root-password ${ERPNEXT_DB_ROOT_PASSWORD} \
    --admin-password ${ERPNEXT_ADMIN_PASSWORD}
"

# Install apps in order: frappe → erpnext → hrms → education
docker exec erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench --site erp.coaching-internal install-app erpnext && \
  bench --site erp.coaching-internal install-app hrms && \
  bench --site erp.coaching-internal install-app education
"

# Enable CORS for gateway access
docker exec erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench --site erp.coaching-internal set-config allow_cors 1 && \
  bench --site erp.coaching-internal set-config cors_origin 'http://gateway:3000'
"

# Add custom fields needed by the gateway
docker exec erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench --site erp.coaching-internal execute coaching_setup.add_custom_fields
"
# coaching_setup.py is a one-time script that adds:
# Student.custom_moodle_user_id (int)
# Student.custom_fcm_token (text)
# Student.custom_novu_subscriber_id (text)
# Assessment Result.custom_rank (int)
# Assessment Result.custom_percentile (float)

# Create API user for gateway
# Do this manually in ERPNext UI:
# Settings → API Access → New Key → Role: System Manager
# Copy API Key + Secret to .env
```

### 4.3 ERPNext+Education Adapter [REVISED]

```typescript
// gateway/src/adapters/erpnext/education.adapter.ts
// This adapter wraps both ERPNext base and Education module

@Injectable()
export class EducationAdapter {
  private readonly http: AxiosInstance;

  constructor(private config: ConfigService) {
    this.http = axios.create({
      baseURL: config.get('ERPNEXT_URL'),
      headers: {
        Authorization: `token ${config.get('ERPNEXT_API_KEY')}:${config.get('ERPNEXT_API_SECRET')}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  private async getDoc<T>(doctype: string, name: string): Promise<T> {
    const { data } = await this.http.get(`/api/resource/${doctype}/${encodeURIComponent(name)}`);
    return data.data;
  }

  private async createDoc<T>(doctype: string, doc: Partial<T>): Promise<T> {
    const { data } = await this.http.post(`/api/resource/${doctype}`, doc);
    return data.data;
  }

  private async updateDoc<T>(doctype: string, name: string, doc: Partial<T>): Promise<T> {
    const { data } = await this.http.put(`/api/resource/${doctype}/${encodeURIComponent(name)}`, doc);
    return data.data;
  }

  private async listDocs<T>(
    doctype: string,
    filters: any[][] = [],
    fields: string[] = ['name'],
    limit = 500
  ): Promise<T[]> {
    const { data } = await this.http.get(`/api/resource/${doctype}`, {
      params: {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(fields),
        limit,
      },
    });
    return data.data;
  }

  private async callMethod<T>(method: string, params: Record<string, any> = {}): Promise<T> {
    const { data } = await this.http.post(`/api/method/${method}`, params);
    return data.message;
  }

  // ─── Student (Primary Identity) ────────────────────────────────
  async createStudent(dto: CreateStudentDto): Promise<ErpStudent> {
    // Education's Student doctype IS the master record
    const student = await this.createDoc<ErpStudent>('Student', {
      student_name: dto.name,
      student_mobile_number: dto.phone,
      student_email_id: dto.email || '',
      date_of_birth: dto.dob || '',
      gender: dto.gender || 'Male',
      blood_group: dto.bloodGroup || '',
    });

    // Link guardian
    if (dto.parentName || dto.parentPhone) {
      const guardian = await this.createDoc('Guardian', {
        guardian_name: dto.parentName || `Parent of ${dto.name}`,
        mobile_number: dto.parentPhone,
        email_address: dto.parentEmail || '',
      });
      await this.createDoc('Student Guardian', {
        parent_student: student.name,
        guardian: guardian.name,
        guardian_name: dto.parentName || `Parent of ${dto.name}`,
        relation: 'Father',
        is_emergency_contact: 1,
      });
    }

    return student;
  }

  async getStudentByPhone(phone: string): Promise<ErpStudent | null> {
    const results = await this.listDocs<ErpStudent>(
      'Student',
      [['student_mobile_number', '=', phone]],
      ['name', 'student_name', 'student_mobile_number', 'student_email_id', 'custom_moodle_user_id']
    );
    return results[0] || null;
  }

  async updateStudentMoodleId(studentName: string, moodleUserId: number): Promise<void> {
    await this.updateDoc('Student', studentName, {
      custom_moodle_user_id: moodleUserId,
    });
  }

  // ─── Student Group (Batch) ──────────────────────────────────────
  async createBatch(dto: CreateBatchDto): Promise<ErpStudentGroup> {
    const program = await this.ensureProgram(dto.programName);

    return this.createDoc<ErpStudentGroup>('Student Group', {
      student_group_name: dto.name,
      group_based_on: 'Batch',
      academic_year: dto.academicYear,
      program: program.name,
      custom_batch_type: dto.batchType || 'regular',  // regular | crash | test-series
      max_strength: dto.maxStudents || 60,
    });
  }

  async enrollStudentInBatch(
    studentName: string,
    studentGroupName: string
  ): Promise<void> {
    // Get current members
    const group = await this.getDoc<any>('Student Group', studentGroupName);
    const members = group.students || [];

    // Add new member if not already enrolled
    const alreadyEnrolled = members.some((m: any) => m.student === studentName);
    if (alreadyEnrolled) return;

    await this.updateDoc('Student Group', studentGroupName, {
      students: [
        ...members,
        { student: studentName, active: 1 },
      ],
    });
  }

  // ─── Program Enrollment (Admission) ────────────────────────────
  async createProgramEnrollment(
    studentName: string,
    programName: string,
    academicYear: string
  ): Promise<{ name: string }> {
    const enrollment = await this.createDoc('Program Enrollment', {
      student: studentName,
      program: programName,
      academic_year: academicYear,
      enrollment_date: new Date().toISOString().split('T')[0],
      docstatus: 1,  // Submit immediately
    });
    return enrollment;
  }

  // ─── Assessment (Tests) ─────────────────────────────────────────
  async createAssessmentPlan(dto: AssessmentPlanDto): Promise<{ name: string }> {
    return this.createDoc('Assessment Plan', {
      assessment_name: dto.name,
      student_group: dto.studentGroupName,
      course: dto.courseName,
      assessment_date: dto.date,
      schedule_date: dto.scheduleDate || dto.date,
      grading_scale: dto.gradingScale || 'Percentage',
    });
  }

  async saveAssessmentResult(dto: SaveResultDto): Promise<void> {
    const existing = await this.listDocs(
      'Assessment Result',
      [
        ['assessment_plan', '=', dto.assessmentPlanName],
        ['student', '=', dto.studentName],
      ],
      ['name']
    );

    if (existing.length > 0) {
      await this.updateDoc('Assessment Result', existing[0].name, {
        total_score: dto.score,
        grade: dto.grade,
        custom_rank: dto.rank,
        custom_percentile: dto.percentile,
      });
    } else {
      await this.createDoc('Assessment Result', {
        assessment_plan: dto.assessmentPlanName,
        student: dto.studentName,
        total_score: dto.score,
        grade: dto.grade,
        custom_rank: dto.rank,
        custom_percentile: dto.percentile,
      });
    }
  }

  // ─── Attendance ─────────────────────────────────────────────────
  async markStudentAttendance(
    studentName: string,
    studentGroupName: string,
    courseName: string,
    date: string,
    status: 'Present' | 'Absent' | 'Half Day'
  ): Promise<void> {
    // Use Education's Student Attendance doctype
    const existing = await this.listDocs(
      'Student Attendance',
      [
        ['student', '=', studentName],
        ['date', '=', date],
        ['student_group', '=', studentGroupName],
      ],
      ['name', 'status']
    );

    if (existing.length > 0 && existing[0].status !== status) {
      await this.updateDoc('Student Attendance', existing[0].name, { status });
    } else if (existing.length === 0) {
      const attendance = await this.createDoc('Student Attendance', {
        student: studentName,
        student_name: studentName,
        date,
        student_group: studentGroupName,
        course: courseName,
        status,
      });
      // Submit to lock the record
      await this.callMethod('frappe.client.submit', { doc: attendance });
    }
  }

  // ─── Fees ───────────────────────────────────────────────────────
  async createFeeStructure(dto: FeeStructureDto): Promise<{ name: string }> {
    return this.createDoc('Fee Structure', {
      academic_year: dto.academicYear,
      program: dto.programName,
      student_group: dto.studentGroupName,
      components: dto.components.map((c, i) => ({
        fees_category: c.category,
        amount: c.amount,
        idx: i + 1,
      })),
    });
  }

  async createFeeScheduleForStudent(
    studentName: string,
    feeStructureName: string,
    dueDate: string
  ): Promise<{ name: string }> {
    return this.createDoc('Fee Schedule', {
      student: studentName,
      fee_structure: feeStructureName,
      due_date: dueDate,
    });
  }

  async recordFeePayment(dto: RecordPaymentDto): Promise<{ name: string }> {
    const entry = await this.createDoc<any>('Payment Entry', {
      payment_type: 'Receive',
      party_type: 'Student',
      party: dto.studentName,
      paid_amount: dto.amount,
      received_amount: dto.amount,
      mode_of_payment: dto.mode,
      reference_no: dto.referenceId,
      reference_date: new Date().toISOString().split('T')[0],
      custom_razorpay_payment_id: dto.razorpayId || '',
    });
    await this.callMethod('frappe.client.submit', { doc: entry });
    return entry;
  }

  // ─── Instructor ─────────────────────────────────────────────────
  async createInstructor(dto: CreateInstructorDto): Promise<{ name: string }> {
    // Create Employee (HR) first
    const employee = await this.createDoc<any>('Employee', {
      first_name: dto.firstName,
      last_name: dto.lastName || '.',
      cell_number: dto.phone,
      company_email: dto.email,
      date_of_joining: dto.joiningDate || new Date().toISOString().split('T')[0],
      designation: 'Teacher',
      department: dto.subject || 'Academic',
    });

    // Create Instructor record (Education module) linking to Employee
    const instructor = await this.createDoc('Instructor', {
      instructor_name: `${dto.firstName} ${dto.lastName || ''}`.trim(),
      employee: employee.name,
      department: dto.subject || 'Academic',
    });

    return instructor;
  }

  // ─── Programs ───────────────────────────────────────────────────
  async ensureProgram(programName: string): Promise<{ name: string }> {
    const existing = await this.listDocs('Program', [['program_name', '=', programName]], ['name']);
    if (existing.length > 0) return existing[0];
    return this.createDoc('Program', { program_name: programName });
  }

  // ─── CRM (Lead Admission) ────────────────────────────────────────
  async createAdmissionInquiry(dto: AdmissionInquiryDto): Promise<{ name: string }> {
    // Use Student Admission doctype
    return this.createDoc('Student Admission', {
      title: `${dto.studentName} — ${dto.programName}`,
      program: dto.programName,
      application_status: 'Applied',
      custom_lead_source: dto.source,
      custom_parent_phone: dto.parentPhone,
      custom_student_name: dto.studentName,
    });
  }
}
```

---

## Part 5: Gateway — Modular Monolith with Event Bus [REVISED]

### 5.1 Module Structure with Hard Domain Boundaries

The gateway is restructured into bounded context modules. Modules are NOT allowed to import each other's services. All cross-module communication goes through a shared `DomainEventBus` abstraction.

```
gateway/src/
│
├── adapters/
│   ├── education/       ← ERPNext + Education adapter (replaces old erpnext/)
│   ├── moodle/          ← Moodle admin API (no student credentials)
│   ├── bbb/             ← BigBlueButton (unchanged from v1)
│   ├── metabase/        ← Metabase embed tokens (unchanged from v1)
│   └── razorpay/        ← Payment gateway
│
├── modules/
│   ├── auth/            ← JWT issue/verify, OTP, phone auth
│   ├── tenants/         ← Institute config, branding, slug routing
│   ├── admissions/      ← Lead → Student Admission → Program Enrollment
│   ├── students/        ← Read student profiles (from ERPNext)
│   ├── batches/         ← Batch/Student Group management
│   ├── attendance/      ← RFID + manual, WebSocket push
│   ├── fees/            ← Fee schedule, Razorpay, receipts
│   ├── lms/             ← Content upload, video, MinIO
│   ├── tests/           ← Quiz management, attempt tracking
│   ├── live-class/      ← BBB room management
│   ├── notifications/   ← Event-driven Novu triggers only
│   ├── analytics/       ← ClickHouse queries + Metabase embed URLs
│   └── rfid/            ← RFID punch receiver + WebSocket
│
├── shared/
│   ├── events/
│   │   ├── domain-event-bus.ts    ← Internal EventEmitter2 + NATS publisher
│   │   └── events.constants.ts    ← All event name constants
│   ├── nats/
│   │   └── nats.module.ts         ← NATS JetStream client setup
│   └── redis/
│       └── redis.module.ts
│
└── main.ts
```

### 5.2 DomainEventBus: The Boundary Enforcer

```typescript
// gateway/src/shared/events/domain-event-bus.ts
// Every cross-module side effect goes through here. No direct service imports between modules.

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NatsConnection, connect, StringCodec } from 'nats';

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  instituteId: string;
}

@Injectable()
export class DomainEventBus implements OnModuleInit {
  private nats: NatsConnection;
  private sc = StringCodec();

  constructor(private emitter: EventEmitter2) {}

  async onModuleInit() {
    this.nats = await connect({ servers: process.env.NATS_URL });
  }

  // Publish to BOTH internal EventEmitter (for same-process listeners)
  // AND NATS JetStream (for worker processes)
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    // Internal listeners (same process) — synchronous
    this.emitter.emit(event.type, event);

    // NATS workers (separate processes) — async, durable
    await this.nats.publish(event.type, this.sc.encode(JSON.stringify(event)));
  }
}

// Event constants — single source of truth
export const EVENTS = {
  // Students
  STUDENT_CREATED:          'student.created',
  STUDENT_ENROLLED:         'student.enrolled',
  STUDENT_PROFILE_UPDATED:  'student.profile.updated',

  // Batches
  BATCH_CREATED:            'batch.created',
  BATCH_SCHEDULE_UPDATED:   'batch.schedule.updated',

  // Attendance
  RFID_PUNCH:               'attendance.rfid_punch',
  ATTENDANCE_MARKED:        'attendance.marked',
  STUDENT_ABSENT:           'attendance.student_absent',

  // Fees
  FEE_PAYMENT_INITIATED:    'fee.payment.initiated',
  FEE_PAYMENT_CONFIRMED:    'fee.payment.confirmed',
  FEE_OVERDUE:              'fee.overdue',

  // LMS
  CONTENT_UPLOADED:         'lms.content.uploaded',
  VIDEO_PROCESSING_DONE:    'lms.video.ready',
  TEST_SUBMITTED:           'lms.test.submitted',
  RESULTS_PUBLISHED:        'lms.results.published',

  // Live Class
  CLASS_SCHEDULED:          'class.scheduled',
  CLASS_STARTED:            'class.started',
  CLASS_RECORDING_READY:    'class.recording.ready',
} as const;
```

### 5.3 Revised Student Creation (Event-Driven) [REVISED]

```typescript
// gateway/src/modules/students/students.service.ts
// CRITICAL CHANGE: ERPNext is called first (master), then event published.
// Workers handle Moodle + Novu + Analytics asynchronously.

@Injectable()
export class StudentsService {
  constructor(
    private education: EducationAdapter,
    private eventBus: DomainEventBus,
  ) {}

  async createStudent(dto: CreateStudentDto): Promise<ErpStudent> {
    // STEP 1: Create master record in ERPNext Education (the ONLY sync step)
    const student = await this.education.createStudent(dto);

    // STEP 2: Publish event — workers handle Moodle + Novu + Analytics
    // Gateway returns immediately after this. No waiting for Moodle.
    await this.eventBus.publish({
      type: EVENTS.STUDENT_CREATED,
      payload: {
        erpStudentName: student.name,   // e.g. "EDU-STU-2024-00001"
        studentName: dto.name,
        phone: dto.phone,
        email: dto.email,
        parentPhone: dto.parentPhone,
        parentName: dto.parentName,
        instituteId: dto.instituteId,
      },
      timestamp: new Date().toISOString(),
      instituteId: dto.instituteId,
    });

    return student;
  }

  async enrollStudentInBatch(
    erpStudentName: string,
    studentGroupName: string,
    programName: string,
    academicYear: string,
    instituteId: string,
  ): Promise<void> {
    // STEP 1: Create Program Enrollment in ERPNext (sync — master record)
    await this.education.enrollStudentInBatch(erpStudentName, studentGroupName);
    await this.education.createProgramEnrollment(erpStudentName, programName, academicYear);

    // STEP 2: Create Fee Schedule from the program's Fee Structure (sync)
    const feeStructures = await this.education.listDocs(
      'Fee Structure',
      [['student_group', '=', studentGroupName]],
      ['name']
    );
    if (feeStructures.length > 0) {
      await this.education.createFeeScheduleForStudent(
        erpStudentName,
        feeStructures[0].name,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
    }

    // STEP 3: Publish event — Moodle enrollment + Novu topic subscription handled by workers
    await this.eventBus.publish({
      type: EVENTS.STUDENT_ENROLLED,
      payload: { erpStudentName, studentGroupName, programName, instituteId },
      timestamp: new Date().toISOString(),
      instituteId,
    });
  }
}
```

---

## Part 6: Worker Services [NEW]

Each worker is a lightweight NestJS microservice that connects ONLY to NATS and its target service. No HTTP port. No REST API. NATS consumers only.

### 6.1 Moodle Worker

```typescript
// workers/moodle-worker/src/handlers/student-created.handler.ts

@Injectable()
export class StudentCreatedHandler implements OnModuleInit {
  private nats: NatsConnection;
  private sc = StringCodec();

  constructor(
    private moodle: MoodleAdapter,
    private education: EducationAdapter,  // to write back moodle_user_id
  ) {}

  async onModuleInit() {
    this.nats = await connect({
      servers: process.env.NATS_URL,
      name: 'moodle-worker',
    });

    // Durable consumer — survives restarts, retries failures
    const js = this.nats.jetstream();
    const c = await js.subscribe(EVENTS.STUDENT_CREATED, {
      durable: 'moodle-student-created',
      ack_policy: AckPolicy.Explicit,
    });

    for await (const msg of c) {
      try {
        const event: DomainEvent<StudentCreatedPayload> = JSON.parse(
          this.sc.decode(msg.data)
        );
        await this.handleStudentCreated(event.payload);
        msg.ack();
      } catch (err) {
        // Log error, do NOT ack — NATS will redeliver after ack_wait period
        console.error('moodle-worker: student.created failed', err.message);
        // After max_deliver attempts, message goes to dead-letter subject
      }
    }
  }

  private async handleStudentCreated(payload: StudentCreatedPayload): Promise<void> {
    // Create Moodle user — admin token only, no student credentials
    const moodleUserId = await this.moodle.createUser({
      // Username derived from ERPNext student ID (deterministic, no password stored anywhere)
      username: `erp_${payload.erpStudentName.replace(/-/g, '').toLowerCase()}`,
      // Auto-generated password — stored NOWHERE, never used for login, only admin API calls
      password: crypto.randomBytes(32).toString('hex'),
      firstName: payload.studentName.split(' ')[0],
      lastName: payload.studentName.split(' ').slice(1).join(' ') || '.',
      email: payload.email || `${payload.erpStudentName}@coaching.internal`,
      externalId: payload.erpStudentName,  // stored in Moodle idnumber field
    });

    // Write moodle_user_id back to ERPNext Student record
    await this.education.updateStudentMoodleId(payload.erpStudentName, moodleUserId);
  }
}
```

### 6.2 Moodle Worker — Batch Enrollment Handler

```typescript
// workers/moodle-worker/src/handlers/student-enrolled.handler.ts

private async handleStudentEnrolled(payload: StudentEnrolledPayload): Promise<void> {
  // Get the student's moodle_user_id from ERPNext (written by student.created handler)
  const student = await this.education.getDoc<any>('Student', payload.erpStudentName);
  if (!student.custom_moodle_user_id) {
    throw new Error(`Student ${payload.erpStudentName} has no moodle_user_id yet — will retry`);
    // This causes a retry, which is correct — student.created handler may still be running
  }

  // Get the Moodle course ID for this student group
  // The course was created when the batch was created (handled by batch.created event)
  const moodleCourseId = await this.getMoodleCourseForBatch(payload.studentGroupName);
  if (!moodleCourseId) {
    throw new Error(`No Moodle course found for batch ${payload.studentGroupName} — will retry`);
  }

  await this.moodle.enrollStudent(moodleCourseId, student.custom_moodle_user_id);
}
```

### 6.3 Analytics Worker

```typescript
// workers/analytics-worker/src/main.ts
// Subscribes to ALL event streams and writes to ClickHouse

// One handler for every event type — maps payload to ClickHouse row
const EVENT_TO_ANALYTICS: Record<string, (payload: any) => AnalyticsEvent> = {
  [EVENTS.RFID_PUNCH]: (p) => ({
    event_type: 'rfid_entry',
    student_id: p.erpStudentName,
    institute_id: p.instituteId,
    batch_id: p.studentGroupName,
    reference_id: p.deviceId,
    properties: { card_uid: p.cardUid },
  }),
  [EVENTS.TEST_SUBMITTED]: (p) => ({
    event_type: 'test_submit',
    student_id: p.erpStudentName,
    institute_id: p.instituteId,
    batch_id: p.studentGroupName,
    reference_id: p.assessmentPlanName,
    score: p.score,
    rank: p.rank,
    properties: { time_taken_sec: p.timeTakenSec },
  }),
  [EVENTS.FEE_PAYMENT_CONFIRMED]: (p) => ({
    event_type: 'fee_payment',
    student_id: p.erpStudentName,
    institute_id: p.instituteId,
    batch_id: '',
    reference_id: p.razorpayPaymentId,
    properties: { amount: p.amount, mode: p.mode },
  }),
  // ... all other event types
};
```

---

## Part 7: Revised Auth Flow [REVISED]

Students have no Moodle credentials. They have no ERPNext passwords. They authenticate purely via phone OTP, and the gateway issues its own JWT backed by ERPNext Student records.

```typescript
// gateway/src/modules/auth/auth.service.ts

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(JwtRefreshToken) private tokenRepo: Repository<JwtRefreshToken>,
    private education: EducationAdapter,
    private redis: RedisService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(phone: string): Promise<void> {
    // Verify student exists in ERPNext before sending OTP
    const student = await this.education.getStudentByPhone(phone);
    if (!student) throw new NotFoundException('Student not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.setex(`otp:${phone}`, 300, otp);

    // Send via Novu (WhatsApp/SMS) — fire and forget
    await this.sendOtpViaNovu(phone, otp);
  }

  async verifyOtpAndLogin(phone: string, otp: string, instituteSlug: string): Promise<AuthTokens> {
    // 1. Verify OTP
    const storedOtp = await this.redis.get(`otp:${phone}`);
    if (!storedOtp || storedOtp !== otp) throw new UnauthorizedException('Invalid OTP');
    await this.redis.del(`otp:${phone}`);

    // 2. Fetch student from ERPNext (master identity)
    const student = await this.education.getStudentByPhone(phone);
    if (!student) throw new NotFoundException('Student not found');

    // 3. Fetch institute
    const institute = await this.instituteRepo.findOneBySlug(instituteSlug);

    // 4. Issue JWT — subject is ERPNext Student.name
    const accessToken = this.jwtService.sign(
      {
        sub: student.name,         // "EDU-STU-2024-00001"
        role: 'student',
        instituteId: institute.id,
        name: student.student_name,
      },
      { expiresIn: '24h' }
    );

    // 5. Store refresh token hash in PostgreSQL (the only use of gateway PostgreSQL for identity)
    const refreshToken = crypto.randomBytes(48).toString('hex');
    await this.tokenRepo.save({
      subject_id: student.name,
      role: 'student',
      token_hash: await bcrypt.hash(refreshToken, 10),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
    // The client uses accessToken for all API calls.
    // The gateway uses student.name (ERPNext ID) to look up Moodle user ID when needed.
  }
}
```

---

## Part 8: Observability Stack [NEW]

### 8.1 Prometheus Configuration

```yaml
# infra/observability/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gateway'
    static_configs:
      - targets: ['gateway:3000']
    metrics_path: /metrics

  - job_name: 'moodle-worker'
    static_configs:
      - targets: ['moodle-worker:3010']

  - job_name: 'novu-worker'
    static_configs:
      - targets: ['novu-worker:3011']

  - job_name: 'analytics-worker'
    static_configs:
      - targets: ['analytics-worker:3012']

  - job_name: 'nats'
    static_configs:
      - targets: ['nats:8222']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

rule_files:
  - /etc/prometheus/alerts.yml
```

### 8.2 Critical Alert Rules

```yaml
# infra/observability/alerts.yml
groups:
  - name: coaching_platform
    rules:

      - alert: NatsQueueBacklog
        expr: nats_core_slow_consumer_msgs > 500
        for: 5m
        annotations:
          summary: "NATS queue backlog — workers may be down"
          description: "More than 500 unprocessed messages in NATS for 5+ minutes"

      - alert: ErpNextHighErrorRate
        expr: rate(http_requests_total{job="gateway", path=~"/api/erpnext.*", status=~"5.."}[5m]) > 0.05
        for: 2m
        annotations:
          summary: "ERPNext API error rate > 5%"

      - alert: AttendanceWebhookLag
        expr: time() - coaching_last_rfid_punch_timestamp > 3600
        annotations:
          summary: "No RFID punches received in 1 hour during school hours"

      - alert: MoodleWorkerDown
        expr: up{job="moodle-worker"} == 0
        for: 1m
        annotations:
          summary: "Moodle worker is down — LMS operations will queue"
```

### 8.3 NestJS OpenTelemetry Setup

```typescript
// gateway/src/tracing.ts — must be imported FIRST in main.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
  serviceName: process.env.OTEL_SERVICE_NAME || 'gateway',
});

sdk.start();

// Now every HTTP call, DB query, and NATS publish is automatically traced.
// In Grafana → Tempo, you can trace a single RFID punch through:
// gateway receive → NATS publish → moodle-worker create user → ERPNext write → Novu trigger
```

---

## Part 9: Folder Structure [REVISED]

```
~/Desktop/coaching_erp/
│
├── services/                      ← Cloned repos (backends only)
│   ├── bigbluebutton/
│   ├── clickhouse/
│   ├── education/                 ← FIRST CLASS (install on ERPNext, not ignored)
│   ├── erpnext/
│   ├── metabase/
│   ├── moodle/
│   ├── novu/
│   └── superset/                  ← NOT DEPLOYED (kept on disk only)
│
├── gateway/                       ← NestJS REST API
│   └── src/
│       ├── adapters/
│       │   ├── education/         ← ERPNext+Education (replaces old erpnext/)
│       │   ├── moodle/            ← Admin token only, no student credentials
│       │   ├── bbb/
│       │   └── metabase/
│       ├── modules/
│       │   ├── auth/
│       │   ├── tenants/
│       │   ├── admissions/        ← NEW: Student Admission → enrollment
│       │   ├── students/
│       │   ├── batches/
│       │   ├── attendance/
│       │   ├── fees/
│       │   ├── lms/
│       │   ├── tests/
│       │   ├── live-class/
│       │   ├── notifications/
│       │   ├── analytics/
│       │   └── rfid/
│       └── shared/
│           ├── events/            ← DomainEventBus (NATS + EventEmitter2)
│           └── nats/
│
├── workers/                       ← NEW: Separate worker microservices
│   ├── moodle-worker/             ← Handles: student.created → Moodle user
│   │   └── src/                      batch.created → Moodle course
│   │       ├── handlers/             student.enrolled → Moodle enrollment
│   │       └── main.ts               lms.content.uploaded → Moodle resource
│   │
│   ├── novu-worker/               ← Handles: all events → Novu notification triggers
│   │   └── src/
│   │       ├── handlers/
│   │       └── main.ts
│   │
│   └── analytics-worker/          ← Handles: all events → ClickHouse write
│       └── src/
│           ├── handlers/
│           └── main.ts
│
├── apps/
│   ├── web/                       ← Next.js Admin Panel (unchanged)
│   ├── student-app/               ← React Native (unchanged)
│   ├── teacher-app/               ← React Native (unchanged)
│   └── parent-app/                ← React Native (unchanged)
│
├── rfid-service/                  ← Lightweight RFID receiver (unchanged)
│
├── infra/
│   ├── docker-compose.yml         ← Updated (added NATS, workers, PLG, removed Superset)
│   ├── nginx/
│   ├── scripts/
│   │   ├── erpnext-setup.sh       ← Updated (installs education app)
│   │   ├── init-postgres.sql      ← Now only 3 tables
│   │   └── init-clickhouse.sql
│   └── observability/             ← NEW
│       ├── prometheus.yml
│       ├── alerts.yml
│       ├── loki-config.yaml
│       ├── promtail-config.yaml
│       ├── tempo-config.yaml
│       ├── otel-collector.yaml
│       └── grafana/
│           ├── dashboards/
│           └── datasources/
│
└── .env
```

---

## Part 10: Revised Build Sequence [REVISED]

### Phase 0 — Infrastructure + Identity (Week 1–2)

```bash
# 1. Start core infrastructure
docker compose up -d postgres redis minio nats

# 2. Start and configure ERPNext + Education (master identity — DO THIS FIRST)
docker compose up -d erpnext-db erpnext
./infra/scripts/erpnext-setup.sh
# This installs: erpnext → hrms → education
# Adds custom fields to Student doctype

# 3. Start and configure Moodle
docker compose up -d moodle-db moodle
./infra/scripts/moodle-setup.sh
# Configure: web services, create admin token, set PHP limits, create coaching_service

# 4. Start ClickHouse + seed schema
docker compose up -d clickhouse
./infra/scripts/init-clickhouse.sh

# 5. Start Novu
docker compose up -d novu-mongo novu-api novu-worker

# 6. Start Metabase + connect to ClickHouse
docker compose up -d metabase
# Manually: install ClickHouse driver JAR, connect to coaching_analytics DB

# 7. Start NATS workers (test event flow)
docker compose up -d moodle-worker novu-worker analytics-worker

# 8. Start observability stack
docker compose up -d prometheus grafana loki promtail tempo otel-collector

# 9. Start gateway
docker compose up -d gateway

# Milestone: Create one student via gateway API.
# Verify: ERPNext Student created, Moodle user auto-created by worker,
# Novu subscriber created by worker, ClickHouse event recorded by worker.
```

| Week | Deliverable | What Changes From v1 |
|---|---|---|
| 1–2 | Infrastructure: NATS, ERPNext+Education, Moodle, PLG stack | NATS added, Superset dropped, observability added |
| 3 | Auth: phone OTP → JWT backed by ERPNext Student | No PostgreSQL student table |
| 3 | Multi-tenant: institute slug routing | Unchanged |
| 4 | Student creation via Education adapter → NATS event | Workers handle Moodle+Novu asynchronously |
| 4 | RFID attendance → Education Student Attendance → ClickHouse | Attendance writes to ERPNext, not custom table |
| 5 | Fee collection: Razorpay → ERPNext Fee Schedule + Payment Entry | Unchanged except uses Education Fee doctypes |
| 5 | WhatsApp notifications via Novu worker | Worker-driven, not inline in gateway |
| 6 | Admin panel: students, batches, attendance, fees | Unchanged |
| 7–10 | LMS: PDF, video, tests via Moodle (admin token only) | No student Moodle credentials |
| 11–14 | Live class: BBB with CSS wrapper + LiveKit migration plan | Documented migration path |
| 13–14 | Analytics: Metabase embedded (only Metabase, no Superset) | Single BI system |
| 15–18 | AI features, white-label, gamification, multi-branch | Unchanged |

---

## Part 11: Updated Environment Config [REVISED]

```bash
# .env

# Platform
DOMAIN=yourplatform.com
PLATFORM_NAME=CoachingOS
LOGO_URL=https://cdn.yourplatform.com/logo.png

# Gateway PostgreSQL (platform only — 3 tables)
DB_PASSWORD=your_strong_db_password

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_64_char_random_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret

# ERPNext + Education (MASTER IDENTITY — highest priority)
ERPNEXT_DB_ROOT_PASSWORD=erpnext_root_pass
ERPNEXT_ADMIN_PASSWORD=erpnext_admin_pass
ERPNEXT_API_KEY=                # from ERPNext Settings → API Access
ERPNEXT_API_SECRET=             # from ERPNext Settings → API Access

# Moodle (admin token ONLY — no student credentials)
MOODLE_DB_ROOT_PASSWORD=moodle_root_pass
MOODLE_DB_PASSWORD=moodle_db_pass
MOODLE_ADMIN_PASSWORD=moodle_admin_pass
MOODLE_ADMIN_TOKEN=             # from Moodle Site Admin → Web Services → Manage Tokens

# BigBlueButton
BBB_SERVER_DOMAIN=bbb.yourplatform.com
BBB_SECRET=                     # from: bbb-conf --secret

# ClickHouse
CLICKHOUSE_USER=coaching_analytics
CLICKHOUSE_PASSWORD=clickhouse_pass

# Metabase (only one BI system now)
METABASE_SECRET_KEY=            # 64-char random string

# Novu
NOVU_JWT_SECRET=                # 64-char random
NOVU_ENCRYPTION_KEY=            # 32-char random
NOVU_API_KEY=                   # from Novu dashboard after first boot

# MinIO
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key

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

# RFID Service
RFID_SERVICE_TOKEN=your_rfid_secret  # shared secret between rfid-service and gateway

# Observability
GRAFANA_PASSWORD=your_grafana_password
# Grafana is exposed at ops.yourplatform.com via Nginx — internal team only
```

---

## Summary: What Changed from v1 to v2

| Component | v1 | v2 |
|---|---|---|
| Student master record | Custom PostgreSQL `students` table | ERPNext `Student` doctype |
| Batch master record | Custom PostgreSQL `batches` table | ERPNext `Student Group` doctype |
| Test results | Custom PostgreSQL `attempts` table | ERPNext `Assessment Result` doctype |
| Attendance records | Custom PostgreSQL `attendance_logs` | ERPNext `Student Attendance` doctype |
| Fee schedules | Custom ERPNext calls + PostgreSQL | ERPNext `Fee Schedule` doctype (Education) |
| PostgreSQL purpose | Primary identity + platform | Platform only: 3 tables |
| Moodle credentials | Stored as `moodle_password_hash` | Never stored, never exists |
| Service calls | Synchronous chain: create → Moodle → ERPNext → Novu | ERPNext write → NATS event → workers async |
| BI systems | Metabase + Superset (both) | Metabase only |
| Education module | Ignored | First-class, installs on ERPNext |
| Failure isolation | One service failure = total request failure | One worker failure = retries, main request succeeds |
| Debugging | grep Docker logs manually | Grafana traces every event path |
| Live class white-label | CSS injection only | CSS injection (MVP) + LiveKit migration path (Phase 4) |
```
