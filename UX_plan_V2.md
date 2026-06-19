# CoachingOS — UI/UX Plan v2 (Codebase-Grounded Revision)
## Reconciled Against Real Codebase Audit + 33 Actual BFF Endpoints

> This document supersedes the v1 UI/UX plan. Every decision is grounded in the actual
> `coaching_erp` directory structure and the 33 endpoints confirmed live in
> `gateway/src/modules`. Features referencing endpoints that do not yet exist are
> explicitly marked **[NEEDS ENDPOINT]** so they can be queued as gateway extensions.

---

## What Changed from v1 and Why

| v1 Plan Decision | Reality Found in Codebase | v2 Correction |
|---|---|---|
| Super Admin as separate Next.js deployment | One `web/` Next.js app exists, currently boilerplate | ONE unified Next.js app, route groups segment roles |
| 100+ screen→API mappings | Gateway exposes exactly 33 real endpoints | All screens remapped to these 33 only |
| Custom notification bell from scratch | `novu/apps/dashboard` exists; `@novu/notification-center` is the correct component | Use Novu React component, not custom build |
| BBB described as "CSS injection" | `bigbluebutton/` contains full Meteor/React HTML5 client | Wrap the real BBB HTML5 client in Next.js layout overlay |
| Education module "barely mentioned" | `education/frontend/` is a live Vue 3 app with real components | Explicit deprecation + component-by-component migration plan |
| Separate teacher/parent/student apps | Decision was already one app | Confirmed: one Expo app, role-switched via JWT |

---

## Part 1: True Architecture — Unified Next.js Monorepo

The `web/` directory currently contains a **raw Next.js App Router boilerplate**. It becomes the single home for all four portals using Next.js Route Groups. No second Next.js deployment anywhere.

```
web/app/
│
├── (auth)/                          ← Shared login across all roles
│   ├── layout.tsx                   ← Centered, institute-branded login shell
│   ├── login/page.tsx               ← Phone input + institute slug
│   └── verify/page.tsx              ← OTP 6-box entry screen
│
├── (super-admin)/                   ← Platform staff only
│   ├── layout.tsx                   ← Dark shell, separate JWT check
│   ├── dashboard/page.tsx
│   ├── tenants/
│   │   ├── page.tsx                 ← List all institutes
│   │   └── [id]/page.tsx            ← Tenant detail + feature flags
│   ├── analytics/page.tsx
│   └── health/page.tsx
│
├── (institute)/                     ← Coaching institute admin + staff
│   ├── layout.tsx                   ← Light shell, branding-aware
│   ├── dashboard/page.tsx
│   ├── students/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── import/page.tsx
│   │   └── [erpId]/page.tsx
│   ├── batches/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── attendance/
│   │   ├── page.tsx                 ← Rebuilt from education/frontend/Attendance.vue
│   │   └── reports/page.tsx
│   ├── fees/
│   │   ├── page.tsx                 ← Rebuilt from education/frontend/Fees.vue
│   │   └── [studentId]/page.tsx
│   ├── schedule/page.tsx            ← Rebuilt from education/frontend/Schedule.vue
│   ├── analytics/page.tsx
│   └── settings/page.tsx
│
├── (learn)/                         ← Student web portal
│   ├── layout.tsx                   ← Student shell, dark-mode default
│   ├── home/page.tsx
│   ├── courses/
│   │   ├── page.tsx
│   │   └── [batchId]/page.tsx
│   ├── tests/page.tsx               ← [NEEDS ENDPOINT]
│   ├── fees/page.tsx
│   ├── timeline/page.tsx            ← Uses /students/:erpId/timeline
│   └── profile/page.tsx
│
└── (teach)/                         ← Teacher web portal
    ├── layout.tsx
    ├── home/page.tsx
    ├── attendance/page.tsx          ← Quick attendance-taking page
    └── batches/[id]/page.tsx
```

**Why one app, not four deployments:**
80% of the component tree is shared — `<DataTable>`, `<ProgressRing>`, `<StatCard>`, `<AuthShell>`. Splitting into separate deployments would immediately duplicate this shared code, create four separate CI pipelines, and make a global design token change a four-repo operation. Route groups give full layout isolation at zero infrastructure cost.

---

## Part 2: Codebase Deprecation Map

The audit identified active UIs in the repository that must be migrated to Next.js and then decommissioned. This is the exact component-by-component migration plan.

### 2.1 `education/frontend/` — Vue 3 SPA (Vite) → DEPRECATE

This app currently lives alongside the Next.js target. Once its Next.js counterparts are shipped and verified, the entire directory is removed.

| Vue Component | Deprecation Target | Next.js Destination | BFF Endpoint |
|---|---|---|---|
| `Attendance.vue` | Day 1 of Phase 3 | `(institute)/attendance/page.tsx` + `(teach)/attendance/page.tsx` | `POST /attendance/manual`, `GET /attendance/reports` |
| `Fees.vue` | Day 1 of Phase 3 | `(institute)/fees/page.tsx` | `GET /fees/pending/:studentId`, `POST /fees/schedule`, `POST /fees/payment` |
| `Grades.vue` | Day 1 of Phase 3 | `(learn)/courses/[batchId]/page.tsx` (grades tab) | `GET /batches/:id` (grades embedded) / **[NEEDS ENDPOINT]** for grade detail |
| `Schedule.vue` | Day 1 of Phase 3 | `(institute)/schedule/page.tsx` | `POST /batches/:id/schedule`, `GET /batches/:id` |

**Deprecation process for each:**
1. Ship the Next.js version and verify feature parity against the Vue component.
2. Add a redirect at the Vue route pointing to the new Next.js URL.
3. Remove the Vue file and its imports from `education/frontend/`.
4. After all four are gone, delete the `education/frontend/` directory and remove it from the monorepo workspace config.

### 2.2 `erpnext/` — Frappe Desk → HEADLESS (no deprecation needed, just block)

