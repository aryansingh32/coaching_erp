# CoachingOS — Codebase Audit & Production Readiness Report
### Based on direct inspection of the updated `coachingos_core_clean.zip` (861 files vs. 812 in the previous audit)

> **Method:** this is not a re-read of prior docs — every finding below was verified by opening the actual file and, where relevant, tracing it end-to-end (frontend component → hook → gateway controller → service). Findings are tagged **CRITICAL / HIGH / MEDIUM / LOW** by real-world impact if shipped as-is.

---

## Verdict, up front

**Not yet production-ready to sell — but closer than the file count suggests.** The backend (NestJS Gateway) continues to be the strongest part of this codebase: webhook signature verification, payment idempotency, tenant isolation, and RBAC guards are all implemented correctly and match what a paying customer's security review would expect. The gap between "looks done" and "is done" is now concentrated in a small, identifiable set of frontend surfaces — some of which are genuinely dangerous if a real customer touches them (mobile payments) and some of which are just cosmetically incomplete (analytics embeds). None of it is a rewrite; all of it is fixable in days, not months, but **it must be fixed before this goes in front of a paying institute.**

**Count of blocking issues: 4 (must-fix before any paid pilot). Count of non-blocking gaps: 6 (fix before general availability, not before a pilot).**

---

## 1. What Got Genuinely Better Since the Last Pass

Credit where due — real, verified progress:

- **The Quiz/Test module (`/learn/tests/[quizId]/attempt`) is properly built**, not a stub. Traced the full path: `useStartAttempt` → gateway `attempt/start` → `QuizInterface` renders real questions → `useSubmitAttempt` → `attempt/submit` → redirect to a review page, with correct loading/error states and `<FeatureGate feature="online_tests">` wrapping it. This was the #1 priority gap flagged previously and it's now closed correctly.
- **Web Razorpay payment flow is correct and secure**: `RazorpayCheckout` calls `createRazorpayOrder`, opens the Razorpay widget, and on success calls `verifyRazorpayPayment` — the signature is verified server-side before the payment is trusted. This is the right pattern.
- **Backend webhook handling is production-grade**: `fees.service.ts`'s `handleRazorpayWebhook` verifies the HMAC signature against `RAZORPAY_WEBHOOK_SECRET`, then checks a Redis idempotency key (`payment:processed:{id}`, 30-day TTL) before recording anything — this correctly prevents duplicate payment processing from webhook retries.
- **RBAC is enforced correctly where it matters most**: the Super Admin controller carries `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('super_admin')` — verified directly, not assumed.
- **Rate limiting (`ThrottlerModule`) and `helmet()` are both active**, and CORS has a sane production default: it explicitly **denies** cross-origin requests if `CORS_ORIGINS` isn't set and the app isn't in development mode, logging a warning rather than failing open. This is a good instinct that a lot of teams get backwards.
- New components genuinely wired to real data (verified hook-to-endpoint, not just present): `LeaveRequestForm`, `SchoolDiaryFeed`, `UpdateStudentInfo`, `NotificationPreferences`, `AssignmentUploader`, `DiscussionThread`, `CollectPaymentModal`, `ScormPlayer` (correctly a thin iframe wrapper, per the earlier BBB/Moodle guidance).
- `NovuBell` is now mounted in the Institute, Teacher, and Student (`/learn`) layouts — 3 of the intended 4 web surfaces.
- Mobile has grown real screens since the last pass: `fees.tsx`, `courses/[id].tsx`, `live-class/[id].tsx`, `analytics.tsx`, `assessments.tsx` all now exist where they didn't before.

---

## 2. CRITICAL — Must Fix Before Any Paid Pilot

### 2.1 Mobile app will not build: `react-native-razorpay` is used but not installed
`mobile/app/(student)/fees.tsx` does `import RazorpayCheckout from 'react-native-razorpay'`, but `mobile/package.json` has **no such dependency** (nor `socket.io-client`, which the web app relies on for real-time attendance/live-class status but which has no mobile equivalent at all). As written, this screen will fail at bundle time. **Fix:** add `react-native-razorpay` and `socket.io-client` to `mobile/package.json`, run a real build, and confirm the native module links (Razorpay's RN SDK needs native linking/Expo config plugin — this isn't a pure-JS package, verify it works inside your Expo managed workflow before shipping).

### 2.2 Mobile payment flow is insecure and uses a hardcoded test key
In the same file:
```ts
key: 'rzp_test_mock_key', // In production, fetch this from GET /api/v1/fees/razorpay/config
...
RazorpayCheckout.open(options).then((data) => {
  // In a real app, call API to verify signature: verifyRazorpayPayment(data)
  Alert.alert('Success', `Payment successful!...`);
})
```
Two separate problems, both real:
1. **The Razorpay key is hardcoded to a test placeholder** instead of being fetched from the gateway config endpoint the comment itself references.
2. **There is no server-side signature verification call.** The app shows "Payment successful" purely because the client-side SDK returned without an error — this is exactly the vulnerability server-side verification exists to prevent. A modified client (or a MITM on a compromised device) can show a fake success screen without any money moving, and because there's no verification call, the backend never even finds out to contradict it. **This is a direct financial-integrity bug, not a cosmetic one.** Fix by mirroring the web implementation exactly: fetch the key from `/fees/razorpay/config`, and call the existing `verifyRazorpayPayment` gateway endpoint in the `.then()` handler before showing any success state.

