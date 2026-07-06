# CoachingOS — Full-Stack Audit: OSS Backend Source vs. Our Gateway, Workers & Frontend
### Every finding below traces a real function/endpoint from the actual OSS backend source (`moodle_backend.zip`, `erpnext_backend.zip`, `education_backend.zip`, `bigbluebutton_backend.zip`, `novu_backend.zip`, `metabase_backend.zip`, `clickhouse_backend.zip`, `superset_backend.zip`) through our gateway adapter, our gateway controller, our NATS workers, and our frontend — end to end.

> **Why this pass is different:** the last two audits checked "does the frontend call a real gateway route." This one goes one level deeper and asks "does our gateway/worker code call the OSS system *correctly*, using functions that actually exist in that system's real source" — and, in the other direction, "is there working backend code that the frontend simply never learned to call." Both directions turned up real findings, including two corrections to what I reported last time, and — new in this revision — the single most severe bug found in this engagement so far, in the just-uploaded `education_backend.zip` (the real `frappe/education` app referenced in §3 below).

---

## 0. NEW — CRITICAL: Our ERPNext adapter calls two core Education functions that don't exist, with wrong parameters

`education_backend.zip` is confirmed to be the actual `frappe/education` app — the separate app §3 already identified as where every Student/Program/Fee doctype now lives post-v14. Having the real source lets me check our `EducationAdapter` (`gateway/src/adapters/erpnext/education.adapter.ts`) against it directly, function by function. Two of its most important methods are wrong in a way that would fail on every single call, not intermittently:

### 0.1 `enrollStudentInBatch()` — wrong namespace AND wrong parameters
Our adapter calls:
```ts
this.callMethod('erpnext.education.api.enroll_student', { student: studentName, student_group: batchName });
```
The real, confirmed function lives at **`education.education.api.enroll_student`** (module `education`, not `erpnext` — a direct consequence of the v14 app split documented in §3) and its actual signature is:
```python
@frappe.whitelist()
def enroll_in_program(program_name, student=None):   # note: not "enroll_student" for direct batch enrollment
```
There is a function literally named `enroll_student(source_name)` in `api.py`, but it does something different from what our adapter's naming implies — it maps a **Student Applicant** into a **Program Enrollment** (used by the admissions "Approve → Enroll" flow, confirmed in `student_applicant.js`'s `frappe.model.open_mapped_doc({ method: 'education.education.api.enroll_student', frm })`), taking a single `source_name` (the Student Applicant ID), not a `{student, student_group}` pair. Batch-level enrollment (a `Student Group`) is a separate, simpler operation: appending a row to the `Student Group`'s `students` child table and saving — there's no single RPC for it at all.

**Net effect: every "enroll this student in this batch" call from CoachingOS to ERPNext currently 404s or throws** (wrong module path), and even if the path were fixed, the parameters don't match any real function's contract.

### 0.2 `createFeeScheduleForStudent()` — the target function does not exist under this name, and it isn't a single-call operation
Our adapter calls:
```ts
this.callMethod('erpnext.education.api.create_fee_schedule', { student, fee_structure: feeStructure });
```
**No function named `create_fee_schedule` exists anywhere in `education_backend.zip`.** Confirmed by full-text search across all `.py` files. What actually exists is a **three-step document workflow**, all on the `Fee Schedule` doctype:
1. `education.education.doctype.fee_schedule.fee_schedule.get_fee_structure(source_name, target_doc=None)` — maps a `Fee Structure` into a new unsaved `Fee Schedule` document (mirrors a `Fee Structure` template into an editable schedule).
2. The resulting `Fee Schedule` document must have its `student_groups` child table populated and be **saved and submitted** like any other Frappe document (`POST /api/resource/Fee Schedule` then a submit action) — it is not a fire-and-forget RPC.
3. Only then does `create_fees()` (a whitelisted **method on the saved Fee Schedule document itself**, called as `frappe.call({ method: 'create_fees', doc })`, i.e. `/api/method/run_doc_method` style, not a plain `/api/method/...` call) generate the actual `Sales Invoice`/`Sales Order` per student in the group — and for >10 students it runs as a background job (`frappe.enqueue`), pushing progress over `frappe.publish_realtime('fee_schedule_progress', ...)`.