Frappe Desk is never shown to end users. No migration of UI components required. The Nginx config must block `/erpnext` from external access, which is already part of the v3 architecture.

### 2.3 `moodle/` — PHP Mustache Templates → HEADLESS

Same as ERPNext. Moodle's PHP-rendered pages are never exposed. Content delivery is handled via Moodle Web Services through the gateway. Block in Nginx.

### 2.4 `bigbluebutton/` — Meteor/React HTML5 Client → WRAP, NOT REPLACE

The BBB HTML5 client at `bigbluebutton/bigbluebutton-html5/` is a complete, production-grade WebRTC application. The correct approach is NOT to rewrite it — that would take 18 months. Instead:

```
Student taps "Join Class"
      ↓
(learn)/live-class/[meetingId]/page.tsx
      ↓
Custom Next.js layout:
  ┌─────────────────────────────────────────┐
  │  [Institute Logo]  Physics — Optics     │  ← YOUR header (React)
  │                    Mr. Arvind  |  Leave  │
  ├─────────────────────────────────────────┤
  │                                         │
  │   <iframe                               │
  │     src={bbbJoinUrl}                    │
  │     style="border:none; flex:1"         │  ← BBB HTML5 client renders here
  │   />                                    │
  │                                         │
  └─────────────────────────────────────────┘
  ← Custom doubt chat overlay (absolutely positioned) →
```

The `bbbJoinUrl` is fetched from the gateway. It already contains the correct password and user identity. The BBB client renders entirely in the iframe. Your custom header sits on top in the Next.js layout. Injected CSS (via `userdata_bbb_custom_style_url` BBB parameter) hides the BBB top bar and branding inside the iframe.

This requires **[NEEDS ENDPOINT]**: `POST /live-class/:batchId/create` and `POST /live-class/:id/join` on the gateway.

### 2.5 `novu/apps/dashboard` — React App → INTERNAL ONLY

Novu's own dashboard is kept running internally for super admins to manage notification templates and channels. It is never exposed to students or teachers.

For the student/teacher notification bell in the Next.js app, use the official Novu React SDK:

```tsx
// web/app/(institute)/layout.tsx — topbar notification bell
import { NovuProvider, PopoverNotificationCenter, NotificationBell } from '@novu/notification-center';

function TopBar() {
  const { user } = useAuth();
  return (
    <NovuProvider
      subscriberId={user.erpStudentName}
      applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_ID}
    >
      <PopoverNotificationCenter colorScheme="light">
        {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
      </PopoverNotificationCenter>
    </NovuProvider>
  );
}
```

This replaces any custom notification polling. The bell, popover, and unread count are all handled by `@novu/notification-center`. Install: `npm install @novu/notification-center`.

---

## Part 3: The 33 Endpoints — Complete Screen Binding

This is the definitive, authoritative mapping. Every Next.js page and React Native screen lists only the real gateway endpoints it calls. Features marked **[NEEDS ENDPOINT]** require a new route to be added to the NestJS gateway before that screen can be built.

### 3.1 Authentication Screens (all portals)

```
SCREEN: (auth)/login/page.tsx
PURPOSE: Institute slug entry + phone number
APIs:
  — no API call at this step (local validation only)
  — on submit: redirects to /auth/verify with slug + phone in state

SCREEN: (auth)/verify/page.tsx
PURPOSE: 6-digit OTP entry
APIs:
  POST /api/v1/auth/send-otp      → triggered on load (or by user action)
  POST /api/v1/auth/verify-otp    → on OTP submit
    Response includes: { accessToken, refreshToken, role, erpId, instituteId, branding }
    role determines which route group the user is redirected into:
      'super-admin' → /(super-admin)/dashboard
      'admin'       → /(institute)/dashboard
      'instructor'  → /(teach)/home
      'student'     → /(learn)/home
      'parent'      → /(learn)/home (parent-filtered view)

TOKEN REFRESH:
  POST /api/v1/auth/refresh        → silent background call in api-client.ts interceptor
  POST /api/v1/auth/logout         → on explicit logout action
```

### 3.2 Super Admin Portal — `(super-admin)/`

```
SCREEN: dashboard/page.tsx
┌─────────────────────────────────────────────────────────────────┐
│ Platform Overview           [All time ▾]          ↻ 30s refresh │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  147         │  84,203      │  ₹42.8L MRR  │  2 Down            │
│  Institutes  │  Students    │              │  Services          │
└──────────────┴──────────────┴──────────────┴────────────────────┘
[Recent tenants table] [System service status grid]
APIS:
  GET /api/v1/analytics/kpis           → KPI cards (students, institutes, MRR)
  GET /api/v1/health/ready             → service status grid
  GET /api/v1/tenants                  → recent tenants table (paginated)

SCREEN: tenants/page.tsx
[Full tenant table: name, plan, students, status, MRR | search + filter]
[+ New Institute button → opens drawer → POST /tenants]
APIS:
  GET /api/v1/tenants                  → full paginated list
  POST /api/v1/tenants                 → provision new institute

SCREEN: tenants/[id]/page.tsx
[Tenant detail: branding preview, feature flags, usage stats, suspend button]
APIS:
  GET /api/v1/tenants/:id              → tenant detail + feature flags
  PUT /api/v1/tenants/:id             → update plan, branding, feature flags
  DELETE /api/v1/tenants/:id          → deactivate tenant

SCREEN: analytics/page.tsx
[Platform-wide ClickHouse charts via gateway proxy]
APIS:
  GET /api/v1/analytics/kpis           → top-level numbers
  GET /api/v1/analytics/dashboard/0    → platform-level dashboard (id=0 = super admin view)

SCREEN: health/page.tsx
[Service grid: gateway, erpnext, moodle, clickhouse, nats, redis — each with uptime %]
APIS:
  GET /api/v1/health                   → liveness
  GET /api/v1/health/ready             → all dependency checks
```