### 2.3 The Institute Admin "Reports/Analytics" page is a non-functional placeholder
`web/components/analytics/metabase-embed.tsx` is, verbatim, a stub:
```tsx
// In a real implementation, this would fetch a signed JWT from the Gateway
// and construct an iframe URL to Metabase.
```
It renders a dashed-border card saying "connection is pending." This component is **already wired into `/institute/reports`**, meaning that page currently looks finished (proper layout, proper card, proper copy) but shows zero real data to anyone who opens it. Because it looks intentional rather than broken, this is the kind of gap that gets missed in a demo and discovered by a paying customer in week one. **Fix:** implement the actual JWT-embed flow described in the earlier `CoachingOS_OpenSource_UI_Analysis_and_API_Integration.md` §1.4/§3 row 28 — the gateway's Metabase adapter already exists per the architecture docs, so this is a frontend-only fix (fetch signed URL, render real iframe).

### 2.4 The new "Book Appointment" feature is entirely fake, with zero backend to back it
`web/components/learn/appointment-scheduler.tsx`:
```ts
const AVAILABLE_SLOTS = ["09:00 AM", "10:00 AM", "11:30 AM", ...]  // hardcoded, same slots every day, no real availability

const handleBook = () => {
  setIsSubmitting(true)
  // Simulate API call to ERPNext book_appointment
  setTimeout(() => {
    setIsSubmitting(false)
    setStep(3)
    toast.success("Appointment booked successfully")
  }, 1500)
}
```
Confirmed by searching the entire gateway source: **there is no appointment-related endpoint anywhere in the backend.** This component shows a real success screen and toast for a booking that was never made anywhere. It's mounted at `/learn/appointments` — a real, navigable route a real user can reach. **Fix priority is judgment call:** either build the real endpoint (per the ERPNext `book_appointment` pattern already documented) before launch, or remove the route/nav entry until it's real. Shipping a feature that lies about succeeding is worse than not shipping it.

---

## 3. HIGH — Security Gaps to Close Before Launch

### 3.1 No `.gitignore` at the repo root, in `gateway/`, or in `mobile/`
Verified directly — only `web/.gitignore` exists and correctly excludes `.env*`. **`gateway/` and `mobile/` have no `.gitignore` at all**, and there's no root-level one either. Right now `infra/.env` contains only placeholder values (`change_me_...`, `demo_...`) — not a live leak — but the moment a developer follows the setup instructions and fills in real secrets in `gateway/.env` or `mobile/.env`, there is **nothing stopping those files from being committed to git.** This is a "loaded gun on the table" finding: not a breach today, but a near-certain one soon without a fix. **Fix:** add a root `.gitignore` covering `.env`, `.env.*` (except `.env.example`), `node_modules`, build output, and `*.pem`/`*.key`, and verify `git status` shows nothing sensitive as untracked-but-stageable in each of `gateway/`, `mobile/`, and `infra/`.