**Net effect: fee schedule creation is completely broken today** — not just a wrong path, but a fundamentally different, multi-step workflow that our single-call adapter method cannot represent at all as currently written.

### 0.3 What this means for the platform
These two operations — "put a student in a batch" and "generate their fee schedule" — are about as core as it gets for a coaching-institute product. If `Extracted_1000_APIs_List.md`'s pagination-expanded rows gave the impression that the ERPNext integration is broad and working, these two findings show the opposite for two of the most-exercised write paths: they were seemingly never actually tested against a real ERPNext + Education install, only against the generic `/api/resource/{doctype}` CRUD pattern (which is correct elsewhere in the adapter, per §3's confirmation of `getDoc`/`createDoc`/`updateDoc`/`listDocs`).

**Fix, in order:**
1. Rename/rewrite `enrollStudentInBatch` to do the real operation directly: `GET` the `Student Group` doc, append `{ student: studentName }` to its `students` child table via `updateDoc('Student Group', batchName, { students: [...existing, {student: studentName}] })` — using the generic doctype methods that are already correct in this same adapter file, no new RPC needed.
2. Rewrite `createFeeScheduleForStudent` into the real three-step flow: call `education.education.doctype.fee_schedule.fee_schedule.get_fee_structure` via `callMethod`, `createDoc('Fee Schedule', {...mappedDoc, student_groups})`, submit it, then call the document method `create_fees` (Frappe's doc-method invocation pattern is `POST /api/method/frappe.client.run_doc_method` with `docs`, `method: 'create_fees'`, `dt`/`dn` params — confirm this exact envelope against your Frappe version before shipping).
3. Add an integration test that runs both flows against a real ERPNext + Education docker instance (per `infra/scripts/erpnext-setup.sh`) — given §5's note on near-zero test coverage, these two flows are exactly the kind of "looks right, fails in production" gap that a single integration test would have caught immediately.

---

## 1. Two Corrections to the Previous Audit (read this first)

### 1.1 Metabase: this is now a 15-line frontend fix, not a backend gap
Previously I said the Metabase embed needed both backend and frontend work. Having now read Metabase's actual embedding spec (`metabase_backend.zip`) and re-traced our code: **the backend is already 100% correct and already exposed.**

- `gateway/src/adapters/metabase/metabase.adapter.ts`'s `generateEmbedToken()` builds the exact JWT shape Metabase's real static-embedding feature expects (`{ resource: { dashboard }, params: { tenant_id }, exp }`, signed with the embedding secret) — this matches Metabase's documented embedding contract precisely.
- `GET /analytics/dashboard/:id` (in `analytics.controller.ts`) is a real, working route that calls this adapter and returns `{ url, dashboardId }`.
- `web/lib/api/services.ts` **already has a matching frontend function**, `getDashboardEmbed(id, tenantId)`, correctly calling that exact route.

**The only thing missing is that `MetabaseEmbed.tsx` never calls `getDashboardEmbed`.** It's a static placeholder card sitting three feet away from a fully working, already-connected pipeline. Fix: replace the stub's body with a `useQuery` calling `getDashboardEmbed(dashboardId)` and render `<iframe src={data.url}>`. This is genuinely one line of hook wiring and a few lines of JSX — reclassify this from "needs backend work" to "quick frontend fix," and do it before the LMS fixes below since it's by far the cheapest win available.

### 1.2 Notifications: there IS an event-driven pipeline — it's just built for one event type, and one consumer is half-wired
Previously I said `NotificationsService` (in the gateway) is never called by anything, which is true *within the gateway process* — but I hadn't yet found `workers/novu-worker/`, a separate microservice that subscribes to NATS and calls Novu directly. Correcting the picture:

- `novu-worker` correctly subscribes to the `ATTENDANCE` stream (`attendance.>`) and, on an `attendance.rfid_punch` event, calls `novu.trigger('attendance-punch', ...)` with real student/time/institute payload data. **This one path is real and works.**
- It also creates a durable consumer for `FEE_EVENTS` (`fee.>`) — but **never actually subscribes to or processes it.** The consumer is registered with `jsm.consumers.add(...)` and then nothing ever calls `js.pullSubscribe('fee.>', ...)` or loops over messages from it, unlike the attendance path which has both. This is a precise, half-finished feature: someone clearly intended fee-event notifications (payment received, payment overdue) and got as far as registering the consumer, then stopped. **Fix:** add a `feeSub` pull-subscription loop mirroring the attendance one, triggering a `fee-reminder`/`fee-received` Novu workflow.
- No other event type (grade posted, leave approved/rejected, live class starting, test result published) has any consumer at all, in this worker or anywhere else.
- The gateway-level `NotificationsController` gap (`/notifications/logs`, `/notifications/preferences`) from the previous audit is unaffected by this finding — that's a separate, still-real gap for the *read* side (viewing/managing notification preferences and delivery logs), whereas `novu-worker` is the *write* side (triggering sends). Both need work, for different reasons.

---

## 2. Moodle — Exact Fix, With Real Function Names, for the 6 Orphaned LMS Routes

This is the highest-value finding in this pass. Pulling the real webservice registry (`lib/db/services.php`, `mod/assign/db/services.php`, `mod/forum/db/services.php`) out of `moodle_backend.zip` confirms every function needed already exists in Moodle core — nothing here requires a Moodle plugin or customization:

| Missing gateway route (from the previous audit) | Real Moodle web service function that does this | Current adapter status |
|---|---|---|
| Assignment submission | `mod_assign_save_submission` | ✅ **Already implemented** as `MoodleAdapter.saveSubmission()` — confirmed correct, just never called by `lms.service.ts` or exposed via a controller route. |
| Grade save | `core_grades_update_grades` | ✅ **Already implemented** as `MoodleAdapter.updateGrade()` — but it's currently only called internally by `moodle-sync.service.ts` for ERPNext→Moodle sync, never exposed for a teacher to call directly. |
| New forum discussion | `mod_forum_add_discussion` | ❌ Not implemented on the adapter at all — needs a new `MoodleAdapter.addForumDiscussion()` method. |
| Forum reply | `mod_forum_add_discussion_post` | ❌ Not implemented — needs `MoodleAdapter.replyToDiscussion()`. |
| Add a course activity (any type: quiz/assign/forum/resource/page) | `core_courseformat_create_module` (generic) or `core_course_edit_module` (already used, but only wired for `url` type via `addUrlModule()`) | ⚠️ **Partially implemented.** `addUrlModule()` proves the pattern works for one type; it needs to become a generic `createActivity(courseId, type, params)` that maps the frontend's `ACTIVITY_TYPES` picker (Moodle's own `resource`/`url`/`page`/`assign`/`forum`/`quiz`/etc. enum, confirmed in the earlier OSS UI analysis) to the right Moodle module-creation call per type. |

