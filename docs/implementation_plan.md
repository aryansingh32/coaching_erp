# CoachingOS v2.0 — Implementation Plan

> **Status**: Approved / Executing Phase 1
> **Scope**: Full platform build from greenfield — 8 cloned repos exist, zero custom code yet

---

## Current State

The workspace at `/home/unknown/Desktop/coaching_erp` contains **8 cloned open-source repositories**:

| Repo | Purpose in CoachingOS |
|------|----------------------|
| `bigbluebutton/` | Live class engine (separate VM, not containerized) |
| `clickhouse/` | Source repo — we use the Docker image directly |
| `education/` | Frappe Education module — installed INTO ERPNext |
| `erpnext/` | Master identity & domain model |
| `metabase/` | Embedded BI — we use the Docker image directly |
| `moodle/` | Headless LMS backend |
| `novu/` | Notification infrastructure — we use Docker images |
| `superset/` | **REMOVED in v2.0** — kept on disk for reference only |

**No custom code exists yet.** We need to create:
- `infra/` — Docker Compose, Nginx, init scripts, observability configs
- `gateway/` — NestJS modular monolith (REST API)
- `workers/` — 3 NATS worker microservices
- `web/` — Next.js admin panel
- `rfid-service/` — RFID punch receiver
- `.env.example` — Environment template

---

> [!IMPORTANT]
> ## Document Truncation Notice
> The user's architecture document was truncated at ~94KB, cutting off mid-way through Part 4 (ERPNext Education Adapter, at `recordFeePayment`). The following sections are likely missing:
> - Remaining adapter methods (Course Schedule, Fee queries)
> - Part 5+: NestJS Gateway module structure & route definitions
> - Part 6+: Worker microservice implementations
> - Part 7+: Next.js frontend architecture
> - Part 8+: Full Education doctype mapping table
> - Part 9+: Deployment phases / migration strategy
> - ClickHouse analytics schema details
> - Nginx configuration specifics
> - RFID service implementation
>
> **I will implement everything provided and flag gaps. The user should share the remaining sections.**

---

## Proposed Directory Structure

```
coaching_erp/
├── infra/                              # Infrastructure configs
│   ├── docker-compose.yml              # All services
│   ├── .env.example                    # Environment template
│   ├── nginx/
│   │   ├── nginx.conf                  # Main config
│   │   └── conf.d/
│   │       └── default.conf            # Upstream routing
│   ├── ssl/                            # SSL certs (gitignored)
│   ├── scripts/
│   │   ├── init-postgres.sql           # 3 tables only
│   │   ├── init-clickhouse.sql         # Analytics schema
│   │   └── erpnext-setup.sh            # Education module setup
│   ├── clickhouse-config.xml           # ClickHouse limits
│   ├── mosquitto.conf                  # MQTT config
│   ├── metabase-plugins/               # ClickHouse driver JAR
│   └── observability/
│       ├── prometheus.yml              # Scrape targets
│       ├── alerts.yml                  # Alert rules
│       ├── grafana/
│       │   ├── dashboards/             # Pre-built dashboards
│       │   └── datasources/            # Auto-provisioned sources
│       ├── loki-config.yaml
│       ├── promtail-config.yaml
│       ├── tempo-config.yaml
│       └── otel-collector.yaml
│
├── gateway/                            # NestJS Modular Monolith
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/                     # Shared utilities
│       │   ├── decorators/
│       │   ├── guards/
│       │   ├── interceptors/
│       │   ├── filters/
│       │   └── pipes/
│       ├── config/                     # Config module
│       ├── adapters/                   # External service adapters
│       │   ├── erpnext/
│       │   │   └── education.adapter.ts
│       │   ├── moodle/
│       │   │   └── moodle.adapter.ts
│       │   ├── bbb/
│       │   │   └── bbb.adapter.ts
│       │   ├── minio/
│       │   │   └── minio.adapter.ts
│       │   └── metabase/
│       │       └── metabase.adapter.ts
│       ├── events/                     # NATS event bus
│       │   ├── events.module.ts
│       │   ├── nats.service.ts
│       │   └── event-types.ts
│       ├── auth/                       # Auth module
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   └── dto/
│       ├── students/                   # Student module
│       ├── batches/                    # Batch module
│       ├── attendance/                 # Attendance module
│       ├── fees/                       # Fees module
│       ├── lms/                        # LMS module (Moodle proxy)
│       ├── assessments/                # Tests/exams module
│       ├── live-class/                 # BBB/LiveKit adapter
│       ├── analytics/                  # Analytics module
│       ├── crm/                        # CRM/admissions
│       └── institutes/                 # Multi-tenant config
│
├── workers/                            # NATS Worker Microservices
│   ├── moodle-worker/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   ├── novu-worker/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   └── analytics-worker/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│
├── web/                                # Next.js Admin Panel
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── rfid-service/                       # RFID Punch Receiver
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── bigbluebutton/                      # (existing clone — reference)
├── clickhouse/                         # (existing clone — reference)
├── education/                          # (existing clone — installed into ERPNext)
├── erpnext/                            # (existing clone — reference)
├── metabase/                           # (existing clone — reference)
├── moodle/                             # (existing clone — reference)
├── novu/                               # (existing clone — reference)
└── superset/                           # (existing clone — NOT deployed)
```

