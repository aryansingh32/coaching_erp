# CoachingOS — AI Build Instructions
### Read this before writing any code. Companion doc: `CoachingOS_Interface_Feature_Report.md`

---

## 0. Directive: Extend, Do Not Rebuild

**Do not scaffold a new frontend, new auth system, new API client, or new design system.** The existing codebase in `coachingos_core_clean.zip` already has:

- A working NestJS Gateway (`gateway/src/modules/*`) with 14 modules covering ERPNext, Moodle, BigBlueButton, ClickHouse/Metabase, Novu, and Razorpay.
- A working feature-flag system (`feature-catalog.ts`, `FeaturesService`, `<FeatureGate>`) that gates every screen by tenant plan (`starter`/`growth`/`professional`).
- A working Next.js app (`web/`) with 5 route groups (`superadmin`, `institute`, `teach`, `learn`, shared `login`), an Axios/React-Query API layer (`web/lib/api/{hooks,services,types,query-keys}.ts`), Zustand auth store, and a Shadcn/Tailwind component library.
- A working Expo mobile app (`mobile/app/*`) with auth + student/teacher home screens.

**Your job is gap-filling, not greenfield.** Every task below names the exact existing pattern to copy. Deviating from these patterns (new state library, new HTTP client, new component kit, new auth flow) is out of scope unless explicitly instructed.

Before starting any task:
1. `unzip coachingos_core_clean.zip` and actually read the target directory's siblings first (e.g. before building `/learn/tests`, read all of `/learn/grades/page.tsx`, `/learn/courses/page.tsx`, and `lib/api/hooks.ts` to see the existing data-fetching pattern).
2. Reuse `useQuery`/`useMutation` hooks from `web/lib/api/hooks.ts` — add new hooks there following the existing naming convention, don't inline fetch calls in pages.
3. Reuse `Card`, `Table`, `Badge`, `Button`, `Tabs`, `Dialog` from `web/components/ui/*` — do not introduce a different component library.
4. Every new page must be wrapped in the existing `<FeatureGate feature="...">` pattern if it maps to a catalog key, and `<AuthGuard allowedRoles={[...]}>` at the layout level.
5. Do not touch `/mnt/skills` equivalents — if this is executed in Claude Code, treat existing lint/format config (`.eslintrc`, `tsconfig`) as fixed; match existing code style exactly.

---

## 1. Priority Order (build in this sequence — each is independently shippable)

### P0 — Student Online Tests page (biggest gap: backend done, zero UI)
**Files to create:**
- `web/app/learn/tests/page.tsx` — list available quizzes for the student's enrolled batches. Source: `GET tests` (gateway `tests.controller.ts`).
- `web/app/learn/tests/[quizId]/attempt/page.tsx` — attempt-taking UI: start attempt (`POST tests/:quizId/attempt/start`), render questions, submit (`POST tests/attempt/:attemptId/submit`).
- `web/app/learn/tests/[quizId]/review/[attemptId]/page.tsx` — post-submit review (`GET tests/attempt/:attemptId/review`).

**Do:**
- Add `useTests()`, `useStartAttempt()`, `useSubmitAttempt()`, `useAttemptReview()` hooks to `web/lib/api/hooks.ts`, matching the pattern of the existing `useParentChildren()` hook (source/name it after `education-portal` hooks already there).
- Gate the nav link and page behind `feature="online_tests"`.
- Add `Tests` to `navItems` in `web/app/learn/layout.tsx` (student-facing only — see P4 for parent nav split).
- Handle attempt-in-progress state (timer, resume) — check if Moodle Quiz API (proxied via gateway) returns a `timelimit`; if so, add a countdown using the same pattern as any existing timer/countdown component in `web/components/shared/`. If none exists, build a minimal one — don't import a new dependency.

**Acceptance:** A student with `online_tests` enabled can see quizzes for their batch, start one, answer questions, submit, and view their score/review. A student without the flag sees the existing `<FeatureGate>` "not included in your plan" card.

---