**Concretely, the fix is three small pieces, in order of effort:**
1. Add two new `LmsController`/`LmsService` routes (`POST lms/assignments/:id/submit`, `POST lms/courses/:id/grades`) that simply call the **adapter methods that already exist** (`saveSubmission`, `updateGrade`) — this closes 2 of the 6 gaps with almost no new logic, since the hard part (talking to Moodle correctly) is already done.
2. Add `addForumDiscussion`/`replyToDiscussion` to `MoodleAdapter` (following the exact same `this.call('mod_forum_add_discussion', {...})` pattern already used everywhere else in the file) plus their controller routes.
3. Generalize `addCourseContent` into a real `createActivity` that branches on activity type — the `url` branch already exists and works, extend the same function for `assign`/`forum`/`quiz` (quiz creation already has its own working `createQuiz()` — reuse it here rather than duplicating).

None of this requires touching Moodle itself, installing a plugin, or changing the Moodle Docker image — every function is stock Moodle core, confirmed present in the exact version in `moodle_backend.zip`.

---

## 3. ERPNext — A Risk I Went Looking For, and Found Already Handled Correctly

Reading `erpnext_backend.zip`'s own patch file (`patches/v14_0/delete_education_doctypes.py`) confirms something significant about ERPNext itself: **as of ERPNext v14, the entire Education module — Student, Program, Course, Fee Structure, Batch, Instructor, Assessment Plan, Leave Application, every doctype this whole platform is built on — was removed from ERPNext core** and split into a separate app (`frappe/education`, confirmed by the patch's own printed message: *"Education Module is moved to a separate app... https://github.com/frappe/education"*). The `erpnext_backend.zip` we were given is v17-dev, well past that split — meaning if this were deployed as vanilla ERPNext with no further action, **every doctype the whole system depends on would not exist on the server.**