---

## Phase 1: Infrastructure Foundation

> **Goal**: Get all services running in Docker with correct networking, health checks, and init scripts. No custom application code yet — just infrastructure.

### 1.1 Docker Compose & Environment

#### [NEW] [docker-compose.yml](file:///home/unknown/Desktop/coaching_erp/infra/docker-compose.yml)
Full docker-compose with all 25+ services as specified in the architecture document (Part 3.2). Services include:
- **Core**: nginx, gateway, web
- **Data**: postgres (3 tables), redis, clickhouse, minio
- **Domain**: erpnext + erpnext-db, moodle + moodle-db
- **Event Bus**: nats (JetStream)
- **Workers**: moodle-worker, novu-worker, analytics-worker
- **Notifications**: novu-api, novu-mongo
- **BI**: metabase (no superset)
- **IoT**: rfid-service, mosquitto
- **Observability**: prometheus, grafana, loki, promtail, tempo, otel-collector

#### [NEW] [.env.example](file:///home/unknown/Desktop/coaching_erp/infra/.env.example)
Template with all required environment variables, grouped by service.

---

### 1.2 PostgreSQL Init (3 Tables Only)

#### [NEW] [init-postgres.sql](file:///home/unknown/Desktop/coaching_erp/infra/scripts/init-postgres.sql)
Exactly 3 tables as specified:
```sql
-- institutes: tenant/institute config
-- rfid_cards: RFID card → ERPNext Student mapping
-- jwt_refresh_tokens: JWT refresh token storage
-- Also creates metabase DB for Metabase's internal storage
```

---

### 1.3 ClickHouse Analytics Schema

#### [NEW] [init-clickhouse.sql](file:///home/unknown/Desktop/coaching_erp/infra/scripts/init-clickhouse.sql)
Analytics event tables:
- `events` — generic event log (MergeTree, partitioned by month)
- `attendance_events` — RFID punches and manual attendance
- `fee_events` — payment lifecycle events
- `lms_events` — content views, quiz attempts, completion
- `class_events` — live class joins, duration, recording
- `test_events` — assessment submissions and results

Materialized views for common dashboards:
- Daily attendance summary per batch
- Monthly revenue per institute
- Student engagement scores

---

### 1.4 Nginx Configuration

#### [NEW] [nginx.conf](file:///home/unknown/Desktop/coaching_erp/infra/nginx/nginx.conf)
Main config with:
- SSL termination
- HTTP → HTTPS redirect
- Gzip compression
- Security headers

#### [NEW] [default.conf](file:///home/unknown/Desktop/coaching_erp/infra/nginx/conf.d/default.conf)
Upstream routing:
- `api.yourplatform.com` → `gateway:3000`
- `app.yourplatform.com` → `web:3001`
- `{slug}.yourplatform.com` → `web:3001` (tenant subdomain)
- `ops.yourplatform.com` → `grafana:3000` (internal ops, IP-restricted)

---

### 1.5 Observability Stack Configs

#### [NEW] [prometheus.yml](file:///home/unknown/Desktop/coaching_erp/infra/observability/prometheus.yml)
Scrape configs for all services exposing metrics.

