# CoachingOS — Frontend Master Build Specification
### For AI coding agents / developers · Consolidates all prior analysis into one executable spec

> **Source documents this consolidates:** `DEEP_UI_ANALYSIS.md`, `CoachingOS_Architecture_v2/v3.md`, `Source_Code_API_Report.md`, `CoachingOS_UI_UX_Plan.md`, `features.md` (Moodle, ERPNext, BigBlueButton, Metabase, Novu, Frappe Education, plus the backend they sit behind).
>
> **Read this document top to bottom before writing any code.** It is the single source of truth going forward — where older docs disagree with each other, this one wins.

---

## 0. Verdict on Your 3-Interface Idea

**You are directionally correct, with one important correction the codebase itself already made:**

| Your framing | Corrected framing | Why |
|---|---|---|
| 1. SaaS Admin Panel (God-mode) | ✅ Same — **Super Admin Panel** (web) | Correct as described |
| 2. Coaching Institute panel (LMS+ERP+Teacher) | ✅ Same, but it's actually **two personas sharing one web app**: Institute Admin + Teacher | Admins and teachers need different nav/permissions but identical design system and component library — build as one Next.js app, two route groups |
| 3. Student app (+ Parent) | ✅ Correct that Parent isn't a 4th surface — **Parent is a role inside the Student mobile+web experience**, not a separate app | Building a standalone Parent app would duplicate ~90% of the Student UI. The existing backend already models parents as `role: 'parent'` with a `ParentChildSelector` that scopes all API calls to a chosen child. Keep this. |

So the real shape is **3 codebases, 5 personas**:

```
┌─────────────────────────────────────────────────────────────────┐
│  APP 1 — Super Admin Panel        (Next.js web)   → 1 persona   │
│  APP 2 — Institute Panel           (Next.js web)   → 2 personas  │
│           (Institute Admin + Teacher, shared shell, split nav)  │
│  APP 3 — Student/Parent App        (Expo/React Native mobile     │
│           + a lightweight Next.js web companion)  → 2 personas  │
└─────────────────────────────────────────────────────────────────┘
```

This matches what's already scaffolded:
`web/app/superadmin`, `web/app/institute`, `web/app/teach`, `web/app/learn` (student+parent), `mobile/app/(student)`, `mobile/app/(teacher)`. **Nothing needs to be re-architected — it needs to be filled in and polished.** The backend (NestJS Gateway with 14 modules, feature-flag system, ERPNext/Moodle/BBB/Metabase/Novu/Razorpay adapters) is already production-shaped per `CoachingOS_Architecture_v3.md`. This spec is scoped to **frontend only**.

---

## 1. The Feature Catalog (bind every screen to this — do not skip)

The platform is plan-gated (`starter` / `growth` / `professional` + per-tenant overrides). Every screen you build must be wrapped in the existing `<FeatureGate>` component keyed to one of these:

| Key | Underlying OSS | Starter | Growth | Pro |
|---|---|:---:|:---:|:---:|
| `student_management`, `batches`, `teacher_portal`, `parent_portal` | ERPNext | ✅ | ✅ | ✅ |
| `attendance_manual`, `schedule`, `fees_management` | ERPNext | ✅ | ✅ | ✅ |
| `attendance_rfid` | RFID Service | – | ✅ | ✅ |
| `grades`, `online_payments`, `live_classes`, `moodle_lms`, `online_tests` | ERPNext/Razorpay/BBB/Moodle | – | ✅ | ✅ |
| `analytics` | ClickHouse/Metabase | – | ✅ | ✅ |
| `notifications`, `communication`, `bulk_import` | Novu/Gateway | – | ✅ | ✅ |
| `custom_branding`, `recordings`, `api_proxy` | Gateway/BBB/Proxy | – | – | ✅ |

**Rule for the AI agent:** when a task references "add feature X," first check this table for its key and plan tier, then wrap the new UI in `<FeatureGate feature="X">`. Never hard-code a feature as always-visible unless it's in the "core" row above.