I checked whether this was accounted for: **it is.** `infra/scripts/erpnext-setup.sh` correctly runs `bench get-app education https://github.com/frappe/education --branch version-15` followed by `bench install-app education`, and `infra/README.md` even has a troubleshooting line for exactly this failure mode ("Education app missing → re-run erpnext-setup.sh"). **No action needed here — flagging it only because it's the kind of infrastructure assumption that's easy to get wrong, and it's worth knowing it was checked and confirmed correct, not just assumed.**

---

## 4. BigBlueButton — Checksum Algorithm Verified Correct

I pulled BBB's actual server-side checksum validator (`GetChecksumValidator.java`) to check whether our `BbbAdapter`'s SHA-256 checksum would even be accepted. Confirmed: **BBB auto-detects the hash algorithm by the length of the submitted checksum string** (40 chars → SHA-1, 64 → SHA-256, 96 → SHA-384, 128 → SHA-512), and validates against whichever algorithms are enabled in `supportedChecksumAlgorithms` (SHA-256 is enabled by default in current BBB). Our adapter's `crypto.createHash('sha256')` produces a 64-character hex digest, matching the SHA-256 branch exactly, with the checksum formula (`apiCall + queryString + secret`) matching BBB's `apiCall + queryStringWithoutChecksum + securitySalt` exactly. **This integration is correctly implemented — no changes needed.**

---

## 5. Novu — SDK Usage Verified Against Real Provider Registry

Checked whether `'expo'` (used in `NotificationsService.updateSubscriberCredentials()` and mirrored in `novu-worker`) is a real, valid Novu push provider identifier, since a typo here would silently fail. Confirmed via `novu_backend.zip`: `packages/providers/src/lib/push/expo/expo.provider.ts` exists as a first-class Novu push provider — **`'expo'` is correct**, not a guess. The `novu.subscribers.identify()` / `novu.trigger()` calls also match the real Node SDK's method names. **The parts of the Novu integration that exist are implemented correctly; the gaps are coverage gaps (§1.2), not correctness gaps.**

---

## 6. ClickHouse — A Real, Working Write Pipeline That Nothing Reads From Yet