#### [NEW] [alerts.yml](file:///home/unknown/Desktop/coaching_erp/infra/observability/alerts.yml)
Pre-built alert rules:
- NATS queue depth > 500 for > 5min
- ERPNext API error rate > 5% for > 2min
- Moodle P99 response time > 10s
- ClickHouse insert lag > 30s

#### [NEW] Grafana provisioning (dashboards + datasources)
Auto-provision Prometheus, Loki, and Tempo as data sources.

#### [NEW] [loki-config.yaml](file:///home/unknown/Desktop/coaching_erp/infra/observability/loki-config.yaml), [promtail-config.yaml](file:///home/unknown/Desktop/coaching_erp/infra/observability/promtail-config.yaml), [tempo-config.yaml](file:///home/unknown/Desktop/coaching_erp/infra/observability/tempo-config.yaml), [otel-collector.yaml](file:///home/unknown/Desktop/coaching_erp/infra/observability/otel-collector.yaml)
Standard configs for log collection, distributed tracing, and OpenTelemetry pipeline.

---

### 1.6 ERPNext + Education Setup

#### [NEW] [erpnext-setup.sh](file:///home/unknown/Desktop/coaching_erp/infra/scripts/erpnext-setup.sh)
One-time setup script:
1. Create site `erp.coaching-internal`
2. Install apps: erpnext → hrms → education
3. Enable CORS for gateway access
4. Add custom fields (moodle_user_id, fcm_token, novu_subscriber_id, rank, percentile)
5. Create API user for gateway

---

### 1.7 Supporting Configs

#### [NEW] [mosquitto.conf](file:///home/unknown/Desktop/coaching_erp/infra/mosquitto.conf)
MQTT broker for RFID hardware readers.

#### [NEW] [clickhouse-config.xml](file:///home/unknown/Desktop/coaching_erp/infra/clickhouse-config.xml)
ClickHouse resource limits.

---

## Phase 2: NestJS Gateway — Modular Monolith

> **Goal**: Build the REST API gateway with strict module boundaries. Every module communicates only through the event bus interface, never by importing another module's services.

### 2.1 Project Scaffolding

#### [NEW] [gateway/](file:///home/unknown/Desktop/coaching_erp/gateway/)
- NestJS 10 with TypeScript strict mode
- Dependencies: `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `nats` (client), `axios`, `ioredis`, `pg`, `class-validator`, `class-transformer`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`
- `Dockerfile`: multi-stage build (node:20-alpine)

### 2.2 Core Infrastructure Modules

#### Config Module
- Typed configuration with validation via `@nestjs/config` + Joi schema
- All env vars validated at startup — fail-fast if missing

#### Event Bus Module (`events/`)
- `NatsService` — wraps NATS JetStream client
- `EventTypes` — typed enum of all event subjects
- Publish method: `publish(subject: string, payload: object)`
- Subscribe method for workers: `subscribe(stream: string, consumer: string, handler: Function)`
- Retry with exponential backoff built-in

#### Database Module
- TypeORM or Prisma connected to PostgreSQL
- Only 3 entities: `Institute`, `RfidCard`, `JwtRefreshToken`

---

### 2.3 External Service Adapters

#### [NEW] ERPNext Education Adapter (`adapters/erpnext/education.adapter.ts`)
Full implementation as specified in Part 4.3:
- CRUD for Student, Guardian, Instructor
- Batch (Student Group) management
- Program Enrollment
- Assessment Plan / Result
- Student Attendance
- Fee Structure / Schedule / Payment Entry
- Uses Frappe REST API with API key auth

#### [NEW] Moodle Adapter (`adapters/moodle/moodle.adapter.ts`)
Admin-token-only operations:
- `createUser()` — create Moodle user for new student (no password)
- `enrollUserInCourse()` — enroll via admin API
- `getCourseContents()` — fetch course materials
- `getUserGrades()` — fetch grades with admin token + userid override
- **No per-student credentials.** One `MOODLE_ADMIN_TOKEN` for all operations.

#### [NEW] BBB Adapter (`adapters/bbb/bbb.adapter.ts`)
Interface-based design (swappable with LiveKit in Phase 4):
```typescript
interface LiveClassAdapter {
  createMeeting(params: CreateMeetingDto): Promise<MeetingInfo>;
  getJoinUrl(meetingId: string, userName: string, role: Role): string;
  endMeeting(meetingId: string): Promise<void>;
  getRecordings(meetingId: string): Promise<Recording[]>;
}
```