### 3.3 Institute Admin Portal — `(institute)/`

```
SCREEN: dashboard/page.tsx
┌─────────────────────────────────────────────────────────────────┐
│ Good morning, Rajesh     Thu Jun 19                  [🔔 Novu] │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  247/312     │  ₹84,000     │  2 Live      │  3 Tests          │
│  Present     │  Fee Today   │  Classes     │  Scheduled        │
└──────────────┴──────────────┴──────────────┴────────────────────┘
[Batch performance table]  [RFID live feed via WebSocket]
[Fee alert list]
APIS:
  GET /api/v1/analytics/dashboard/:id  → institute KPIs (id = institute tenant id)
  GET /api/v1/students                 → total count (for KPI card)
  GET /api/v1/batches                  → batch performance data
  GET /api/v1/attendance/reports       → today's attendance summary
  GET /api/v1/fees/pending/:studentId  → overdue fee alerts (looped per flagged student)
  WebSocket → attendance live feed     → [NEEDS ENDPOINT: GET /attendance/live-stream]

SCREEN: students/page.tsx   [Replaces/extends nothing in Vue — new screen]
[Paginated student table + search + filters]
[Each row: ProgressRing (attendance%), student name, batch, fee status]
[Actions: View, Edit, Assign RFID, Send Message]
APIS:
  GET /api/v1/students                 → paginated list (query params: search, batch, status)
  POST /api/v1/students/:erpId/rfid-card → RFID assignment from row action

SCREEN: students/new/page.tsx
[Form: name, phone, parent phone, DOB, batch selection]
APIS:
  POST /api/v1/students                → creates student in ERPNext → triggers NATS events
  GET /api/v1/batches                  → populate batch dropdown

SCREEN: students/import/page.tsx
[CSV upload zone + column mapping + progress indicator]
APIS:
  POST /api/v1/students/bulk-import    → BullMQ job; returns jobId
  [NEEDS ENDPOINT: GET /students/import-jobs/:jobId] → poll import progress

SCREEN: students/[erpId]/page.tsx
[Profile: info, attendance ring, fee status, activity timeline tabs]
APIS:
  GET /api/v1/students/:erpId          → profile + active batches
  GET /api/v1/students/:erpId/timeline → activity feed tab
  GET /api/v1/fees/pending/:studentId  → fees tab
  GET /api/v1/attendance/reports       → attendance tab (filtered by student)
  PUT /api/v1/students/:erpId          → edit profile

SCREEN: batches/page.tsx
[Batch cards: name, enrolled count, progress ring, capacity bar]
APIS:
  GET /api/v1/batches                  → batch list

SCREEN: batches/[id]/page.tsx
[Batch detail: enrolled students, schedule, instructor assignments]
TABS: Students | Schedule | Instructors | Analytics
APIS:
  GET /api/v1/batches/:id              → batch detail + enrolled students + Moodle course ID
  POST /api/v1/batches/:id/enroll      → enroll student drawer
  POST /api/v1/batches/:id/schedule    → add class to calendar
  POST /api/v1/batches/:id/instructors → assign teacher

SCREEN: attendance/page.tsx  [Replaces education/frontend/Attendance.vue]
[Batch selector → today's list: present/absent/not-marked]
[RFID live feed panel (right side)]
[Bulk "Notify absent parents" button]
APIS:
  GET /api/v1/attendance/reports       → today's attendance by batch
  POST /api/v1/attendance/manual       → manual mark from this screen
  [NEEDS ENDPOINT: GET /attendance/live-stream (WebSocket)] → RFID feed

SCREEN: attendance/reports/page.tsx
[Month-view calendar heatmap per batch + student-level drill-down]
APIS:
  GET /api/v1/attendance/reports       → with { batchId, month, year } query params

SCREEN: fees/page.tsx  [Replaces education/frontend/Fees.vue]
[Tab: All | Due This Week | Overdue | Paid This Month]
[Each row: student + amount + due date + WhatsApp button + collect button]
APIS:
  GET /api/v1/fees/pending/:studentId  → per-student pending (rendered in list)
  POST /api/v1/fees/schedule           → generate fee schedule for a batch
  POST /api/v1/fees/payment            → collect payment → returns Razorpay order ID
  POST /api/v1/fees/webhook/razorpay   → [handled server-side, not client-called]

SCREEN: schedule/page.tsx  [Replaces education/frontend/Schedule.vue]
[Weekly calendar view: batch name + subject + room + teacher per slot]
APIS:
  GET /api/v1/batches                  → all batches with schedules embedded
  GET /api/v1/batches/:id              → individual batch schedule
  POST /api/v1/batches/:id/schedule    → add / edit a class slot

SCREEN: analytics/page.tsx
[Institute-specific analytics: attendance trend, fee collection, batch performance]
[Metabase embedded charts in styled iframes]
APIS:
  GET /api/v1/analytics/dashboard/:id  → institute dashboard data
  GET /api/v1/analytics/kpis           → filtered to this institute

SCREEN: settings/page.tsx
[Branding: logo, primary color, app name | Staff: role assignments | RFID: device list]
APIS:
  GET /api/v1/tenants/:id              → current tenant config
  PUT /api/v1/tenants/:id             → save branding / settings
```

### 3.4 Student Web Portal — `(learn)/`