This is a new finding this pass, found by checking `workers/analytics-worker/` (a separate microservice, not part of `gateway/src`, which is why it wasn't caught in the previous two audits that only searched `gateway/` and `web/`).

**The good news:** `workers/analytics-worker/src/main.ts` is genuinely well-built — it consumes six NATS JetStream streams (`STUDENT_EVENTS`, `BATCH_EVENTS`, `ATTENDANCE`, `FEE_EVENTS`, `LMS_EVENTS`, `CLASS_EVENTS`), routes each message to the correct ClickHouse table by subject prefix, and calls the real `@clickhouse/client` package's `.insert()` correctly. `infra/docker-compose.yml` correctly provisions the ClickHouse container, and `infra/scripts/init-clickhouse.sql` sets up the schema. **Events are genuinely being captured.**

**The gap:** I checked `gateway/src` end-to-end for any ClickHouse reference — there are zero. `analytics.service.ts`'s `getKpis()` (the function backing `/analytics/kpis`, which feeds Institute Admin and Super Admin dashboards) computes its numbers by directly querying ERPNext for student/batch counts — **it never queries ClickHouse at all.** All of that carefully-captured attendance/fee/lms/class event history is being written and then never read by anything in the product except, indirectly, whatever Metabase dashboards a Super Admin manually builds on top of it via SQL (which is a legitimate use, but means the "real-time KPI" story in the architecture docs is currently delivered by simple ERPNext counts, not the richer ClickHouse-backed analytics the infra was built for). **This isn't broken, it's incomplete** — the pipeline is real and correct, it just doesn't have a consumer-facing feature built on top of it yet inside the Gateway itself.

---

## 7. Superset — Confirmed Deliberately Unused, Not a Gap

`superset_backend.zip` was uploaded alongside the others, but a direct search of the entire codebase (`gateway/`, `web/`, `infra/`) turns up zero references to Superset anywhere — except one, which resolves the question: `infra/docker-compose.yml` line 10 literally states in a comment: *"Metabase = embedded BI (no Superset)."* This confirms Superset was evaluated and explicitly rejected in favor of Metabase as a deliberate architecture decision, not an oversight. **No action needed; nothing to fix.** Worth confirming with you directly only in case that decision has changed since — if it has, this would be a larger, separate migration project (Superset's embedding model is meaningfully different from Metabase's JWT approach used throughout §1.1), not a small addition.

---

## 9. Summary Table — What to Actually Do, in Order (updated)

| Fix | Effort | Why this order |
|---|---|---|
| **0. Fix `enrollStudentInBatch` and `createFeeScheduleForStudent` in `EducationAdapter`** | Medium | §0 — these are confirmed **completely broken today** (wrong function path/name, wrong parameters), and they're two of the most fundamental operations in the whole platform. This now leads the list. |
| 1. Wire `MetabaseEmbed.tsx` to the already-existing `getDashboardEmbed()` call | ~30 min | Everything else it needs already exists on both ends (§1.1) |
| 2. Add `POST lms/assignments/:id/submit` and `POST lms/courses/:id/grades` routes calling the adapter methods that already exist | Small | Reuses already-correct, already-written Moodle integration code (§2) |
| 3. Add the `feeSub` processing loop to `novu-worker` | Small | The consumer is already registered; this is finishing a function that's half-written (§1.2) |
| 4. Add `addForumDiscussion`/`replyToDiscussion` to `MoodleAdapter` + routes | Medium | New adapter methods, but following an established, proven pattern in the same file (§2) |
| 5. Generalize `createActivity` for all Moodle module types | Medium | Extends existing working logic (`addUrlModule`, `createQuiz`) rather than starting fresh (§2) |
| 6. Build `NotificationsController` (`logs`, `preferences`) | Medium | Wraps an already-correct service; needs a data source decision for "logs" (query Novu's API directly, or track deliveries in your own DB as they're triggered) |
| 7. Decide whether `/analytics/kpis` should start querying ClickHouse instead of / in addition to ERPNext counts | Larger, product decision | Requires deciding what "real-time analytics" should actually show before writing the query (§6) |

Notably, **every item above except #0 and #7** is a case where the hard integration work with the OSS system was already done correctly somewhere in the codebase — the fixes are about finishing the wiring, not building new integrations from scratch. Item #0 is the exception: it needs to be rewritten, not just connected, because it was built against function names that were guessed rather than verified against real ERPNext/Education source — exactly the gap this round of analysis was requested to find.