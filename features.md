# CoachingOS — Complete Interface & Feature Report
### SaaS Owner (Super Admin) · Coaching Admin (Institute) · Teacher · Student · Parent

*Compiled from the actual codebase (`coachingos_core_clean.zip`): `gateway/src/modules/*`, `web/app/*`, `web/components/*`, `mobile/app/*`, and the platform's own feature catalog (`feature-catalog.ts`). This is a ground-truth audit, not a re-statement of the earlier planning docs — where those docs undercounted or omitted things, it's corrected below.*

---

## 1. How the System Actually Fits Together

```
Web (Next.js, 5 route groups)  ─┐
Mobile (Expo/React Native)     ─┼──►  Gateway (NestJS BFF, 14 modules)  ──►  ERPNext · Moodle · BigBlueButton
                                 │                                            ClickHouse/Metabase · Novu · Razorpay
Super Admin also talks directly ┘
to `proxy` module for raw ERP/Moodle access
```

The Gateway is **not** a fixed 33-endpoint shim as the older `Backend_API_Report.md` claimed — the real, current module list is:

| Module | Endpoints (actual) |
|---|---|
| `auth` | send-otp, verify-otp, refresh, logout, **features** (returns tenant's resolved feature flags) |
| `students` | list, create, get, update, bulk-import, rfid-card, timeline |
| `batches` | list, create, get, enroll, schedule, instructors |
| `attendance` | rfid-punch (webhook), manual, reports |
| `fees` | schedule, payment, pending/:studentId, razorpay config (get/set), razorpay order/verify, razorpay webhook |
| `education-portal` | parent/children, students/:id/schedule, /attendance, /invoices, /programs, /grades, students/:id/leave |
| `lms` | courses, courses/:id/content, courses/:id/grades |
| `live-class` | list, create, join, delete, recordings |
| `tests` | list, attempt/start, attempt/review, attempt/submit *(Moodle Quiz — "Online Tests")* |
| `analytics` | dashboard/:id, kpis |
| `tenants` | create, list, get, update, delete, get features |
| `superadmin` | stats, audit-logs, tenant metrics, suspend tenant, **feature catalog**, get/set tenant features |
| `health` | liveness, readiness |
| `proxy` | raw ERPNext CRUD (`erp/:doctype`), raw ERPNext method calls, raw Moodle webservice calls |

**Key architectural fact the earlier docs missed:** the platform runs on a **plan-based feature-flag system** (`starter` / `growth` / `professional`, plus per-tenant overrides), enforced both server-side (`FeaturesService`) and client-side (`<FeatureGate>` component + `INSTITUTE_NAV_FEATURES` map). Every interface below should be read *against* this catalog, because it defines exactly which OSS capability is exposed to whom.

### The Feature Catalog (single source of truth)

| Key | Feature | Underlying OSS | Category | Starter | Growth | Pro |
|---|---|---|---|:---:|:---:|:---:|
| `student_management` | Student CRUD, profile, timeline | ERPNext | core | ✅ | ✅ | ✅ |
| `batches` | Batches/Programs, enrollment, scheduling | ERPNext | core | ✅ | ✅ | ✅ |
| `teacher_portal` | Instructor web + mobile access | Gateway | core | ✅ | ✅ | ✅ |
| `parent_portal` | Guardian-linked student views | Gateway | core | ✅ | ✅ | ✅ |
| `attendance_manual` | Teacher marks attendance | ERPNext | academics | ✅ | ✅ | ✅ |
| `schedule` | Class schedule calendar | ERPNext | academics | ✅ | ✅ | ✅ |
| `fees_management` | Fee schedules, invoices, defaulters | ERPNext | finance | ✅ | ✅ | ✅ |
| `attendance_rfid` | Real-time RFID punches + live feed | RFID Service | academics | – | ✅ | ✅ |
| `grades` | Assessment results | ERPNext | academics | – | ✅ | ✅ |
| `online_payments` | Razorpay online fee payment | Razorpay | finance | – | ✅ | ✅ |
| `live_classes` | Virtual classrooms | BigBlueButton | academics | – | ✅ | ✅ |
| `moodle_lms` | Courses, content, completion | Moodle | academics | – | ✅ | ✅ |
| `online_tests` | Quiz attempts & grading | Moodle Quiz | academics | – | ✅ | ✅ |
| `analytics` | Embedded BI dashboards | Metabase/ClickHouse | analytics | – | ✅ | ✅ |
| `notifications` | Push/SMS/email | Novu | communication | – | ✅ | ✅ |
| `communication` | Announcements & messaging hub | Gateway | communication | – | ✅ | ✅ |
| `bulk_import` | CSV student onboarding | Gateway | core | – | ✅ | ✅ |
| `custom_branding` | White-label colors/logo | Gateway | core | – | – | ✅ |
| `recordings` | BBB recording playback | BigBlueButton | academics | – | – | ✅ |
| `api_proxy` | Raw ERPNext/Moodle access | Gateway proxy | integrations | – | – | ✅ |

This table is what "make sure the UI contains all the features of our open source system" actually maps to — every OSS capability (ERPNext, Moodle, BBB, ClickHouse/Metabase, Novu, Razorpay) is already wired to a feature key, so each interface section below is written **feature-key by feature-key** so nothing gets dropped in a rebuild.

---

## 2. Interface 1 — SaaS Owner / Super Admin Panel

**Route group:** `web/app/superadmin/*` · **Backend:** `superadmin`, `tenants`, `proxy`, `health` modules
**Audience:** Anthropic-of-CoachingOS, i.e. the platform operator managing many coaching institutes (B2B multi-tenant).

### 2.1 Existing pages (already built)
| Page | Purpose | Data source |
|---|---|---|
| `/superadmin/dashboard` — **Platform Command Center** | Active Tenants, Total Students, Requests(24h), Errors(24h) tiles | `superadmin/stats` |
| `/superadmin/tenants` — **All Institutes** | List/create/suspend tenants, drill into `/tenants/[id]` | `tenants`, `superadmin/tenants/:id/metrics` |
| `/superadmin/analytics` — **Platform Analytics** | Requests-by-institute (24h) chart, global KPIs | `analytics/kpis`, ClickHouse |
| `/superadmin/audit-logs` — **Audit Logs** | Filterable activity stream by institute/user/action | `superadmin/audit-logs` |
| `/superadmin/health` — **Infrastructure** | API Gateway status, Readiness probe, Service Dependencies (ERPNext/Moodle/Redis/BBB/Novu) | `health`, `health/ready` |
| `/superadmin/security` — **Security & Compliance** | Auth model, tenant data-isolation explainer | static/config |
| `/superadmin/proxy` — **API Explorer** | Raw ERPNext doctype browser + raw Moodle webservice caller (developer console) | `proxy/erp/*`, `proxy/moodle/call` |

### 2.2 Feature-complete additions needed (to cover every catalog key)
The current build covers ops/tenant management well but is **missing a first-class Feature/Plan management screen**, even though the backend (`superadmin/features/catalog`, `GET/PUT tenants/:id/features`) already supports it fully.

1. **Plans & Feature Flags** (`/superadmin/plans`) — surface `FEATURE_CATALOG` as a grid grouped by category (core/academics/finance/communication/analytics/integrations), with a toggle matrix per tenant reading/writing `tenants/:id/features`. This is the single most important missing screen: it's the UI for the exact plan-gating logic (`starter/growth/professional`) that already governs every other portal.
2. **Tenant Provisioning Wizard** — extend `/superadmin/tenants` "create" flow to explicitly show what gets created: Frappe company (ERPNext) + Moodle category + default plan features, per `CoachingOS_UI_UX_Plan.md` §5A.
3. **Billing/MRR overview** — global revenue rollup (Razorpay across tenants) — currently only per-institute finance exists; there's no cross-tenant billing view yet.
4. **Global module kill-switches** — toggle BBB/Moodle/Novu availability platform-wide (referenced in the original UX plan, not yet in code) — useful for maintenance windows.
5. **Novu template management embed** — the plan calls for exposing `novu/apps/dashboard` to Super Admins only for configuring notification templates; not yet linked from the superadmin nav.
6. **Superset/Metabase full-dashboard catalog view**, not just single dashboard-by-id — a directory of all embeddable BI dashboards.

### 2.3 IA / Navigation
`Dashboard → Institutes → Plans & Features → Analytics → Communication Templates → Audit Logs → Health → Security → API Explorer`

---

## 3. Interface 2 — Coaching Admin (Institute) Panel

**Route group:** `web/app/institute/*` · **Backend:** `students`, `batches`, `attendance`, `fees`, `analytics`, `education-portal`, `tests` modules
**Audience:** Owner/admin staff of one coaching institute (B2B core, the paying customer).

### 3.1 Existing pages (already built)
| Page | Purpose | Feature key |
|---|---|---|
| `/institute/dashboard` | Total Students, Active Batches, Monthly Collection, Today's Attendance + embedded Analytics | `analytics` |
| `/institute/students` (+ `/new`, `/[erpId]`) | Full CRUD, profile, timeline, RFID-card assignment | `student_management` |
| `/institute/batches` | Batch roster, program breakdown, enroll/schedule/assign-instructor | `batches` |
| `/institute/schedule` | Calendar of upcoming classes per batch | `schedule` |
| `/institute/attendance` | Present/Late/Absent tiles + live activity feed (RFID) | `attendance_manual`, `attendance_rfid` |
| `/institute/grades` | Assessment results table (ERPNext) | `grades` |
| `/institute/finance` | Monthly collection, pending-fees-by-student, defaulter list | `fees_management`, `online_payments` |
| `/institute/exams` | Online test / quiz management (Moodle Quiz) | `online_tests` |
| `/institute/communication` | Notification Center (announcements via Novu) | `communication`, `notifications` |
| `/institute/settings` | General profile, White-label branding, Tenant ID, Razorpay integration keys | `custom_branding` |

This is already the most complete portal in the codebase — 10 of 10 relevant feature-catalog keys have a page. Gaps are refinements, not missing modules:

### 3.2 Gaps / recommended additions
1. **Bulk CSV Import UI** — backend endpoint `students/bulk-import` exists but there is no dedicated import screen (only implied inside `/institute/students`). Add a stepper: upload → map columns → validate → commit, surfaced under `bulk_import` flag.
2. **Instructor management screen** — teachers are currently only assignable *inside* a batch (`batches/:id/instructors`); there's no institute-level "Staff/Instructors" directory (list, invite, deactivate).
3. **Moodle course catalog management** — `lms/courses` is read-only from the gateway; institute admins have no UI to publish/organize Moodle courses (currently done in Moodle backend directly, contradicting the "headless Moodle" goal in the UX plan).
4. **Live Classes overview for admins** — `live-class` module exists but is only surfaced in the Teacher portal; institute admins should see a cross-batch live-class monitor + recordings library (`recordings` flag).
5. **Leave approval inbox** — `education-portal/students/:id/leave` lets a parent/student *submit* leave requests, but there's no admin-side approval queue yet.
6. **Feature-gate banners are present** (`<FeatureGate>`) — good; make sure every one of the above new screens also respects it out of the box.

---

## 4. Interface 3 — Teacher Panel

**Route group:** `web/app/teach/*` + `mobile/app/(teacher)/*` · **Backend:** `batches`, `attendance`, `live-class`
**Audience:** Instructors, web (prep/admin work) + mobile (in-classroom use).

### 4.1 Existing pages
| Surface | Page | Purpose |
|---|---|---|
| Web | `/teach` (home) | Instructor landing |
| Web | `/teach/batches` | List of assigned batches |
| Web | `/teach/attendance` | Mark attendance manually per batch |
| Web | `/teach/live-class` | "Start a new class" + "Active classes" (BBB create/join) |
| Mobile | `(teacher)/home.tsx` | "Today's Batches" list, per-batch program name |

### 4.2 Gaps / recommended additions
1. **Grade entry / assessment submission** — teachers can view grades nowhere in `/teach/*`; ERPNext assessment creation should have a teacher-facing form (currently only viewable read-only in `/institute/grades`).
2. **Moodle content upload / quiz authoring** for teachers — `lms` and `tests` modules are consumer (read/attempt) endpoints only; there's no teacher-side "create quiz" or "upload course material" flow, despite Moodle natively supporting it. This is the single biggest gap versus "contains all the features of our open source system," since Moodle's authoring tools are currently invisible to the product.
3. **RFID-aware attendance view for teachers** — teachers only get `attendance_manual`; give them a read view of the RFID live feed for their own batch (subset of `/institute/attendance`).
4. **Class recordings management** — teachers should be able to publish/unpublish their own BBB recordings (`recordings` flag) — endpoint exists (`live-class/:meetingId/recordings`), no UI.
5. **Communication** — teachers currently cannot broadcast to their batch's parents/students; extend `communication` module access down from admin-only to per-batch teacher scope.
6. **Mobile parity** — mobile teacher app only has a home screen; attendance-marking and live-class start (the two things teachers do *in the room*) should be the priority mobile build-out, not web.

---

## 5. Interface 4 — Student App/Portal

**Route group:** `web/app/learn/*` + `mobile/app/(student)/*` · **Backend:** `education-portal`, `lms`, `tests`, `live-class`, `fees`
**Audience:** Enrolled students, mobile-first, "Netflix-style" retention UX per the design plan.

### 5.1 Existing pages
| Surface | Page | Purpose | Feature key |
|---|---|---|---|
| Web | `/learn` (home) | Landing/overview | — |
| Web | `/learn/courses` (+ `/[batchId]`) | Moodle course catalog + content viewer | `moodle_lms` |
| Web | `/learn/grades` | Personal assessment results | `grades` |
| Web | `/learn/schedule` | "Upcoming Classes" | `schedule` |
| Web | `/learn/timeline` | "Your Journey" activity feed | `student_management` |
| Web | `/learn/profile` | Profile + Pending Fees | `fees_management` |
| Web | `/learn/live-class/[meetingId]` | Join embedded BBB class | `live_classes` |
| Mobile | `(student)/home.tsx` | "My Batches" + "Pending Fees" | `batches`, `fees_management` |

### 5.2 Gaps / recommended additions
1. **Online test-taking UI** — backend fully supports it (`tests/list`, `attempt/start`, `attempt/submit`, `attempt/:id/review`) but there is **no `/learn/tests` page at all**. This is a fully-built OSS capability (Moodle Quiz) with zero frontend surface for students — highest-priority gap in the whole audit.
2. **Fee payment (Razorpay checkout)** — the `RazorpayCheckout` component exists (`web/components/payments/razorpay-checkout.tsx`) but isn't wired into `/learn/profile`'s "Pending Fees" card yet — students can *see* fees but the pay-now button/flow needs to be connected end-to-end.
3. **Notification bell** — `NovuBell` component exists but should be confirmed present in the `/learn` layout header (it's currently only in the shared components folder, not seen wired into `learn/layout.tsx`'s nav).
4. **Leave request submission** — endpoint (`education-portal/students/:id/leave`) exists with no UI entry point in `/learn/*`.
5. **Recordings library** for missed live classes (`recordings` flag) — students need a "past classes" tab, not just live join.
6. **Gamification / skill-trees** — called out in `CoachingOS_UI_UX_Plan.md` §5C ("gamified analytics pulled from Moodle's grading engine") but not present in code; treat as a Phase-2 roadmap item, not a current gap.

---

## 6. Interface 5 — Parent App

**Important correction vs. the original brief:** there is **no separate Parent app** in the codebase, and building one as a 5th standalone surface would contradict the platform's own architecture. Parents are a **role** (`role === 'parent'`) inside the *same* Student web/mobile experience:

- `AuthGuard allowedRoles={['student', 'parent']}` wraps `/learn/*` — parents and students share one layout.
- `<ParentChildSelector>` lets a parent switch between linked children (`education-portal/parent/children`), and every subsequent call (`schedule`, `attendance`, `invoices`, `programs`, `grades`) is scoped to the `activeStudentId` picked here.
- This matches the `parent_portal` feature key, which is explicitly a **core** (always-on) flag — every institute plan includes it.

### 6.1 What parents already get (via the shared `/learn` shell + `education-portal` data)
- Child selector (multi-child support)
- Child's schedule, attendance, grades, programs (read-only proxies)
- Child's invoices/pending fees
- Ability to submit a leave request on the child's behalf

### 6.2 Recommended parent-specific additions (still inside the shared shell, gated by `role === 'parent'`)
1. **Distinct parent-mode navigation** — `learn/layout.tsx`'s `navItems` are currently identical for both roles ("Home / Courses / Timeline / Profile"); a parent doesn't take courses. Swap in parent-appropriate tabs: **Home / Attendance / Fees / Timeline / Profile**, hiding `Courses`/`Tests`/`Live Class` (or showing them read-only, "child is in class now").
2. **One-tap Razorpay fee clearance** for the selected child — same gap as §5.2.2, doubly important here since Parent Fee Payment is called out explicitly in `CoachingOS_UI_UX_Plan.md` §5E.
3. **Instagram-style activity timeline** — timeline page exists generically; per the UX plan this should be visually distinct/richer for parents (photos, milestones) vs. the student's own timeline.
4. **Push notifications for fee due / attendance absent** — `notifications` (Novu) is wired platform-wide; ensure parent-role-specific templates exist (fee reminders, absence alerts) rather than generic ones.
5. **Multi-child dashboard summary** — currently the selector shows one child at a time; add a rollup card ("2 children · ₹4,200 pending across both") before drilling in.

---

## 7. Cross-Cutting Gaps (apply to more than one interface)

| Gap | Affected interfaces | Why it matters |
|---|---|---|
| No student-facing **Online Tests** UI | Student, (Teacher authoring) | A fully-built backend module (`tests`) has zero consumer UI — largest single feature/UI mismatch found |
| Razorpay checkout not wired to Fees pages | Student, Parent | Component built, not connected — quick win |
| No Feature/Plan management screen | Super Admin | Backend fully supports it; this is the control surface for every other gap in this report (a plan upgrade instantly unlocks features elsewhere) |
| Moodle content/quiz **authoring** (vs. consuming) | Institute Admin, Teacher | Moodle is meant to be fully headless per the UX plan, but authoring tools aren't reproduced anywhere in the new UI yet |
| Recordings playback UI | Institute Admin, Teacher, Student | `live-class/:meetingId/recordings` endpoint exists, `recordings` flag exists, no page consumes it anywhere |
| Leave-request approval loop | Institute Admin | Submission side exists (Parent/Student), approval side doesn't |

---

## 8. Recommended Build Priority

1. **Student "Tests" page** (unlocks a fully-built backend module) 
2. **Fee payment wiring** (Razorpay component → Profile/Fees pages, Student + Parent) 
3. **Super Admin Plans & Feature Flags screen** (this is the lever for everything else — institutes can't self-discover or be sold new features without it) 
4. **Recordings library** (Institute/Teacher/Student) 
5. **Parent-specific navigation split** from the shared student shell 
6. **Teacher-side Moodle authoring + grade entry** (closes the "headless LMS" loop properly) 
7. **Bulk import screen, Instructor directory, Leave approval inbox** (institute admin quality-of-life)

---

## 9. Summary Table — Interface Coverage vs. Feature Catalog

| Feature key | Super Admin | Institute Admin | Teacher | Student | Parent |
|---|:---:|:---:|:---:|:---:|:---:|
| student_management | manage plan | ✅ full | view own batch | own profile | child profile |
| batches | ✅ view all | ✅ full | ✅ assigned | ✅ enrolled | via child |
| teacher_portal | manage plan | assign | ✅ home | – | – |
| parent_portal | manage plan | – | – | shared shell | ✅ (shared shell, gap: nav) |
| attendance_manual | – | ✅ | ✅ | view own | view child's |
| attendance_rfid | – | ✅ live feed | ❌ gap | – | – |
| schedule | – | ✅ | via batches | ✅ | ✅ |
| grades | – | ✅ | ❌ gap (entry) | ✅ view | ✅ view |
| fees_management | – | ✅ | – | ✅ view | ✅ view |
| online_payments | – | config keys | – | ❌ gap (wiring) | ❌ gap (wiring) |
| live_classes | – | ❌ gap (monitor) | ✅ start/join | ✅ join | – |
| moodle_lms | – | ❌ gap (authoring) | ❌ gap (authoring) | ✅ consume | – |
| online_tests | – | ✅ manage | ❌ gap (authoring) | ❌ **gap (missing)** | – |
| analytics | ✅ | ✅ embedded | – | – | – |
| notifications | – | ✅ center | – | partial | partial |
| communication | template mgmt gap | ✅ | ❌ gap | receive | receive |
| bulk_import | – | ❌ gap (dedicated UI) | – | – | – |
| custom_branding | assign per tenant | ✅ settings | – | – | – |
| recordings | – | ❌ gap | ❌ gap | ❌ gap | – |
| api_proxy | ✅ explorer | – | – | – | – |

*(✅ = built and shipping · ❌ gap = backend/flag exists, UI missing · "–" = not applicable to that role)*

---

**Bottom line:** the platform's backend already speaks for nearly the entire OSS stack (ERPNext, Moodle, BigBlueButton, ClickHouse/Metabase, Novu, Razorpay) through a clean, feature-flagged Gateway. The frontend across all 5 personas is ~75% complete against that surface. The fastest path to "the UI contains all the features of our open-source system" is the priority list in §8, not a rebuild — most of the wiring already exists.