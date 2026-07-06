# CoachingOS — Deep Page-by-Page Audit: Dummy Data, Dead Endpoints & OSS Fidelity Check
### A rigorous re-check, prompted directly by "there's too much dummy code" — this time every frontend API call was traced against the actual backend route table, not just checked for the presence of a hook

> **What changed in this pass:** the previous audit checked whether a component *called a hook*. That's not the same as checking whether the hook *reaches a real, existing backend route*. This time I extracted **every one of the 95 API calls** in `web/lib/api/services.ts` and diffed them, path-by-path and method-by-method, against the actual `@Controller`/`@Get`/`@Post` decorators in all 14 gateway controllers. That single check surfaced real, previously-uncredited problems — including in two components I incorrectly called "properly wired" last time. That correction is made explicitly below.

---

## 0. Headline Finding

**You're right that there's too much dummy code — but it's not primarily hardcoded arrays of fake data. It's a subtler and more dangerous pattern: fully-built frontend screens (real hooks, real loading/error states, real forms) that call backend endpoints which were never built.** These pages *look* completely finished in a code review and *look* completely finished in a demo click-through. They only break when a real user actually submits the form — at which point the app will show a network error or, worse, silently fail. This is a more serious category of problem than the `AppointmentScheduler`/`MetabaseEmbed` stubs found last time, because those two were at least honest about being placeholders in their own code comments. These new findings have no such warning.

---

## 1. Method: Full API Call ↔ Route Cross-Check

Every `apiGet`/`apiPost`/`apiPut`/`apiDelete` call in `web/lib/api/services.ts` (95 total call sites) was extracted and matched against the complete route table of all 14 gateway controllers (`attendance`, `fees`, `education`, `auth`, `live-class`, `tests`, `students`, `health`, `lms`, `tenants`, `proxy`, `superadmin`, `batches`, `analytics`). **10 frontend calls have no matching backend route at all.** Everything else — all of `students`, `batches`, `attendance`, `education-portal`, `auth`, `live-class`, `tests`, `health`, `tenants`, `proxy`, `superadmin`, `analytics` — checks out correctly, method and path. The damage is concentrated in three specific areas: **Fees (partial)**, **LMS write-actions (Moodle authoring/grading/assignments/forums)**, and **Notifications (entirely)**.

### 1.1 Fees module — 3 of 11 frontend calls are dead

| Frontend function (in `services.ts`) | Calls | Real backend route? | User-facing impact |
|---|---|---|---|
| `getPaymentHistory` | `GET /fees/history` | ❌ No such route in `fees.controller.ts` | `/institute/finance` renders a "Payment History" table via `usePaymentHistory` — **it will always fail to load.** Confirmed: this hook is called live in `finance/page.tsx` line 38, not dead code sitting unused. |
| `recordManualPayment` | `POST /fees/manual-payment` | ❌ The real route is `POST /fees/payment` (different path) | **Correction to my previous report:** I previously credited `CollectPaymentModal` as "properly wired" because it calls `useRecordManualPayment()`. I was wrong to stop there — the hook itself targets a path that doesn't exist. **The "Collect Payment" button in the Institute Admin Finance page will fail on every submission.** |
| `sendBulkReminders` | `POST /fees/reminder/bulk` | ❌ No such route | The bulk fee-reminder button on `/institute/finance` will fail on click. |

The 8 remaining fee calls (`schedule`, `payment`, `pending/:studentId`, `razorpay/config` GET+POST, `razorpay/order`, `razorpay/verify`) all check out correctly — this is why the core Razorpay checkout flow genuinely works while the admin-side manual collection tools around it don't.

### 1.2 LMS module — 6 of 11 frontend calls are dead, and this breaks the entire Teacher authoring loop