### P1 — Wire Razorpay checkout into Fee pages (component exists, not connected)
**Files to touch:**
- `web/app/learn/profile/page.tsx` — the "Pending Fees" card currently displays amount only. Add a "Pay Now" button that opens `web/components/payments/razorpay-checkout.tsx`.
- Confirm the checkout component calls the existing gateway flow: `POST fees/razorpay/order` → Razorpay JS SDK → `POST fees/razorpay/verify` on success. Read `razorpay-checkout.tsx` first; if the order/verify calls are already implemented inside it, you only need to render it and pass `studentId`/`amount` props — do not reimplement Razorpay logic.
- Same wiring for the Parent view (same page, since Parent shares the `/learn` shell) — use `useActiveStudentId()` from `parent-child-selector.tsx` to scope which child's fees are being paid.
- After successful payment, invalidate the pending-fees query (`queryClient.invalidateQueries` on the relevant `query-keys.ts` entry) so the UI updates without a refresh.

**Acceptance:** Student and parent can both pay a pending fee end-to-end and see the balance update immediately after.

---

### P2 — Super Admin: Plans & Feature Flags screen (unlocks self-serve upsell + fixes every other gap's rollout path)
**Files to create:**
- `web/app/superadmin/plans/page.tsx`

**Do:**
- Fetch `GET superadmin/features/catalog` to render `FEATURE_CATALOG` grouped by `category` (core/academics/finance/communication/analytics/integrations) — use `Tabs` component for category switching, matching `web/app/superadmin/analytics/page.tsx`'s layout style.
- For a selected tenant (reuse the tenant selector pattern from `/superadmin/tenants/[id]`), show a toggle grid: each feature key with a switch reflecting `resolved` state from `GET superadmin/tenants/:id/features`.
- On toggle, call `PUT superadmin/tenants/:id/features` with the diff, optimistic-update via React Query mutation, matching the mutation pattern already used in `superadmin/tenants/page.tsx`'s suspend action.
- Add "Plans & Features" to the superadmin nav in `web/app/superadmin/layout.tsx`.
- Visually distinguish "on because of plan default" vs "on because of manual override" (compare `overrides` vs `resolved` from the API response — both are already returned by `getTenantFeatures`).

**Acceptance:** A super admin can open any tenant, see all 20 feature keys with plan defaults, override individual ones, save, and have those overrides immediately reflected the next time that tenant's users load the app (since `auth/features` already returns resolved flags on login).

---

### P3 — Recordings library (Institute Admin, Teacher, Student)
**Backend confirmation first:** `live-class.controller.ts` already has `GET :meetingId/recordings`. No backend work needed unless recordings aren't actually persisted — check `live-class.service.ts` for a `listRecordings`/BBB `getRecordings` call before assuming backend is done.

