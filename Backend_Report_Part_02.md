
# Backend Complete Architecture Report (Volume 2)

## Database Analysis

### ERPNext (MariaDB)
- **Tables**: ~800+ tables (tabStudent, tabUser, tabFee Schedule).
- **Relationships**: tabStudent linked to tabUser via `user_id`.
- **Flow**: ERPNext serves as the master. Updates trigger Webhooks/Events consumed by the Gateway.

### ClickHouse (Analytics DB)
- **Tables**: `attendance_events`, `login_metrics`, `assessment_scores`.
- **Materialized Views**: `daily_attendance_mv` aggregating raw events into daily rollups.
- **Indexes**: Primary key on `(tenant_id, timestamp)` for massive time-series scale.

## API Analysis (1000+ Endpoints Aggregation)
*Note: Due to the scale of ~1000 APIs, this is aggregated by bounded contexts.*

### 1. Gateway Routing (e.g., `GET /api/v1/health`)
- **Controller**: HealthController.
- **Side Effects**: Pings Redis, ERPNext, Moodle DB connections.

### 2. ERPNext Endpoints (`GET /api/resource/Student`)
- **Auth**: Token `{API_KEY}:{API_SECRET}`
- **Response DTO**: Frappe standard `{"data": [...]}`
- **Rate Limiting**: Managed by Frappe `SiteConfig`.

### 3. Moodle Web Services (`core_course_get_courses`)
- **Params**: `wstoken`, `moodlewsrestformat=json`
- **Response**: Array of Course objects.

## Authentication & Authorization
- **JWT Flow**: Gateway uses symmetric/asymmetric keys to validate tokens. Tokens contain `role`, `tenant_id`, `user_id`.
- **Multi-tenancy**: Implemented via Frappe Sites for ERPNext, and row-level security (tenant_id) in ClickHouse.

## Events (Message Broker)
- **BullMQ/NATS**: Used for decoupling. E.g., when a Student pays fees in ERPNext, a webhook is fired to the Gateway -> Gateway emits `FEE_PAID` event -> Novu Worker consumes and sends SMS/Email.

---
[Back to Master Index](./Reverse_Engineering_Master_Index.md)