| Frontend function | Calls | Real backend route? | User-facing impact |
|---|---|---|---|
| `submitMoodleAssignment` | `POST /lms/assignments/:id/submit` | ❌ Not in `lms.controller.ts` | `AssignmentUploader.tsx` — a student submitting an assignment will get a failure on every attempt. |
| `addMoodleForumDiscussion` | `POST /lms/forums/:id/discussions` | ❌ Not in `lms.controller.ts` | `DiscussionThread.tsx` — posting a new discussion topic fails every time. |
| `replyMoodleDiscussion` | `POST /lms/discussions/:id/replies` | ❌ Not in `lms.controller.ts` | `DiscussionThread.tsx` — replying to a thread fails every time. |
| `getMoodleGradeItems` | `GET /lms/courses/:id/grade-items` | ❌ The controller only exposes `GET /lms/courses/:id/grades` (different path) | `/teach/assessments` — **the Teacher grade-entry screen can't even load its own grade columns.** |
| `saveMoodleGrades` | `POST /lms/courses/:id/grades` | ❌ The controller only defines a `GET` on that exact path, no `POST` | `/teach/assessments` — **teachers cannot submit grades. At all.** This closes the loop on what was flagged as "Phase 4, teacher grading" — it isn't done, it's UI-only. |
| `createMoodleActivity` | `POST /lms/courses/:id/activities` | ❌ Not in `lms.controller.ts` | `/teach/courses/[courseId]/upload` — **the entire teacher content-authoring page (add a Moodle quiz/assignment/forum/resource to a course) cannot actually add anything.** This is the single biggest gap: it was previously reported as a "Phase 3, done" item based on the presence of `ACTIVITY_TYPES` picker UI and a real-looking hook — the picker UI is real, the save action is not. |

Only `courses` (GET/POST), `courses/:id/content` (GET/POST), and `courses/:id/grades` (GET only) are real. This means the Moodle integration works for **reading** course structure and content, but essentially none of the **teacher-authoring or student-submission write paths** work — which, per the earlier OSS analysis, was supposed to be the core value of headlessly integrating Moodle in the first place.

### 1.3 Notifications module — 3 of 3 frontend calls are dead, confirmed with no ambiguity

| Frontend function | Calls | Real backend route? |
|---|---|---|
| `getNotificationLogs` | `GET /notifications/logs` | ❌ No `NotificationsController` exists anywhere in the gateway — only a `NotificationsService` with no controller wrapping it |
| `getNotificationPreferences` | `GET /notifications/preferences` | ❌ same |
| `updateNotificationPreferences` | `PUT /notifications/preferences` | ❌ same |

Impact: `NotificationPreferences.tsx` (mounted somewhere in the settings UI) cannot load or save anything. `superadmin/notifications/page.tsx`'s "Delivery Logs" table will always show an error state. This is consistent with — and now fully explains — the comment I found in `superadmin/layout.tsx`: `// Notifications hidden until gateway Novu logs module exists (currently mock data)`. **The developer knew this and hid the nav link, but the page itself is still live at its URL and still partially fake even beyond the missing endpoint** — see §2 below.

---

## 2. The Super Admin Notifications Page Is a Specific, Concrete Example Worth Calling Out on Its Own

`web/app/superadmin/notifications/page.tsx` is the clearest single illustration of "looks done, isn't done" in the whole codebase, because it mixes real and fake in the same screen:

- The **"Total Delivered (24h)" card hardcodes `14,239`** as a literal number in JSX — not derived from any state, query, or prop.
- The **"Total Failed (24h)" card hardcodes `42`** the same way.
- The **"Event Queue Status" card hardcodes the string `"Healthy"`** with supporting text "NATS JetStream connection active" — again, a static claim with no underlying health check.
- Immediately below those three fake cards, the **Delivery Logs table is genuinely wired** to `useNotificationLogs()` with correct loading/error states — it's just that (per §1.3) the endpoint it calls doesn't exist yet, so in practice it will always render the `<ErrorState>`.

This page is a distilled example of the pattern across the app: the *engineering scaffolding* (query hooks, loading states, error states, correct component structure) is consistently good, which is exactly what makes the fake parts easy to miss — they're sitting right next to real, well-built code.

---

## 3. Re-Confirmed From the Previous Pass (Still True, Not Re-Litigated in Depth)