```
SCREEN: home/page.tsx
[Streak banner + ProgressRings + next class countdown + continue learning card]
[Today's schedule list + pending actions (fee due, test tomorrow)]
APIS:
  GET /api/v1/students/:erpId          → name, active batches, moodle progress embedded
  GET /api/v1/batches/:id              → today's schedule (per enrolled batch)
  GET /api/v1/fees/pending/:studentId  → fee due alert
  GET /api/v1/attendance/reports       → own attendance % (for ring)

SCREEN: courses/page.tsx
[Batch course cards: title, ProgressRing (completion%), teacher name, chapter count]
APIS:
  GET /api/v1/batches/:id              → batch detail includes linked Moodle courseId
  [NEEDS ENDPOINT: GET /batches/:id/content] → chapter list + video list from Moodle

SCREEN: courses/[batchId]/page.tsx
[Chapter accordion + video cards + PDF links + assignment list]
[ProgressRing per chapter, global ring at top]
APIS:
  GET /api/v1/batches/:id              → batch + Moodle course ID
  [NEEDS ENDPOINT: GET /batches/:id/content] → Moodle course contents
  [NEEDS ENDPOINT: GET /batches/:id/progress/:studentId] → completion status

SCREEN: tests/page.tsx
[Upcoming tests + past results with rank + score]
[Each past test: ProgressRing (score%), rank badge, date]
APIS:
  [NEEDS ENDPOINT: GET /batches/:id/tests] → test list from Moodle quizzes
  [NEEDS ENDPOINT: GET /batches/:id/tests/:testId/result] → student's result

SCREEN: fees/page.tsx
[Fee summary: total, paid, outstanding + payment history + Pay Now button]
APIS:
  GET /api/v1/fees/pending/:studentId  → outstanding + schedule
  POST /api/v1/fees/payment            → initiate Razorpay order
  [Razorpay JS SDK handles the payment UI — not a gateway endpoint]

SCREEN: timeline/page.tsx
[Instagram-style activity feed: attendance, test results, fee confirmations]
APIS:
  GET /api/v1/students/:erpId/timeline → event timeline (ClickHouse events, formatted)

SCREEN: profile/page.tsx
[Student info, achievements, streak count, settings toggles]
APIS:
  GET /api/v1/students/:erpId          → profile data
  PUT /api/v1/students/:erpId          → update contact info
```

### 3.5 Teacher Web Portal — `(teach)/`

```
SCREEN: home/page.tsx
[Today's classes list + quick stats: classes today, students, avg attendance]
[Pending tasks: assignments to grade, content to upload]
APIS:
  GET /api/v1/batches                  → instructor's assigned batches
  GET /api/v1/batches/:id              → schedule for today (per batch)
  GET /api/v1/attendance/reports       → this week's attendance % per batch

SCREEN: attendance/page.tsx
[Batch selector → student list → tap P/A/L per student → Submit]
[One tap: Mark all present | Search student by name]
APIS:
  GET /api/v1/batches/:id              → enrolled student list
  POST /api/v1/attendance/manual       → submit attendance

SCREEN: batches/[id]/page.tsx
[Batch view for teacher: student list, schedule, content upload, test results]
APIS:
  GET /api/v1/batches/:id              → batch + students + Moodle course ID
  POST /api/v1/batches/:id/schedule    → add class slot
  GET /api/v1/attendance/reports       → batch-level attendance
  [NEEDS ENDPOINT: POST /batches/:id/content/video] → content upload
  [NEEDS ENDPOINT: POST /batches/:id/content/pdf]   → PDF upload
```

---

## Part 4: Gateway Extension Points

These are features visible in the UI plan that have **no corresponding gateway endpoint today**. Each item is a NestJS gateway task. Add the endpoint to the gateway first, then build the frontend screen.

Organized by priority (ship-blocking vs enhancement):

### Priority 1 — Ship-Blocking (without these, core product is incomplete)

```
[EXT-01]  WebSocket live attendance feed
  ADD TO:   gateway/src/modules/attendance/attendance.gateway.ts (WebSocket)
  ENDPOINT: WS /api/v1/attendance/live-stream
  USED BY:  (institute)/attendance/page.tsx — RFID live feed panel
            (institute)/dashboard/page.tsx — right panel feed

[EXT-02]  Course content list from Moodle
  ADD TO:   gateway/src/modules/batches/batches.controller.ts
  ENDPOINT: GET /api/v1/batches/:id/content
  RETURNS:  { sections: [{ name, videos: [...], pdfs: [...], assignments: [...] }] }
  USED BY:  (learn)/courses/[batchId]/page.tsx
            (teach)/batches/[id]/page.tsx

[EXT-03]  Student course progress
  ADD TO:   gateway/src/modules/batches/batches.controller.ts
  ENDPOINT: GET /api/v1/batches/:id/progress/:studentId
  RETURNS:  { completionPct, chaptersCompleted, videosWatched, lastActivity }
  USED BY:  (learn)/courses/page.tsx (ProgressRings)

[EXT-04]  Live class management (BBB)
  ADD TO:   gateway/src/modules/ → new live-class module
  ENDPOINTS:
    POST /api/v1/live-class/create          → creates BBB meeting, returns meetingId
    POST /api/v1/live-class/:id/join        → returns signed BBB join URL
    POST /api/v1/live-class/:id/end         → ends BBB meeting
    GET  /api/v1/live-class/:id/recordings  → fetched from BBB after recording ready
  USED BY:  (learn)/live-class/[id]/page.tsx
            (teach)/home/page.tsx
            Mobile: LiveClassScreen.tsx
```

### Priority 2 — Core Feature (needed before public launch)