---

## 2. Design System — One Language, Three Moods

All three apps share **tokens, spacing scale, and component primitives** (so the codebase stays one design system), but each app gets its own **surface mood** — this is what makes it feel like three distinct, purpose-built products instead of one reskinned admin panel (the PW reference: their student app, faculty portal, and internal ops console all clearly share a typographic DNA but look nothing alike in mood).

### 2.1 Shared foundation (all 3 apps)

- **Font:** Inter (already vendored from the Education/Frappe UI  — reuse those `.woff2` files, don't re-download) for UI text; a monospace (Geist Mono / JetBrains Mono) for IDs, tokens, logs.
- **Spacing scale:** 4px base — 4/8/12/16/24/32/48/64/96/128.
- **Radius scale:** sm 4px · md 8px · lg 12px · xl 16px · full 9999px.
- **Component primitives:** extend the existing `web/components/ui/*` (already shadcn-pattern: button, card, dialog, input, select, table, tabs — built on Radix + CVA + Tailwind). Do not introduce a second component library. Add the missing primitives: `Switch`, `Checkbox`, `Radio`, `DatePicker`, `Slider`, `Skeleton`, `Toast` (Sonner already installed), `Avatar`, `ProgressRing`, `Badge` (exists), `EmptyState`, `KPICard`.
- **Motion:** Framer Motion (already installed) — page transitions, list stagger, skeleton→content fade. Keep under 200ms; this is a data-heavy enterprise tool, not a marketing site.
- **Icons:** lucide-react (already installed).

### 2.2 App 1 — Super Admin Panel: "Mission Control"

**Mood:** Dark, dense, technical, zero warmth — this is a God-mode operations console, not a consumer product. Think Vercel dashboard / Datadog / GitHub's dark theme, or Metabase's own admin surfaces.

```ts
// web/lib/tokens/platform.ts
export const platform = {
  bg:       '#0D1117',
  surface:  '#161B22',
  elevated: '#21262D',
  border:   '#30363D',
  text:     '#F0F6FC',
  muted:    '#8B949E',
  accent:   '#6E40C9',   // violet — reserved for this app only, never bleeds into institute/student apps
  success:  '#3FB950',
  warning:  '#D29922',
  danger:   '#F85149',
};
```

- Dense data tables (borrow ERPNext Desk's list-view column density and inline filters — see §3.2), not card grids.
- Persistent left sidebar, not a collapsible hamburger — an ops console is used at a desk, not on the move.
- Every page opens with a KPI strip (borrow Metabase's number-card layout — see §3.4) before the detail table.
- Status pills everywhere (tenant health, service health) — borrow BBB's connection-quality indicator pattern (small colored dot + label) for the `/superadmin/health` service dependency grid.

### 2.3 App 2 — Institute Panel: "Professional Workspace"

**Mood:** Light, clean, high-information-density but warm — this is where institute staff spend 8 hours a day. Borrow ERPNext Desk's form/table density (it's genuinely good at data entry) but replace its dated Bootstrap chrome with the shared shadcn system.

```ts
// web/lib/tokens/institute.ts
export const institute = {
  bg:      '#F6F8FA',
  surface: '#FFFFFF',
  border:  '#D0D7DE',
  text:    '#1F2328',
  muted:   '#59636E',
  primary: 'var(--inst-primary)',  // dynamic — pulled from tenant branding (custom_branding flag)
  success: '#1A7F37',
  warning: '#9A6700',
  danger:  '#CF222E',
};
```

- Sidebar nav differs by persona within the same shell:
  - **Institute Admin:** Dashboard → Students → Batches → Schedule → Attendance → Grades → Finance → Exams (Moodle) → Communication → Staff → Settings
  - **Teacher:** My Batches → Attendance → Live Classes → Grades → Content (Moodle authoring) → Communication
- Data tables use ERPNext's list-view interaction pattern: inline column filters, saved views, bulk row selection with a floating action bar, right-click/kebab row actions.
- Forms use ERPNext's **section-break layout** (grouped fieldsets with headers, 2-column responsive) — this is the one thing Frappe Desk does better than most SaaS admin tools; replicate the *structure*, not the visual chrome.

### 2.4 App 3 — Student/Parent App: "Study Companion" (PW-style)

**Mood:** Light, soft, encouraging — explicitly **not** the dark "AI product" look. Reference points: Physics Wallah app, Byju's, Moodle's own mobile app course cards (simplified). Rounded cards, soft shadows, a single confident accent color, generous illustration/empty-states, streaks and progress rings for motivation.

```ts
// mobile/lib/tokens.ts
export const mobile = {
  light: {
    bg:     '#F4F6FA',
    card:   '#FFFFFF',
    border: '#E5E7EB',
    text:   '#111827',
    muted:  '#6B7280',
    accent: '#2563EB',   // confident blue, PW-adjacent — swap per tenant if custom_branding is on
    success:'#16A34A',
    streak: '#F59E0B',
  },
  dark: {  // optional toggle, not default — student preference, not forced "AI dark mode"
    bg: '#0F1117', card: '#1A1D25', border: '#2A2D35', text: '#F9FAFB', muted: '#9CA3AF',
  },
};
```

- Bottom tab bar (5 tabs max), large touch targets, no dense tables — ever. If data is tabular (grades, attendance %), render as a card list with a progress ring or colored badge, not a `<table>`.
- Course cards borrow Moodle's **course card + completion ring** pattern (from `course/format/templates/local/content/cm.mustache` — see §3.1) but restyled soft/rounded.
- Parent mode reuses every screen but swaps the **tab set** (Home / Attendance / Fees / Timeline / Profile — no Courses/Tests tab) and adds a **child switcher** pinned under the header.

---

## 3. Open-Source UI → CoachingOS Component Extraction Map

This is the literal answer to *"make sure the frontend has all the features and UI patterns of the open-source systems."* Below is what to study from each  and what to build from it. **None of these are wrapped as-is except BBB and Metabase (iframe) — everything else is a from-scratch React rebuild of the interaction pattern, not a code port.**

### 3.1 Moodle → Student LMS surface

Study (already in `moodle`):
- `course/format/templates/local/content/cm.mustache` — activity card layout → build `<ActivityCard>` (icon, title, completion ring, type badge).
- `course/format/templates/local/activitychooser/` — the "add content" picker grid → build `<ContentTypePicker>` for teacher authoring (Phase 3).
- `mod/quiz/*` — question-by-question navigation, timer, attempt review screen → build `<QuizRunner>` (see §5, this is the **#1 priority gap** — backend fully built, zero frontend).
- `mod/forum/*` — threaded discussion pattern → build `<DiscussionThread>` (Phase 3, optional per roadmap).
- `mod/assign/*` — submission upload + rubric grading → build `<AssignmentUploader>` + `<RubricGrader>`.
- `grade/templates/grades/grader/` — the grading table layout → informs the Teacher "Grade entry" screen.

Build as: `web/components/learn/*` (student web) + mirrored RN components in `mobile/components/learn/*`. **Never expose Moodle's own PHP pages** — everything goes through `gateway/lms` and `gateway/tests` endpoints.

### 3.2 ERPNext / Frappe Desk → Institute Admin data workflows

Study (`erpnext`, `education`):
- Frappe Desk list-view: inline filters, saved views, bulk select+action bar, global search — build `<DataTable>` as the one shared enterprise table component used across every Institute Admin list page (Students, Batches, Finance, Staff, Audit Logs).
- Frappe form section-break layout — build `<FormSection>` wrapper (title + 2-col responsive grid) used in Student profile edit, Batch creation, Fee schedule setup.
- `education/frontend/src/stores/*.js` (the Vue Education portal — `session.js`, `student.js`, `leave.js`) — these show exactly which fields/shapes the ERPNext Education doctype exposes for Attendance, Fees, Grades, Leave. **Use these as the authoritative field lists** when building the Institute/Teacher/Student forms that touch those doctypes, since they reflect the real schema, not a guess.
- Frappe's Kanban/Report Builder charts → informs `/institute/dashboard` KPI + chart layout (reuse Metabase for actual charts — see 3.4 — don't rebuild a charting engine).

### 3.3 BigBlueButton → Live Classes

Study (`bbb_ui`):
- `meetingClient.jsx` / the HTML5 client shell — confirms BBB is designed to be embedded full-screen via iframe with a join URL; **do not attempt to rebuild the video/webRTC layer.**
- Sound/notification assets (`userJoin.mp3`, `handRaise.mp3`, connection-quality indicator patterns) — reuse the *interaction language* (small toast + sound on join/leave, hand-raise badge) in the CoachingOS chrome that wraps the iframe.

Build: `<LiveClassFrame>` = branded header (institute logo, "Doubt Chat" side panel that talks to your own chat backend, not BBB's) + `<iframe src={bbbJoinUrl}>` filling the rest of the viewport. This is the **only component in the whole system that should be an iframe wrap rather than a rebuild** — confirmed correct in `CoachingOS_UI_UX_Plan.md` §2.4 and unchanged in this spec.

### 3.4 Metabase → Analytics embeds

Study (`metabase`):
- Its dashboard grid + number-card + chart-card layout (`frontend/src/metabase/dashboard`) — informs the visual grammar of every KPI strip in all 3 apps (`KPICard` component), even though the actual charts are embedded via signed iframe, not rebuilt.
- Its `documents` module (rich embeddable report cards) — optional inspiration for a future "share a report" feature; not required for MVP.

Build: `<MetabaseEmbed dashboardId slug filters />` — generates a JWT via the gateway's `metabase.adapter.ts`, embeds via signed iframe URL, injects `institute_id`/tenant filter server-side so a tenant can never see another tenant's data through the embed (already a stated requirement in Architecture v3's tenant-isolation section — the frontend's job is just to always pass the resolved tenant filter, never let the user override it).

### 3.5 Novu → Notifications

Study (`novu`):
- `apps/dashboard/src/context/*` (auth, region, segment providers) — this is the internal Novu console; per the existing UX plan, **only Super Admins get this**, embedded/linked from `/superadmin/notifications` for template management.
- For everyone else, use the already-installed `@novu/notification-center` React package (`NovuBell` component) — a bell icon + dropdown feed. Confirm it's wired into the header of **all three apps'** top nav, not just referenced in `components/notifications/`.

### 3.6 Frappe Education Vue frontend → field/flow reference only

`education`'s Vue SPA (`session.js`, `leave.js`, `student.js` stores) is **deprecated as UI** (per existing decision) but stays valuable as a **schema reference** — when you're not sure what fields a Leave Request or Fee Schedule needs, check these store files before guessing.

---

## 4. Route Inventory & Build Status (all 3 apps)

Legend: ✅ built · ⚠️ built but incomplete/not wired · ❌ missing entirely — **P0/P1/P2/P3** = priority tier (P0 first).

### 4.1 App 1 — Super Admin (`web/app/superadmin/*`)

| Route | Status | Priority | Notes |
|---|:---:|:---:|---|
| `/superadmin/dashboard` | ✅ | — | Keep |
| `/superadmin/tenants`, `/tenants/[id]` | ✅ | — | Keep; extend create-flow to show ERPNext company + Moodle category provisioning steps (P2) |
| `/superadmin/analytics` | ✅ | — | Keep |
| `/superadmin/audit-logs` | ✅ | — | Keep |
| `/superadmin/health` | ✅ | — | Keep |
| `/superadmin/security` | ✅ | — | Static, low priority to polish |
| `/superadmin/proxy` | ✅ | — | Keep — developer console, low-chrome is fine here |
| `/superadmin/plans` | ⚠️ scaffolded, needs the feature-matrix UI | **P0** | Grid of `FEATURE_CATALOG` grouped by category × toggle matrix per tenant, backed by existing `superadmin/features/catalog` + `tenants/:id/features` endpoints. **This is the single highest-leverage screen in the whole platform** — it's the on/off switch for every other gap in this document. |
| `/superadmin/notifications` | ❌ | P2 | Link/embed Novu dashboard template management (Super Admin only) |
| Global module kill-switches (BBB/Moodle/Novu platform-wide) | ❌ | P3 | Maintenance-mode toggles |
| Cross-tenant billing/MRR rollup | ❌ | P3 | Razorpay aggregate across tenants |

### 4.2 App 2 — Institute Panel

**Admin (`web/app/institute/*`):**

| Route | Status | Priority | Notes |
|---|:---:|:---:|---|
| `/institute/dashboard` | ✅ | — | Keep |
| `/institute/students` (+`/new`, `/[erpId]`, `/import`) | ⚠️ import route exists but no stepper UI | **P1** | Build CSV import wizard: upload → column mapping → validation → commit progress |
| `/institute/batches` | ✅ | — | Keep |
| `/institute/schedule` | ✅ | — | Keep |
| `/institute/attendance` | ✅ | — | Keep |
| `/institute/grades` | ✅ (view only) | — | Keep as admin oversight view |
| `/institute/finance` | ✅ | — | Keep |
| `/institute/exams` | ✅ (manage) | — | Keep |
| `/institute/communication` | ✅ | — | Keep |
| `/institute/staff` | ⚠️ route exists, no directory UI | **P2** | Institute-level Staff/Instructor directory: list, invite, deactivate, view assigned batches |
| `/institute/live-classes` | ⚠️ route exists | **P2** | Cross-batch live-class monitor for admins + recordings library entry point |
| `/institute/recordings` | ⚠️ route exists, unwired | **P2** | Consume `live-class/:meetingId/recordings` — table of past recordings with publish/unpublish |
| `/institute/leave-requests` | ⚠️ route exists, no approval UI | **P2** | Approval inbox — list pending leave requests (submitted via `education-portal/students/:id/leave`) with approve/reject |
| `/institute/settings` | ✅ | — | Keep |
| Moodle course/catalog management for admins | ❌ | **P1** | Institute admins currently have no way to organize Moodle courses without touching Moodle directly — build a course catalog manager (publish/hide/order courses per batch) |

**Teacher (`web/app/teach/*`):**

| Route | Status | Priority | Notes |
|---|:---:|:---:|---|
| `/teach` (home) | ✅ | — | Keep |
| `/teach/batches` | ✅ | — | Keep |
| `/teach/attendance` | ✅ | — | Keep |
| `/teach/attendance-rfid` | ⚠️ route exists | P2 | Read-only RFID live feed scoped to teacher's own batch |
| `/teach/live-class` | ✅ | — | Keep |
| `/teach/recordings` | ⚠️ route exists | P2 | Teacher publish/unpublish own recordings |
| `/teach/courses`, `/teach/courses/[courseId]` | ⚠️ routes exist, no authoring UI | **P1** | Moodle content upload + quiz authoring — biggest "headless LMS" loop gap |
| `/teach/tests` | ⚠️ route exists | **P1** | Quiz/test creation flow (pairs with student-side QuizRunner) |
| `/teach/assessments` / `/teach/grades` | ⚠️ | **P1** | Grade entry form (currently grades are admin-view-only; teachers need to submit them) |
| `/teach/communication` | ⚠️ route exists, scope unclear | P2 | Extend `communication` module access to per-batch broadcast (currently admin-only) |

### 4.3 App 3 — Student/Parent

**Web companion (`web/app/learn/*`):**

| Route | Status | Priority | Notes |
|---|:---:|:---:|---|
| `/learn` (home) | ✅ | — | Keep |
| `/learn/courses`, `/[batchId]` | ⚠️ incomplete per DEEP_UI_ANALYSIS | **P1** | Chapter accordion, HLS video player, watermarked PDF viewer, per-chapter progress ring |
| `/learn/tests`, `/[quizId]` | ❌ **completely missing** | **P0** | Highest-priority gap in the entire system — backend (`tests/list`, `attempt/start`, `attempt/submit`, `attempt/:id/review`) is fully built with zero frontend. Build `<QuizRunner>` per §3.1/§5. |
| `/learn/grades` | ✅ | — | Keep |
| `/learn/schedule` | ✅ | — | Keep |
| `/learn/timeline` | ✅ (generic) | P2 | Differentiate visually for parent mode (richer, photo/milestone-forward) |
| `/learn/profile` | ⚠️ shows fees, "Pay Now" not wired | **P0** | Wire the existing `RazorpayCheckout` component (already built, unconnected) into this page's Pending Fees card |
| `/learn/live-class/[meetingId]` | ✅ | — | Keep |
| `/learn/recordings` | ⚠️ route exists | P2 | Past-classes tab for missed live sessions |
| Leave request submission | ❌ no UI entry point | P2 | Endpoint exists (`education-portal/students/:id/leave`), needs a form (Student + Parent) |
| Parent-specific nav split | ⚠️ nav items identical for student/parent today | **P1** | Swap tab set by `role === 'parent'`: Home / Attendance / Fees / Timeline / Profile (hide Courses/Tests, or show "child in class now" read-only state) |
| Notification bell in header | ⚠️ component exists, confirm it's mounted in `learn/layout.tsx` | P1 | Quick wiring check |

**Mobile (`mobile/app/(student)/*`, `(teacher)/*` — add `(parent)` mode via shared student stack):**

| Screen | Status | Priority |
|---|:---:|:---:|
| `(student)/home.tsx` | ✅ | — |
| `(student)/courses/*` | ⚠️ scaffolded | **P0** — mirror the web course viewer |
| Test-taking flow | ❌ | **P0** — mirror web `<QuizRunner>` |
| Fee payment (Razorpay RN SDK) | ❌ | **P0** |
| `(teacher)/*` beyond home | ⚠️ home only | **P0** — attendance marking + live-class start are the two things teachers do *in the room*; prioritize mobile over web polish for these two |
| Parent mode (child selector, multi-child dashboard) | ❌ | **P1** |
| Push notification registration (FCM token) | Check `mobile/lib` | P1 |

---

## 5. Priority-Ordered Build Plan (what the AI agent should do, in order)

This sequencing maximizes "unlocks a fully-built backend module" and "connects an already-built component" wins before touching anything net-new.

**Phase 0 — Connect what's already built (days, not weeks)**
1. Wire `RazorpayCheckout` into `/learn/profile` Pending Fees card (Student + Parent, web + mobile).
2. Confirm `NovuBell` is mounted in all three apps' header nav.
3. Confirm `<FeatureGate>` wraps every route listed above with the correct catalog key.

**Phase 1 — Close the single biggest gap: Student Tests**
4. Build `<QuizRunner>` (web `web/components/learn/QuizInterface.tsx` + RN mirror): question nav, timer, multi-question-type rendering, submit confirmation, post-submit review mode with score/rank. Bind to `tests/list`, `tests/attempt/start`, `tests/attempt/submit`, `tests/attempt/:id/review`.
5. Build `/learn/tests` list page + `/learn/tests/[quizId]` runner page (web) and mobile equivalents.

**Phase 2 — Super Admin control surface**
6. Build `/superadmin/plans` — feature/plan matrix. This unlocks self-serve visibility into every other gap for the ops team.

**Phase 3 — Course content viewer (Moodle-backed)**
7. Build `<CourseContentViewer>`: chapter accordion, HLS video player, watermarked PDF viewer, progress ring — web + mobile. Bind to `lms/courses/:id/content`.

**Phase 4 — Teacher authoring loop (closes "headless LMS" properly)**
8. Teacher-side quiz authoring (`/teach/tests` create flow) and Moodle content upload (`/teach/courses/[courseId]`).
9. Teacher grade-entry form (`/teach/grades` or `/teach/assessments`).

**Phase 5 — Institute admin quality-of-life**
10. Bulk CSV import wizard (`/institute/students/import`).
11. Staff/Instructor directory (`/institute/staff`).
12. Leave-request approval inbox (`/institute/leave-requests`).
13. Moodle course catalog manager for admins.

**Phase 6 — Recordings + live-class monitoring (cross-role)**
14. `<LiveClassFrame>` recordings library, wired into Institute Admin, Teacher, and Student surfaces.
15. Institute Admin cross-batch live-class monitor.

**Phase 7 — Parent-mode polish**
16. Parent-specific nav split + multi-child dashboard rollup card + richer parent timeline.

**Phase 8 — Mobile parity push**
17. Mobile: course viewer, test-taking, fee payment (Razorpay RN), teacher attendance + live-class start, parent mode. Mobile currently trails web significantly and Student/Parent is explicitly meant to be the mobile-first surface — do not let this phase slip.

**Phase 9 — Super Admin nice-to-haves**
18. Novu template management link, cross-tenant billing rollup, module kill-switches.

---

## 6. Engineering Conventions (apply across all phases)

- **API client:** reuse `web/lib/api-client.ts` (Axios + Zustand auth store + refresh-token interceptor) as-is — do not introduce a second HTTP client. Mirror the same pattern in `mobile/lib`.
- **Data fetching:** TanStack Query everywhere for server state; Zustand only for client/auth/UI state. Every list page: `useQuery` + `<Skeleton>` loading state + `<EmptyState>` for zero-results — these three states are mandatory for every new screen, not optional polish.
- **Feature gating:** `<FeatureGate feature="online_tests">...</FeatureGate>` wraps the route content; nav items use the existing `INSTITUTE_NAV_FEATURES` map — extend it, don't bypass it, when adding nav entries in Phases 2–9.
- **Role gating:** `<AuthGuard allowedRoles={[...]}>` per route group, matching the existing pattern in `learn/layout.tsx`.
- **Tenant isolation:** any component touching Metabase embeds, ERPNext data, or cross-tenant views must pass `instituteId` server-side (from the JWT-resolved tenant), never accept it as a client-editable filter — this is a hard security rule carried over from Architecture v3, not a frontend nicety.
- **Component reuse discipline:** before building a new component, check `web/components/{shared,ui,learn,attendance,payments,notifications,auth}` — if something 80% matches, extend it with a variant prop rather than forking.
- **Design tokens:** import from `web/lib/tokens/{platform,institute}.ts` and `mobile/lib/tokens.ts` (create these three files per §2 if they don't exist yet) — never hardcode hex values in components.
- **Definition of done for every screen in §4:** loading state, empty state, error state, feature-gated, role-gated, mobile-responsive (web apps) or tested on both iOS/Android simulators (mobile app), and bound to a real gateway endpoint (no mock data left in the shipped component).

---

## 7. What NOT to Do

- Do **not** expose Moodle's PHP UI, ERPNext's Frappe Desk, or Frappe Education's Vue SPA to any end user — all three stay headless/deprecated, confirmed across every prior doc and unchanged here.
- Do **not** rebuild BigBlueButton's video/WebRTC client — iframe-wrap it.
- Do **not** rebuild Metabase's charting engine — iframe-embed with a signed JWT.
- Do **not** build a 4th "Parent app" codebase — it's a role inside App 3.
- Do **not** introduce a second component library (e.g., MUI, Ant) alongside the existing Radix/shadcn/Tailwind system.
- Do **not** ship a new screen without a feature-flag wrapper — every capability in §1 must remain toggleable per-tenant, that's the whole point of the plan-gated SaaS model.

---

## 8. Immediate Next Step

Hand this document to the AI coding agent with instruction: **"Execute Phase 0 and Phase 1 from §5 first."** Those two phases alone close the two highest-impact gaps (fee payments not wired despite a built component; the entire student Tests module missing despite a complete backend) and are achievable without any new backend work — everything they need already exists in `gateway/src/modules/fees` and `gateway/src/modules/tests`.