- `AppointmentScheduler` (`/learn/appointments`) — fully fake, hardcoded slots, `setTimeout`-simulated booking, zero backend route (still confirmed zero on this pass too).
- `MetabaseEmbed` (`/institute/reports`) — explicit stub, own comments admit it.
- Mobile `fees.tsx` — hardcoded Razorpay test key, no server-side verification call, and `react-native-razorpay` still absent from `mobile/package.json`.
- No `.gitignore` in `gateway/` or `mobile/`, none at root.
- Unsanitized `dangerouslySetInnerHTML` on `/institute/help`.
- `superadmin-web/` is still an untouched scaffold sitting next to the real Super Admin app.

---

## 4. Re-Verified Against the Original Open-Source UI Zips: Where the Gap Actually Is

Going back to the OSS source with this specific question in mind — *"does our UI actually deliver the OSS feature, or just look like it?"* — sharpens the picture from the earlier feature-parity checklist:

- **Moodle's `mod/assign`, `mod/forum`, `qbank`, and grading-grid patterns** were the basis for `AssignmentUploader`, `DiscussionThread`, and the Teacher grading/authoring screens. The UI faithfully reproduces Moodle's *interaction patterns* (upload widget, threaded reply box, activity-type picker) — but per §1.2, **none of the corresponding write-actions reach Moodle at all.** The gap isn't in the UI's fidelity to Moodle's UX; it's that the gateway's Moodle adapter was never extended past read-only course/content sync to cover these actions. Re-reading `moodle_ui.zip`'s `mod/assign/locallib.php`-style submission flow confirms these are meant to be simple, well-defined web-service calls (`mod_assign_save_submission`, `mod_forum_add_discussion`, `core_grades_update_grades` equivalents) — this is a backend gap, not a frontend one, and it's a contained one to close.
- **ERPNext's `fee_row.html` pattern** (Program · Grand Total · Paid · Outstanding) is correctly reflected in the Finance page's layout — but the **payment-history and bulk-reminder actions** that a real fee office needs (matching ERPNext's own Payment Entry + reminder-on-overdue patterns) are the two calls confirmed dead in §1.1.
- **Novu's dashboard/workflow model** was correctly used as the *reference* for what `/superadmin/notifications` should contain — but as shown in §2, the page that resulted is a shell around that reference, not an implementation of it.

The conclusion from re-reading the OSS source a second time is the same as the conclusion from the endpoint audit: **the frontend consistently and correctly mirrors the right OSS interaction patterns. The unfinished part is almost entirely the backend write-paths those patterns need to actually do something.**

---

## 5. What This Means Practically

This is good news in one specific sense: **you do not have a frontend quality problem.** The React/Next.js code itself — hooks, loading states, error states, form validation, feature gating — is consistently well-structured everywhere it was checked. What you have is a **frontend/backend completion mismatch**: the frontend was built slightly ahead of the backend on three specific modules (Fees admin-tools, LMS write-actions, Notifications), and nothing currently flags that mismatch to a developer except manually tracing each call — which is what this audit did.

**Recommended immediate action, in order:**
1. Build the 3 missing Fees routes (`history`, rename/alias `manual-payment`→`payment` or add the alias route, `reminder/bulk`) — small, contained, unblocks Institute Admin's Finance page.
2. Build the 6 missing LMS write routes against Moodle's web service API (`mod_assign_save_submission`, `mod_forum_add_discussion`, grade save, activity creation) — this is the highest-value fix, since it's the difference between "Moodle is integrated" and "Moodle is read-only."
3. Build a `NotificationsController` exposing `logs`/`preferences` (the service logic already exists, it just needs a controller wrapping it) — smallest of the three fixes.
4. Then remove the three hardcoded numbers from `superadmin/notifications/page.tsx` once the logs endpoint is real, and derive the "Total Delivered/Failed/Queue Status" cards from it instead of literals.
5. Only after 1–3 are done should `AppointmentScheduler` and `MetabaseEmbed` be tackled — those need net-new backend work rather than wiring an already-built service to a missing controller, so they're rightly a larger, separate task.