```
[EXT-05]  Test management
  ADD TO:   gateway/src/modules/ → new tests module
  ENDPOINTS:
    GET  /api/v1/batches/:id/tests              → list tests in a batch
    POST /api/v1/batches/:id/tests              → create test (Moodle Quiz)
    GET  /api/v1/batches/:id/tests/:testId      → test detail + questions
    POST /api/v1/tests/:testId/attempt          → start attempt (Redis timer set)
    POST /api/v1/tests/:testId/attempt/submit   → submit answers, returns score + rank
    GET  /api/v1/tests/:testId/result           → student result + leaderboard
  USED BY:  (learn)/tests/page.tsx
            (institute)/dashboard/page.tsx (test count KPI)

[EXT-06]  Content upload
  ADD TO:   gateway/src/modules/batches/batches.controller.ts
  ENDPOINTS:
    POST /api/v1/batches/:id/content/video  → uploads to MinIO → BullMQ FFmpeg job
    POST /api/v1/batches/:id/content/pdf    → uploads to MinIO → watermark → Moodle resource
  USED BY:  (teach)/batches/[id]/page.tsx
            Mobile: TeacherContentUploadScreen

[EXT-07]  Announcements
  ADD TO:   gateway/src/modules/ → extend notifications or new comms module
  ENDPOINTS:
    POST /api/v1/announcements/batch    → sends to all students in a batch via Novu
    POST /api/v1/announcements/all      → sends to entire institute
  USED BY:  (institute)/settings/page.tsx
            Mobile: TeacherHomeScreen

[EXT-08]  Bulk import job status polling
  ADD TO:   gateway/src/modules/students/students.controller.ts
  ENDPOINT: GET /api/v1/students/import-jobs/:jobId
  RETURNS:  { status: 'processing'|'done'|'error', progress: 67, errors: [...] }
  USED BY:  (institute)/students/import/page.tsx
```

### Priority 3 — Enhancement (post-launch)

```
[EXT-09]  Student notification history
  ENDPOINT: GET /api/v1/students/:erpId/notifications
  NOTE:     Novu notification-center component may cover this via SDK
  USED BY:  Mobile: ParentUpdatesScreen

[EXT-10]  RFID device management
  ENDPOINT: GET /api/v1/tenants/:id/rfid-devices
            POST /api/v1/tenants/:id/rfid-devices
  USED BY:  (institute)/settings/page.tsx

[EXT-11]  Teacher management (list + create)
  NOTE:     Currently, teachers are created via /students with role param OR
            via ERPNext directly. A dedicated /teachers endpoint would be cleaner.
  ENDPOINT: GET /api/v1/teachers
            POST /api/v1/teachers
  USED BY:  (institute)/settings/page.tsx → Staff Accounts tab

[EXT-12]  Public branding endpoint (no auth required)
  ENDPOINT: GET /api/v1/tenants/:slug/branding   (public, no JWT)
  PURPOSE:  Mobile app + login page fetch institute logo + primary color before auth
  USED BY:  (auth)/login/page.tsx
            Mobile: InstituteDiscoveryScreen
```

---

## Part 5: Design System (Grounded in `web/` Setup)

The design system now references the actual files that need to be created in the `web/` directory.

### 5.1 Setup Sequence

```bash
# From web/ directory — run these in order

# 1. Install dependencies
npm install @novu/notification-center
npm install @tanstack/react-query @tanstack/react-table
npm install axios
npm install framer-motion
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install socket.io-client
npm install date-fns
npm install recharts
npm install lucide-react

# 2. Shadcn UI init
npx shadcn-ui@latest init
# → choose: TypeScript, Tailwind, App Router, no alias prefix change

# 3. Font setup (in app/layout.tsx)
# next/font/google → Geist + Geist Mono (Vercel's own font, zero CLS)
```

### 5.2 Token File

```typescript
// web/lib/tokens.ts
// Single source of truth for all design tokens

export const tokens = {
  // Platform context (super-admin) — fixed dark
  platform: {
    bg: '#0D1117',
    surface: '#161B22',
    elevated: '#21262D',
    border: '#30363D',
    text: '#F0F6FC',
    muted: '#8B949E',
    subtle: '#484F58',
    accent: '#6E40C9',      // CoachingOS violet — the one bold choice
    accentHover: '#8957E5',
    success: '#3FB950',
    warning: '#D29922',
    danger: '#F85149',
  },

  // Institute context — light, branding-overridable
  institute: {
    bg: '#F6F8FA',
    surface: '#FFFFFF',
    subtle: '#F0F2F5',
    border: '#D0D7DE',
    text: '#1F2328',
    muted: '#59636E',
    // primary: injected at runtime from institute.branding.primaryColor
    success: '#1A7F37',
    warning: '#9A6700',
    danger: '#CF222E',
    streak: '#FFA657',
  },

  // Shared mobile tokens
  mobile: {
    light: { bg: '#F4F6FA', card: '#FFFFFF', border: '#E5E7EB', text: '#111827', muted: '#6B7280' },
    dark:  { bg: '#0F1117', card: '#1A1D25', border: '#2A2D35', text: '#F9FAFB', muted: '#9CA3AF' },
    student:    '#6366F1',   // indigo
    instructor: '#0EA5E9',   // sky
    parent:     '#10B981',   // emerald
  },
} as const;
```

### 5.3 API Client

```typescript
// web/lib/api-client.ts
// The ONE file all screens import — never call gateway directly elsewhere

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL + '/api/v1',
  timeout: 15000,
  headers: { 'X-App-Version': '1.0.0' },
});

// Attach JWT from Zustand store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh on 401
apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient.request(error.config);
    }
    useAuthStore.getState().logout();
  }
  return Promise.reject(error);
});
```

### 5.4 Auth Store

```typescript
// web/stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    erpId: string;
    name: string;
    role: 'super-admin' | 'admin' | 'instructor' | 'student' | 'parent';
    instituteId: string;
    branding: { primaryColor: string; logoUrl: string; appName: string };
  } | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'coaching-auth' }
  )
);
```

### 5.5 Branding Injection (Dynamic Institute Colors)

The institute's primary color is applied as a CSS custom property on the root element after login. This makes shadcn/ui components automatically pick up the institute's brand.

```typescript
// web/lib/branding.ts

export function applyInstituteTheme(primaryColor: string) {
  const root = document.documentElement;
  root.style.setProperty('--inst-primary', primaryColor);

  // Compute lighter tint for hover states (10% opacity version)
  root.style.setProperty('--inst-primary-10', primaryColor + '1A');  // hex alpha
  root.style.setProperty('--inst-primary-20', primaryColor + '33');

  // shadcn/ui reads --primary for all Button[variant=default], progress, etc.
  // Override to use institute primary
  root.style.setProperty('--primary', primaryColor);
}

// Called once after successful login in (auth)/verify/page.tsx:
// applyInstituteTheme(user.branding.primaryColor);
```