#### [NEW] MinIO Adapter, Metabase Adapter
Standard wrappers for file storage and embedded BI.

---

### 2.4 Domain Modules

Each module follows the same structure:
```
module-name/
  ├── module-name.module.ts      # NestJS module declaration
  ├── module-name.controller.ts  # REST endpoints
  ├── module-name.service.ts     # Business logic
  ├── dto/                       # Request/Response DTOs
  └── interfaces/                # TypeScript interfaces
```

**Critical rule**: No module imports another module's service. Cross-module communication goes through NATS events only.

#### Auth Module
- OTP-based login (phone → Redis OTP → verify → JWT)
- JWT access + refresh tokens
- Role-based guards: `student`, `instructor`, `admin`, `super_admin`
- Refresh token rotation stored in PostgreSQL `jwt_refresh_tokens`

#### Students Module
- `POST /students` — creates student in ERPNext Education → publishes `student.created`
- `GET /students/:id` — reads from ERPNext
- `PUT /students/:id` — updates ERPNext → publishes `student.updated`
- `GET /students` — list with filters, pagination (ERPNext API)

#### Batches Module
- `POST /batches` — creates Student Group in ERPNext → publishes `batch.created`
- `POST /batches/:id/enroll` — adds student to batch → publishes `batch.enrollment.added`
- `GET /batches/:id/students` — list enrolled students
- `GET /batches/:id/schedule` — timetable from Course Schedule

#### Attendance Module
- `POST /attendance/rfid` — receives RFID punch, looks up `rfid_cards` table, publishes `attendance.rfid_punch`
- `POST /attendance/manual` — manual mark, publishes `attendance.manual`
- `GET /attendance/batch/:id/date/:date` — batch attendance report
- Workers handle: ERPNext Student Attendance creation, Novu parent notification, ClickHouse event

#### Fees Module
- `POST /fees/structure` — create Fee Structure in ERPNext
- `POST /fees/schedule` — generate Fee Schedule per student
- `POST /fees/payment/initiate` — create Razorpay order
- `POST /fees/payment/webhook` — Razorpay webhook → publishes `fee.payment.confirmed`
- `GET /fees/student/:id` — fee status per student

#### Assessments Module
- `POST /assessments/plan` — create Assessment Plan
- `POST /assessments/results` — bulk save results → publishes `test.submitted`
- `GET /assessments/student/:id` — student's test history

#### LMS Module
- `GET /lms/courses` — proxy to Moodle via admin token
- `GET /lms/courses/:id/content` — course content
- `POST /lms/content/upload` — upload to MinIO → publishes `content.uploaded`

#### Live Class Module
- `POST /classes/schedule` — schedule class → publishes `class.scheduled`
- `GET /classes/:id/join` — returns BBB join URL (CSS-injected)
- `GET /classes/recordings` — list recordings

#### Institutes Module
- `POST /institutes` — create tenant (PostgreSQL)
- `GET /institutes/:slug` — tenant config
- `PUT /institutes/:slug/branding` — update branding

#### CRM Module
- `POST /crm/leads` — create Student Admission in ERPNext
- `PUT /crm/leads/:id/convert` — convert lead → Student

#### Analytics Module
- `GET /analytics/dashboard/:type` — returns Metabase signed embed URL
- Types: `student-performance`, `batch-attendance`, `revenue`, `engagement`

---

## Phase 3: NATS Worker Microservices

> **Goal**: Build 3 independent NestJS microservices that subscribe to NATS JetStream streams and handle side effects.

### 3.1 Moodle Worker (`workers/moodle-worker/`)

Subscribes to:
- `student.created` → create Moodle user (no password), update ERPNext `custom_moodle_user_id`
- `batch.created` → create Moodle course category
- `batch.enrollment.added` → enroll user in Moodle course
- `content.uploaded` → create Moodle resource from MinIO URL
- `test.submitted` → sync grades to Moodle gradebook

Retry: exponential backoff, max 24 hours, dead-letter after exhaustion.