### 3.2 Unsanitized HTML rendering on the Institute Help Center
`web/app/institute/help/page.tsx` line 116:
```tsx
<div dangerouslySetInnerHTML={{ __html: article.content }} />
```
Help articles are presumably authored by Institute Admins or Super Admins, which lowers but does not eliminate the risk — if any lower-trust actor can ever create or edit a Help Article (e.g. a future "suggest an edit" feature, or if content is ever synced from an external CMS/import), this becomes a stored-XSS vector against every user who reads that article, including higher-privileged staff. **Fix:** sanitize with `DOMPurify` (or render through a markdown pipeline that doesn't allow raw HTML) before this ships, even though today's authors are trusted — "trusted today" is not a durable security boundary.

---

## 4. MEDIUM — Should Fix Before General Availability

### 4.1 Notification triggers exist but are never called
`NotificationsService` (Novu wrapper) is registered in `app.module.ts` and correctly implements `syncSubscriber`, `updateSubscriberCredentials`, and `triggerEvent` — but a full-codebase search confirms **it is never injected into any other service.** Nothing calls it when a fee is paid, attendance is marked, a grade is posted, or a leave request is approved/rejected. The bell icon in the header will work once something manually triggers a notification via Novu's own dashboard, but the automatic, event-driven notifications a coaching institute actually needs (payment reminders, absence alerts, grade-posted pings) don't fire yet. **Fix:** inject `NotificationsService` into `FeesService`, `AttendanceService`, and the grading/leave-approval services, and call `triggerEvent` at the natural points in each flow.

### 4.2 `NovuBell` is missing from the Super Admin layout and from the entire mobile app
Verified: it's mounted in `institute/layout.tsx`, `teach/layout.tsx`, and `learn/layout.tsx`, but not in `web/app/superadmin/layout.tsx`, and there is no equivalent in `mobile/` at all (which also has no push-notification registration flow visible). For a coaching-institute product where parents primarily live on the mobile app, shipping without a mobile notification surface undercuts the entire point of the Novu integration. **Fix:** add the bell to the Super Admin layout (low effort) and prioritize a mobile notification center or at minimum FCM push registration + a simple in-app feed (higher effort, but should not slip past the mobile parity phase from the earlier build plan).

### 4.3 A confusing, unused second Super Admin app scaffold exists in the repo
`superadmin-web/` was added and is a **completely untouched `create-next-app` default scaffold** — the homepage still says "To get started, edit the page.tsx file" with the default Next.js logo and template links. Meanwhile, the real, functional Super Admin panel already lives at `web/app/superadmin/*` and is the one actually referenced throughout the architecture docs. Having both in the repo is actively confusing for any new developer or AI agent picking up this codebase — it's a coin-flip which one they extend. **Fix:** delete `superadmin-web/` entirely, or if there was a specific reason to split it into its own deployable app, document that decision clearly and migrate the real routes into it — don't leave a dead scaffold sitting next to the real thing.

### 4.4 Feature-flag gating covers under half of all pages
25 of 62 `page.tsx` files under `web/app` use `<FeatureGate>`; the rest render unconditionally regardless of a tenant's plan tier. Some of these are legitimately "core" and shouldn't be gated (per the Feature Catalog in the earlier spec), but this ratio is worth an explicit audit against that catalog rather than assuming it's fine — plan-tier enforcement is the entire mechanism by which this becomes a sellable SaaS product with differentiated pricing, and a page that should be Growth/Pro-only but renders for Starter tenants is a revenue leak, not just a cosmetic issue.

---

## 5. LOW — Worth Tracking, Not Launch-Blocking

- **Near-zero automated test coverage.** The entire repository (gateway + web + mobile combined) contains exactly **3** `.spec.ts`/`.test.ts` files, all backend, all narrowly scoped (`proxy.service.spec.ts`, `cross-tenant-isolation.spec.ts`, `tenant-scope.service.spec.ts`). There are no frontend component tests and no end-to-end tests anywhere. The two isolation-focused specs that do exist are a good sign — tenant isolation is clearly something the team thought hard about — but a payments-and-student-data product going to paying customers with 3 total test files is a real operational risk once you have more than one or two engineers touching this code. Not a blocker for a first pilot; should be a near-term priority immediately after.
- `infra/.env` is checked into the repo under that exact name rather than `.env.example` — today it's harmless (all placeholder values), but combined with finding §3.1 (no `.gitignore`), it's a pattern worth breaking now rather than after a real secret gets pasted into it.
- Only one `console.log` was found in the gateway (low risk, but worth replacing with the existing `Logger` for consistency — the codebase otherwise uses NestJS's structured logger correctly).

---

## 6. Progress Checklist Against the Prior Build Plan

| Phase (from `CoachingOS_Frontend_Master_Spec.md`) | Status |
|---|---|
| Phase 0 — Wire Razorpay into `/learn/profile`, mount NovuBell, apply FeatureGate | ✅ Razorpay done correctly (web). ⚠️ NovuBell missing from Super Admin + mobile. ⚠️ FeatureGate only 40% coverage. |
| Phase 1 — Student Tests / `<QuizRunner>` | ✅ Done, verified end-to-end, correctly gated. |
| Phase 2 — Super Admin `/superadmin/plans` feature matrix | Not verified present in this pass — recommend confirming directly next audit. |
| Phase 3 — Course content viewer, Moodle activity components | ✅ `AssignmentUploader`, `DiscussionThread`, `ScormPlayer` all real and wired. |
| Phase 4 — Teacher authoring / grading loop | Not re-verified this pass. |
| Phase 5 — Institute quality-of-life (help, appointments, reports) | ⚠️ Help Center built but has an XSS gap (§3.2). ❌ Appointments is fully fake (§2.4). ❌ Reports/Analytics is a stub (§2.3). |
| Phase 6 — Recordings + live-class monitoring | `meeting-recordings.tsx` component now exists — not deep-audited this pass. |
| Phase 7 — Parent-mode polish | Not re-verified this pass. |
| Phase 8 — Mobile parity | ⚠️ Real progress (5 new screens) but **build-breaking dependency bug (§2.1)** and **insecure payment flow (§2.2)** need fixing before this counts as usable. |

---

## 7. Bottom Line

If someone tried to run a paid pilot on this exact zip today: the **web** experience for Institute Admin, Teacher, and Student/Parent is close to genuinely solid — the core paid-product loops (attendance, fees, tests, live class, communication) are real and correctly secured. The **mobile** app would fail to bundle in its current state and, once that's fixed, would process real money through a flow with no server-side verification — that alone is a hard stop for mobile until §2.1 and §2.2 are resolved. Two web pages (`/institute/reports`, `/learn/appointments`) currently perform a "successful-looking" fake action or show a "coming soon" card dressed up as a finished feature — both need to be either finished or hidden before a customer can click into them.

**Recommended sequence:** fix §2.1–2.4 (the 4 CRITICAL items) first — they're all small, contained changes, not architecture work. Then §3.1–3.2. Then decide whether §4's items block your specific first pilot or can trail slightly behind it, given the customer and rollout size.