### 5.6 Signature Component — Progress Ring

```typescript
// web/components/shared/ProgressRing.tsx
// THE signature element: appears on every student-facing surface

interface ProgressRingProps {
  value: number;       // 0 to 100
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  color?: string;      // defaults to --inst-primary CSS var
  showValue?: boolean;
}

const SIZES = { xs: 32, sm: 48, md: 64, lg: 96, xl: 128 };

export function ProgressRing({ value, size = 'md', label, color, showValue = true }: ProgressRingProps) {
  const px = SIZES[size];
  const radius = (px - 8) / 2;         // 4px stroke width on each side
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={px} height={px} className="-rotate-90">
        {/* Track */}
        <circle
          cx={px / 2} cy={px / 2} r={radius}
          fill="none" stroke="var(--inst-border, #D0D7DE)" strokeWidth={4}
        />
        {/* Fill — animates on mount via CSS transition */}
        <circle
          cx={px / 2} cy={px / 2} r={radius}
          fill="none"
          stroke={color ?? 'var(--inst-primary, #1E40AF)'}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Glow dot at fill endpoint */}
        {value > 0 && (
          <circle
            cx={px / 2 + radius * Math.cos((value / 100) * 2 * Math.PI - Math.PI / 2)}
            cy={px / 2 + radius * Math.sin((value / 100) * 2 * Math.PI - Math.PI / 2)}
            r={3}
            fill={color ?? 'var(--inst-primary, #1E40AF)'}
          />
        )}
      </svg>
      {showValue && (
        <span className="text-sm font-mono font-medium tabular-nums">
          {Math.round(value)}%
        </span>
      )}
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
```

---

## Part 6: Route Group Layouts

Each route group has its own layout.tsx that controls the shell, theme, and navigation. These layouts are mutually exclusive — only one renders for a given URL.

### 6.1 Super Admin Layout (Dark)

```tsx
// web/app/(super-admin)/layout.tsx

import { redirect } from 'next/navigation';
import { verifyRole } from '@/lib/auth-server';
import { SuperAdminSidebar } from '@/components/super-admin/Sidebar';
import { TopBar } from '@/components/shared/TopBar';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await verifyRole(['super-admin']);
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-[#0D1117] text-[#F0F6FC]">
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar user={user} theme="dark" showNovu={false} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// SuperAdminSidebar nav items:
// Dashboard → /dashboard
// Institutes → /tenants
// Analytics → /analytics
// System Health → /health
// ─────────────
// Novu Config ↗ (external link to novu/apps/dashboard — internal only)
// Logout
```

### 6.2 Institute Admin Layout (Light, Branded)

```tsx
// web/app/(institute)/layout.tsx

export default async function InstituteLayout({ children }) {
  const user = await verifyRole(['admin', 'accountant']);
  if (!user) redirect('/login');

  // Apply institute branding via CSS vars (server-rendered inline style)
  const brandStyle = { '--inst-primary': user.branding.primaryColor } as React.CSSProperties;

  return (
    <div className="flex h-screen bg-[#F6F8FA]" style={brandStyle}>
      <InstituteSidebar activePlan={user.institutePlan} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar user={user} theme="light" showNovu={true} />
        <main className="flex-1 overflow-y-auto p-6 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// InstituteSidebar nav groups:
// ── ACADEMICS ──
// Students        /students
// Batches         /batches
// Attendance      /attendance
// Schedule        /schedule
// Tests           /tests (grayed if [NEEDS ENDPOINT])
// Live Classes    /live-class (grayed if [NEEDS ENDPOINT])
// ── OPERATIONS ──
// Fees            /fees
// Communications  /communications (grayed if [NEEDS ENDPOINT])
// ── INTELLIGENCE ──
// Analytics       /analytics
// ── ADMIN ──
// Settings        /settings
```

### 6.3 Student Learn Layout (Dark-mode Ready)

```tsx
// web/app/(learn)/layout.tsx

export default async function LearnLayout({ children }) {
  const user = await verifyRole(['student', 'parent']);
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#0F1117]">
      <LearnTopNav user={user} />        {/* Top navigation bar */}
      <main className="max-w-4xl mx-auto px-4 pb-24">{children}</main>
      <LearnBottomNav />                 {/* Mobile-style bottom tabs even on web */}
    </div>
  );
}

// LearnBottomNav tabs:
// Home (house icon)   → /home
// Courses (books)     → /courses
// Tests (pencil)      → /tests
// Fees (rupee)        → /fees
// Me (person)         → /profile
```

### 6.4 Teacher Teach Layout

```tsx
// web/app/(teach)/layout.tsx

export default async function TeachLayout({ children }) {
  const user = await verifyRole(['instructor']);
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      <TeachTopNav user={user} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      <TeachBottomNav />
    </div>
  );
}

// TeachBottomNav tabs:
// Today (calendar)    → /home
// Attendance (check)  → /attendance
// My Batches (grid)   → /batches (lists only assigned batches)
// Me (person)         → /profile
```

---

## Part 7: TanStack Query Setup — One Query Per Endpoint

Every BFF endpoint gets exactly one TanStack Query hook. Components never call `apiClient` directly — they always call a hook.