### 3.2 Novu Worker (`workers/novu-worker/`)

Subscribes to:
- `student.created` → create Novu subscriber, send welcome WhatsApp
- `attendance.rfid_punch` → send parent notification ("Child arrived at 9:02 AM")
- `fee.payment.confirmed` → send receipt via WhatsApp
- `test.submitted` → send score notification to student + parent
- `class.scheduled` → send class reminder 30min before

### 3.3 Analytics Worker (`workers/analytics-worker/`)

Subscribes to: **ALL streams**
- Writes every event to the appropriate ClickHouse table
- Handles batching (accumulate events, flush every 5s or 100 events)
- Deduplication via event ID

---

## Phase 4: Next.js Admin Panel

> **Goal**: Build the tenant-aware admin dashboard with embedded Metabase charts.

### 4.1 Project Setup
- Next.js 14 (App Router) with TypeScript
- Styling: Vanilla CSS with CSS custom properties design system
- Auth: JWT stored in httpOnly cookies
- Multi-tenant: subdomain-based routing (`{slug}.yourplatform.com`)

### 4.2 Pages
- `/login` — OTP-based auth
- `/dashboard` — overview with embedded Metabase charts
- `/students` — CRUD, search, filters
- `/students/:id` — profile with attendance, fees, test history
- `/batches` — batch management
- `/batches/:id` — batch detail with enrolled students, timetable
- `/attendance` — daily attendance view, RFID status
- `/fees` — fee management, payment tracking
- `/assessments` — test scheduling, result entry
- `/classes` — live class scheduling, recording viewer
- `/settings` — institute branding, configuration

> [!NOTE]
> Detailed frontend component architecture depends on the truncated sections of the architecture document. I'll build a premium, modern design system with dark mode, glassmorphism, and micro-animations as outlined in the web development guidelines.

---

## Phase 5: RFID Service

> **Goal**: Lightweight Node.js service that receives MQTT punches from hardware readers and forwards to the gateway.

#### [NEW] [rfid-service/](file:///home/unknown/Desktop/coaching_erp/rfid-service/)
- Subscribes to MQTT topic `rfid/punch/{reader_id}`
- Validates card UID
- Calls gateway `POST /attendance/rfid`
- Handles offline buffering (stores punches if gateway is unreachable)

---

## Phase 6: Verification & Polish

### Automated Tests
- Gateway: Unit tests for each service, integration tests for adapters
- Workers: Unit tests for event handlers
- E2E: Full flow tests (create student → verify in ERPNext → verify Moodle user → verify Novu subscriber)

### Manual Verification
```bash
# 1. Start all services
cd infra && docker compose up -d

# 2. Run ERPNext setup
./scripts/erpnext-setup.sh

# 3. Verify services are healthy
docker compose ps

# 4. Test gateway endpoints
curl -X POST http://localhost:3000/auth/otp/send -d '{"phone": "+919999999999"}'

# 5. Verify NATS streams
docker exec nats nats stream ls

# 6. Check Grafana dashboards
open http://localhost:3000 (grafana)

# 7. Check Metabase
open http://localhost:3000 (metabase)
```

### Build Verification
```bash
# Gateway builds
cd gateway && npm run build

# Workers build
cd workers/moodle-worker && npm run build
cd workers/novu-worker && npm run build
cd workers/analytics-worker && npm run build

# Web builds
cd web && npm run build
```

---

## Execution Order

Given the massive scope, I recommend building in this order:

| Step | What | Why First |
|------|------|-----------|
| 1 | `infra/` — Docker Compose + all configs | Everything depends on infrastructure |
| 2 | `gateway/` — Scaffolding + Config + EventBus + Auth | Core API needed before any module |
| 3 | `gateway/` — ERPNext Education adapter | Master identity adapter needed by all modules |
| 4 | `gateway/` — Student + Batch + Attendance modules | Core domain, validates the architecture |
| 5 | `workers/` — All 3 workers | Completes the event-driven flow |
| 6 | `gateway/` — Fees + Assessments + LMS + LiveClass | Remaining domain modules |
| 7 | `rfid-service/` | IoT integration |
| 8 | `web/` — Next.js admin panel | Frontend last (depends on stable API) |
| 9 | Verification & E2E tests | Validate everything works end-to-end |