**Files to create:**
- `web/app/institute/live-classes/page.tsx` (new nav item, admin-wide monitor across all batches — currently live-class only exists in Teacher portal)
- `web/app/teach/recordings/page.tsx` (teacher's own recordings, publish/unpublish toggle if the API supports it — check for an `updateRecordings`/`publishRecordings` capability in the adapter before building UI for it; if absent, list-only is fine for v1)
- `web/app/learn/recordings/page.tsx` (student/parent "past classes" tab)

**Do:** Gate all three behind `feature="recordings"` and `feature="live_classes"` respectively. Reuse the existing BBB embed/iframe pattern from `web/app/learn/live-class/[meetingId]/page.tsx` for playback if recordings are embeddable; otherwise link out to BBB's playback URL.

**Acceptance:** Each of the three roles has a working "past recordings" list scoped correctly (admin sees all, teacher sees own, student/parent sees their batch's).

---

### P4 — Parent-specific navigation (currently identical to Student nav)
**File to touch:** `web/app/learn/layout.tsx`

**Do:**
- `navItems` is currently hardcoded identically for both roles. Read `role` from `useAuthStore` (already imported in this file) and branch:
  - Student: `Home / Courses / Tests / Schedule / Timeline / Profile`
  - Parent: `Home / Attendance / Fees / Timeline / Profile` (no Courses/Tests/Live Class — parents don't take classes)
- Add a rollup summary card to `/learn` (home) for parent role only: total pending fees across all linked children, using `linkedStudents`/`children` already available via `useParentChildren()`. Follow the multi-child aggregation described in the report §6.2.4 — sum `fees/pending/:studentId` across each child ID.
- Do not fork the route structure — same pages, role-conditional content within them (this matches how `<ParentChildSelector>` already works: one shell, scoped data).

**Acceptance:** Logging in as `parent` shows a different, appropriately-scoped nav than logging in as `student`, without any route duplication.

---

### P5 — Teacher-side Moodle authoring + grade entry (closes the "headless LMS" loop)
This is the largest task — treat it as its own mini-project, do not combine with other P-items in one PR.

**Files to create:**
- `web/app/teach/grades/page.tsx` — grade entry form per batch/student, submitting to whatever ERPNext Assessment-creation call the `lms`/`education-portal` adapters expose. **Before building:** check `gateway/src/adapters/erpnext/*` for an existing "create assessment result" method; if the adapter doesn't have a write method yet (only reads), you must add one there first (`gateway/src/adapters/erpnext/education.adapter.ts` pattern), then a controller endpoint in `gateway/src/modules/lms` or a new `grades` sub-route — check with the report's finding that grades are currently read-only end-to-end.
- `web/app/teach/courses/page.tsx` + `[courseId]/upload` — course content upload flow. Same caveat: confirm whether `lms.controller.ts` / Moodle adapter has a write path (`core_course_create_courses`, file upload webservice functions) before building the frontend. If the adapter is read-only, backend work is required first — flag this explicitly to the user rather than building a UI with no working backend.
- `web/app/teach/tests/page.tsx` + quiz builder — same pattern: confirm `tests` module has a create/author endpoint (current controller only has attempt-taking endpoints: `list`, `attempt/start`, `attempt/review`, `attempt/submit` — **no create endpoint exists**, so this needs a new gateway endpoint + Moodle Quiz webservice call before any UI is built).

**This task has a backend dependency the other four don't.** Do the gateway/adapter work first, verify with a raw `curl`/Postman-style test against the new endpoint, then build the page.

**Acceptance:** A teacher can create a quiz, upload course content, and enter grades — all persisting to Moodle/ERPNext through the gateway, visible afterward in the corresponding read views (Student `/learn/tests`, `/learn/courses`, `/learn/grades`) that already exist.

---

### P6 — Institute admin quality-of-life (lowest priority, do last)
- **Bulk import wizard**: `web/app/institute/students/import/page.tsx` — stepper UI over the existing `POST students/bulk-import` endpoint. Look for any existing CSV-parsing utility in the repo (`papaparse` is available if none exists) before adding a new dependency.
- **Instructor directory**: `web/app/institute/staff/page.tsx` — list/invite/deactivate instructors institute-wide (currently only assignable inside a batch via `batches/:id/instructors`). Check if a backend "list all instructors for tenant" endpoint exists; if not, add one to `students` or a new `staff` module following the `students.controller.ts` CRUD pattern.
- **Leave approval inbox**: `web/app/institute/leave-requests/page.tsx` — admin-side queue for requests submitted via `education-portal/students/:id/leave`. Check whether the leave endpoint currently persists to a queryable ERPNext doctype (e.g. "Leave Application") with a status field — if so this is a straightforward list+approve/reject UI; if leave requests aren't persisted anywhere retrievable, add that first.

---

## 2. Rules That Apply to Every Task Above

1. **Never bypass `<FeatureGate>`.** Every new page tied to a catalog key must be gated exactly like existing pages, so that plan-based upsell keeps working.
2. **Never bypass `<AuthGuard>`.** Check `allowedRoles` on the nearest layout before adding a page; add new roles to the array only if that's genuinely who should see it.
3. **Check for a write endpoint before building a write UI.** Several gaps above (grades, quiz authoring, course upload) are read-only on the backend today. Confirm in the relevant `*.controller.ts` and `adapters/*` files before writing frontend code that assumes a backend capability exists. If it doesn't exist, say so and scope backend work first — don't fake it with local state.
4. **Reuse `web/lib/api/query-keys.ts`.** Every new query/mutation needs a key added there so cache invalidation stays consistent with the rest of the app.
5. **Mobile is out of scope by default.** Only touch `mobile/app/*` if a task explicitly says so (currently: none of P0–P6 require it, though P0 and P1 would be natural mobile follow-ups afterward — call this out to the user, don't do it unprompted).
6. **One task = one PR/change-set.** Don't combine P0 and P1 in the same commit even though both touch `/learn/*` — they have independent acceptance criteria and should be reviewable/revertable independently.
7. **If a task's "before building" check fails** (i.e. you discover the backend doesn't support what's assumed), stop, document exactly what's missing (endpoint name, adapter method, doctype), and report that back before writing frontend code against a non-existent API.

---

## 3. What NOT to Build

- A separate Parent app (mobile or web). Parent is a role inside the existing `/learn` shell — see P4.
- A new design system, new auth flow, new state manager, or new API client.
- A rewrite of any of the 4 route groups that already work end-to-end for their core flows (`institute` students/batches/attendance/finance, `teach` batches/attendance/live-class, `learn` courses/schedule/timeline/profile, `superadmin` dashboard/tenants/analytics/health).
- Gamification/skill-trees (mentioned in the original UX plan) — explicitly Phase 2, not part of this instruction set.
- Global cross-tenant billing/MRR dashboard, Novu template embed, global module kill-switches — mentioned in the interface report as Super Admin nice-to-haves, but lower priority than P0–P6 above. Only pick these up after P0–P6 are done and confirmed with the user.

this is actually already addressed in your own CoachingOS_UI_UX_Plan.md, and it changes the calculus for a couple of the gaps I flagged. Let me lay out what's decided vs. what's still open, module by module.
The existing decision (from your UX plan + codebase)
OSS ModuleIts native UIDecision already madeWhat that means for build workERPNext/Frappe (erpnext/)Frappe Desk (Python/jQuery/Vue)Headless. Never shown to end users.Every ERPNext feature (students, batches, fees, grades) must have a custom page in web/app/institute/* — there's no shortcut here. This is why P5/P6 (grade entry, staff directory) need real frontend work, not embedding.Moodle (moodle/)PHP .mustache templatesHeadless. Explicitly called "clunky, poor mobile responsiveness" — not exposed.Same as above: Moodle's own course/quiz UI is off the table. This is exactly why P0 (student tests) and P5 (teacher quiz authoring) need to be built, not linked to Moodle's native quiz-taking page. There's no shortcut for grades either.BigBlueButton (bigbluebutton/)Meteor/React HTML5 clientWrap/Embed, not rebuilt.This one is a shortcut. web/app/learn/live-class/[meetingId]/page.tsx already embeds the native BBB client in an iframe with custom chrome around it. Same applies to recordings (P3) — you don't need to build a video player, you link to/embed BBB's own recording playback.Novu (novu/apps/dashboard)Full React admin appKeep, but Super-Admin-only, not end-user-facing.Students/parents/teachers only ever see the NovuBell widget (already embedded) — never Novu's own dashboard. For Super Admin template management (the gap I flagged in §2.2.5 of the report), the move is to link/embed Novu's existing dashboard for that one screen rather than rebuild a template editor from scratch.Metabase / SupersetIframe-embeddable dashboardsEmbed only, per Frontend_Report_Part_01.md: "leveraging Metabase iframe embeddings or Superset React components."analytics/dashboard/:id already proxies this — /institute/dashboard and /superadmin/analytics embed Metabase panels via iframe. No custom charting UI needed; this is a config/embed task (which dashboard ID goes where), not a build task.RFID ServiceNo UI (headless hardware service)N/A — it's a webhook producer only.Already fully custom-built (attendance-map.tsx, live-feed-log.tsx).RazorpayNative checkout modalEmbed (RazorpayCheckout component already wraps Razorpay's own JS SDK modal).This is why P1 was "wire it in," not "build a payment UI" — Razorpay's own modal is the payment UI, you're just triggering it.
What this changes in the priority list

P3 (Recordings) gets easier than I scoped it — you're embedding BBB's native playback, not building a video library UI from scratch. Mostly a "fetch the URL, put it in an iframe/link" task.
Super Admin's missing Novu template screen (mentioned as a nice-to-have) should be a link-out to Novu's own dashboard (novu/apps/dashboard, deployed separately, SSO'd or IP-restricted to admins) — not a rebuild inside web/app/superadmin.
P0 and P5 (tests/grades/course authoring) stay hard — Moodle and ERPNext's native UIs are explicitly off-limits per the plan, so these genuinely need custom frontend + backend adapter work. No shortcut exists there.
Metabase embedding — worth double-checking /institute/dashboard and /superadmin/analytics actually have real dashboard IDs configured, not placeholder iframes. That's a config task, cheap to verify.

Want me to fold this "embed vs. build" distinction into the AI build instructions doc as an explicit section (so the agent doesn't accidentally try to build a custom BBB player or a custom Novu template editor when it should just embed the existing one)?