```typescript
// web/lib/queries/students.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// GET /students
export function useStudentsList(params?: { search?: string; batchId?: string }) {
  return useQuery({
    queryKey: ['students', 'list', params],
    queryFn: () => apiClient.get('/students', { params }).then(r => r.data),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}

// GET /students/:erpId
export function useStudent(erpId: string) {
  return useQuery({
    queryKey: ['students', erpId],
    queryFn: () => apiClient.get(`/students/${erpId}`).then(r => r.data),
    staleTime: 15 * 60 * 1000,  // 15 minutes (profile rarely changes)
  });
}

// GET /students/:erpId/timeline
export function useStudentTimeline(erpId: string) {
  return useQuery({
    queryKey: ['students', erpId, 'timeline'],
    queryFn: () => apiClient.get(`/students/${erpId}/timeline`).then(r => r.data),
    staleTime: 60 * 1000,  // 1 minute (activity updates frequently)
  });
}

// POST /students
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentDto) => apiClient.post('/students', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', 'list'] }),
  });
}

// PUT /students/:erpId
export function useUpdateStudent(erpId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateStudentDto>) =>
      apiClient.put(`/students/${erpId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', erpId] });
      qc.invalidateQueries({ queryKey: ['students', 'list'] });
    },
  });
}

// POST /students/bulk-import
export function useBulkImportStudents() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { /* progress callback */ },
      }).then(r => r.data),  // returns { jobId }
  });
}
```

```typescript
// web/lib/queries/batches.ts

export function useBatchList() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: () => apiClient.get('/batches').then(r => r.data),
    staleTime: 30 * 60 * 1000,   // batches rarely change
  });
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => apiClient.get(`/batches/${id}`).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useEnrollStudent(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      apiClient.post(`/batches/${batchId}/enroll`, { studentId }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}

export function useAddSchedule(batchId: string) {
  return useMutation({
    mutationFn: (schedule: ScheduleDto) =>
      apiClient.post(`/batches/${batchId}/schedule`, schedule).then(r => r.data),
  });
}

export function useAssignInstructor(batchId: string) {
  return useMutation({
    mutationFn: (instructorId: string) =>
      apiClient.post(`/batches/${batchId}/instructors`, { instructorId }).then(r => r.data),
  });
}
```

```typescript
// web/lib/queries/fees.ts

export function useStudentFees(studentId: string) {
  return useQuery({
    queryKey: ['fees', studentId],
    queryFn: () => apiClient.get(`/fees/pending/${studentId}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (data: { studentId: string; amount: number; description: string }) =>
      apiClient.post('/fees/payment', data).then(r => r.data),  // returns { orderId, key }
    onSuccess: ({ orderId, key, amount }) => {
      // Open Razorpay SDK
      const rzp = new window.Razorpay({ key, order_id: orderId, amount });
      rzp.open();
    },
  });
}

export function useGenerateFeeSchedule() {
  return useMutation({
    mutationFn: (data: { batchId: string; feeStructure: FeeStructureDto }) =>
      apiClient.post('/fees/schedule', data).then(r => r.data),
  });
}
```

```typescript
// web/lib/queries/attendance.ts

export function useAttendanceReports(params: { batchId?: string; studentId?: string; month?: string }) {
  return useQuery({
    queryKey: ['attendance', 'reports', params],
    queryFn: () => apiClient.get('/attendance/reports', { params }).then(r => r.data),
    staleTime: 60 * 1000,    // 1 minute — updates during attendance session
  });
}

export function useManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: AttendanceRecordDto[]) =>
      apiClient.post('/attendance/manual', { records }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
```

```typescript
// web/lib/queries/analytics.ts

export function usePlatformKPIs() {
  return useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then(r => r.data),
    staleTime: 30 * 1000,    // 30 seconds — live-ish
  });
}

export function useInstituteDashboard(dashboardId: string) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', dashboardId],
    queryFn: () => apiClient.get(`/analytics/dashboard/${dashboardId}`).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });
}
```

```typescript
// web/lib/queries/tenants.ts  (super-admin only)

export function useTenantList(params?: { plan?: string; status?: string }) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => apiClient.get('/tenants', { params }).then(r => r.data),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: () => apiClient.get(`/tenants/${id}`).then(r => r.data),
  });
}

export function useProvisionTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProvisionTenantDto) => apiClient.post('/tenants', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantDto>) => apiClient.put(`/tenants/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants', id] }),
  });
}

export function useDeactivateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/tenants/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}
```

---

## Part 8: Mobile App — Confirmed Architecture (Minimal Changes from v1)

The v1 mobile plan is confirmed by the codebase audit. The only updates:

**API base changes:** Mobile app calls the same 33 gateway endpoints. Same `apiClient.ts` pattern, using `EXPO_PUBLIC_GATEWAY_URL`.

**Novu in mobile:** Use `@novu/react-native` package for push notification registration instead of custom FCM code.

**BBB in mobile:** The live class screen (already in v1) is confirmed correct:
```tsx
// Mobile: LiveClassScreen.tsx
// BBB join URL comes from [NEEDS ENDPOINT: POST /live-class/:id/join]
// Until EXT-04 is built, this screen shows "Live class coming soon"
```

**Placeholder pattern for missing endpoints:**

```typescript
// apps/mobile/src/screens/student/TestsScreen.tsx
// [NEEDS ENDPOINT: EXT-05] — show placeholder until gateway endpoint is built

export function TestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Tests</Text>
      <EmptyState
        icon="pencil"
        headline="Tests are coming"
        body="Your upcoming tests will appear here once your teacher schedules them."
      />
      {/* TODO: swap for useTests() hook once EXT-05 is shipped */}
    </View>
  );
}
```

This pattern — ship a placeholder EmptyState, swap for real data when the endpoint lands — keeps both frontend and backend teams unblocked.

---

## Part 9: Execution Phases (Grounded in Codebase State)

The phases now reflect the actual starting point: a raw Next.js boilerplate in `web/` and a live gateway with 33 endpoints.

### Phase 1 — Foundation (Week 1–2)

```
Goal: Running app skeleton, auth working, all four route groups accessible.

Tasks:
  1. web/: Install all dependencies (Shadcn, TanStack, Framer, Novu, etc.)
  2. web/lib/tokens.ts — token file
  3. web/lib/api-client.ts — Axios instance + JWT interceptor + refresh logic
  4. web/stores/auth.ts — Zustand auth store
  5. web/app/(auth)/login/page.tsx + verify/page.tsx
     → Calls POST /auth/send-otp and POST /auth/verify-otp
     → On success: sets tokens, applies branding, redirects by role
  6. All four layout.tsx files (super-admin, institute, learn, teach)
     → Each with correct sidebar/topnav shell and role guard
  7. All route group root pages render a "Welcome" placeholder

Milestone: Login → OTP → role-correct dashboard stub works end-to-end.
```

### Phase 2 — Super Admin + Institute Core (Week 3–5)

```
Goal: Super admin can manage tenants. Institute admin can see students, batches, fees.

Tasks:
  (super-admin)/tenants pages → calls GET/POST/PUT/DELETE /tenants
  (super-admin)/analytics     → calls GET /analytics/kpis + /analytics/dashboard/0
  (super-admin)/health        → calls GET /health/ready
  (institute)/students pages  → full CRUD via /students endpoints
  (institute)/batches pages   → /batches endpoints + enroll + instructors + schedule
  (institute)/fees pages      → /fees/pending, /fees/schedule, /fees/payment
  (institute)/analytics       → /analytics/dashboard/:id

Ship EXT-08 (import job status) at end of this phase to complete bulk import.

Milestone: Operational institute admin panel feature-complete for core modules.
```

### Phase 3 — Vue Migration + Attendance (Week 6–7)

```
Goal: Replace all four education/frontend Vue components with Next.js equivalents.

Tasks:
  (institute)/attendance → POST /attendance/manual + GET /attendance/reports
                        → Ship EXT-01 (WebSocket live feed) for RFID dashboard
  (institute)/schedule  → GET/POST /batches/:id + /batches/:id/schedule
  Verify feature parity with Attendance.vue, Fees.vue, Grades.vue, Schedule.vue
  Redirect Vue routes → Next.js routes
  Delete education/frontend/ after sign-off

Milestone: Vue SPA gone. All functionality in Next.js. Zero regressions.
```

### Phase 4 — Student & Teacher Portals (Week 8–10)

```
Goal: Students and teachers can use the web portals.

Tasks:
  Ship EXT-02 + EXT-03 (content list + progress) → gateway
  (learn)/home + courses pages (uses new endpoints)
  (learn)/fees page → existing /fees/pending/:studentId endpoint
  (learn)/timeline  → existing /students/:erpId/timeline endpoint
  (teach)/home + attendance pages
  (teach)/batches pages
  Novu notification bell in all layouts → @novu/notification-center

Milestone: Students can browse courses and pay fees. Teachers can mark attendance.
```

### Phase 5 — Live Class + Tests (Week 11–14)

```
Goal: Full class experience + examination system.

Tasks:
  Ship EXT-04 (live class BBB endpoints) → gateway
  (learn)/live-class/[id] → BBB iframe wrapper with brand overlay
  (teach)/live-class → start/end meeting controls
  Ship EXT-05 (test management endpoints) → gateway
  (learn)/tests → test list + take test + view results
  (institute)/tests → create test wizard (4-step)

Milestone: Students can join live classes and take tests online.
```

### Phase 6 — Mobile App (Week 12–16, parallel with Phase 5)

```
Goal: Ship the single Expo app for Student + Teacher + Parent.

Tasks:
  All screens in student navigator using 33 endpoints + EXT endpoints as they land
  Teacher navigator: home + attendance (EXT-01) + content upload (EXT-06)
  Parent navigator: child summary via /students/:erpId/timeline
  Push notifications via @novu/react-native
  BBB in WebView (LiveClassScreen) once EXT-04 lands

Milestone: One app published to Play Store and App Store.
```

---

## Part 10: Missing Endpoint Placeholder Convention

Any screen that depends on an endpoint marked **[NEEDS ENDPOINT]** should follow this exact pattern. It keeps the UI consistent and signals clearly to users (and developers) what's coming.

```tsx
// web/components/shared/ComingSoonSection.tsx

interface ComingSoonSectionProps {
  feature: string;
  extId: string;   // e.g. "EXT-05"
  description: string;
}

export function ComingSoonSection({ feature, extId, description }: ComingSoonSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--inst-primary-10)] flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{feature}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      <span className="text-xs font-mono text-muted-foreground/50">
        Gateway extension: {extId}
      </span>
    </div>
  );
}

// Usage:
// web/app/(learn)/tests/page.tsx
export default function TestsPage() {
  // When EXT-05 lands: replace this with the real test list component
  return (
    <ComingSoonSection
      feature="Tests & Examinations"
      extId="EXT-05"
      description="Your upcoming tests will appear here. Your teacher is setting them up."
    />
  );
}
```

---

## Summary: v1 → v2 Decision Changes

| Decision | v1 (Wrong) | v2 (Correct, grounded in codebase) |
|---|---|---|
| Super admin deployment | Separate Next.js at superadmin.* | Route group `(super-admin)` in same Next.js app |
| API surface | 100+ self-invented endpoints | 33 real BFF endpoints confirmed in gateway/src/modules |
| Education Vue frontend | "Deprecated" (vague) | Explicit component-by-component migration table with phase assignment |
| Notification bell | Custom build from scratch | `@novu/notification-center` from `novu/apps/dashboard` ecosystem |
| BBB integration | "CSS injection" | Proper iframe with Next.js layout overlay; `userdata_bbb_custom_style_url` parameter for internal CSS |
| Missing features | Not flagged | Explicit EXT-01 through EXT-12 extension point registry with gateway module assignments |
| Query layer | Generic description | One TanStack Query hook per real endpoint, exact queryKeys, exact staleTime |
| Deployment count | 2 web + 1 mobile | 1 web (route groups) + 1 mobile |
| "Superset analytics" | Included as second BI system | Dropped — Metabase only, per v3 architecture |
| Auth branding fetch | Generic description | CSS variable injection after login, `GET /tenants/:slug/branding` needed as EXT-12 |
```