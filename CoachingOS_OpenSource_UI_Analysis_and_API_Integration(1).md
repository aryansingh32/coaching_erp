# CoachingOS — Open-Source UI Code Analysis & Frontend API Integration Spec
### Frontend-only deep dive: real colors, real pages, real components extracted from the 7 OSS , plus how all three CoachingOS interfaces must talk to the backend

> **Method:** every color and page listed below was pulled directly out of the uploaded source (`
> **Revision note:** §1.2 (ERPNext) and §1.3 (BigBlueButton) were re-analyzed page-by-page against a fuller re-upload `) that surfaced real stylesheets and portal-page templates not visible in the first pass — see those sections for the newly confirmed colors, pages, and component patterns, and §3 rows 35–39 for the resulting new feature additions.

---

## 1. Per-Module Deep UI Analysis

### 1.1 Moodle (LMS) — `moodle`

**Stack confirmed in code:** PHP + Mustache templates + Bootstrap 5, themed via the **Boost** theme (`theme/boost/scss/`), which imports a newer **Moodle Design System (MDS)** token layer (`scss/design-system.scss` → `lib/bundles/design-system/scss/tokens`) before falling back to Bootstrap defaults.

**Real extracted colors** (`theme/boost/scss/preset/default.scss` + `bootstrap/_variables.scss`):
```
$primary:  $blue    → #0d6efd   (Bootstrap blue; Moodle's MDS brand blue overrides this per-site)
$success:  $green   → #198754
$warning:  $yellow  → #ffc107
$danger:   $red     → #dc3545
$info:     $cyan    → #0dcaf0
$gray-100…$gray-900 → #f8f9fa … #212529   (11-step neutral scale)
```
**Verdict:** Moodle's palette is generic Bootstrap — competent but forgettable. Don't copy the exact hex values; copy the *structure* (a primary blue + full semantic success/warning/danger triad + an 11-step neutral gray scale for text/border hierarchy). This structure is what CoachingOS's Institute app palette is built on (§2.2).

**Full activity/content-type inventory** (confirmed via `mod/*` directory — this is the complete list of "things a course can contain," i.e. the literal feature surface your Moodle authoring UI must expose):

| Mustache/mod folder | What it is | CoachingOS component to build |
|---|---|---|
| `resource` | File/PDF download | `<FileResourceCard>` |
| `url` | External link | `<LinkResourceCard>` |
| `page` | Rich-text page | `<PageViewer>` |
| `folder` | File folder | `<FolderBrowser>` |
| `label` | Inline text/media block | inline in `<ActivityCard>` |
| `book` | Multi-chapter e-book | `<BookReader>` (chapter tree + prev/next) |
| `quiz` | Timed test/exam | `<QuizRunner>` (highest priority — see prior spec) |
| `assign` | Assignment submission | `<AssignmentUploader>` + `<RubricGrader>` |
| `forum` | Threaded discussion | `<DiscussionThread>` |
| `choice` | Single-question poll | `<PollWidget>` |
| `feedback` | Multi-question survey | `<SurveyForm>` |
| `data` | Structured database activity | Phase-3/optional — low priority for a coaching institute |
| `glossary` | Term glossary | `<GlossaryBrowser>` |
| `lesson` | Branching conditional content | Phase-3/optional |
| `workshop` | Peer-review assignment | Phase-3/optional |
| `scorm` | SCORM package player | `<ScormPlayer>` (iframe-wrap the SCORM runtime, don't rebuild it) |
| `wiki` | Collaborative wiki | Phase-3/optional |
| `lti` | External tool launch (LTI) | `<LtiLaunchFrame>` |
| `bigbluebuttonbn` | Live class block | superseded by CoachingOS's own `<LiveClassFrame>` (§ prior spec §3.3) |
| `qbank` | Question bank (backs quizzes) | Teacher-side `<QuestionBankManager>` |
| `subsection` | Nested course sub-section | folded into `<ChapterAccordion>` nesting |

**Course dashboard pattern** (`course/format/templates/local/content/cm.mustache`, `local/activitychooser/`): activity cards grouped into collapsible weekly/topic sections, each card showing an icon-by-type + title + a **completion ring** (not a percentage bar — Moodle uses a small circular checkmark/ring per activity, aggregated into a course-level progress bar). **Adopt this exact interaction model** for `<CourseContentViewer>` — it's genuinely good UX and is the "Netflix-style" progress feel already targeted in the UX plan.

**Grading interface** (`grade/templates/grades/grader/`, `grade/grading/form/guide/`): a spreadsheet-like grid (students × activities) with inline rubric/guide popovers. This is the pattern for the Teacher `<GradeEntryGrid>` (Phase 4 in the prior build plan).

---

### 1.2 ERPNext / Frappe Desk + Frappe Education — `erpnext_ui.` / `erpnext.` (full re-upload), `education_`

**Stack confirmed after the fuller re-upload:** ERPNext's own bundled stylesheets (`erpnext/erpnext/public/scss/*.scss`) **are present this time**, and inspecting all six of them (`erpnext.scss`, `erpnext.bundle.scss`, `erpnext-web.bundle.scss`, `website.scss`, `point-of-sale.scss`, `call_popup.scss`, `order-page.scss`) turns up almost no hardcoded color — nearly every rule reads `var(--border-color)`, `var(--text-color)`, `var(--control-bg)`, `var(--text-md)`, `var(--border-radius-sm)`. **Confirmed finding:** ERPNext's own SCSS is a *token consumer*, not a *token definer* — the actual palette lives in the core `frappe` framework repo (not included in either upload). Treat this as settled rather than a gap to re-check.

**Real extracted hardcoded colors** (the handful of places ERPNext does hardcode, all in `erpnext.scss`):
```scss
.circle   { background-color: #278f5e; }   // small green presence/status dot (e.g. "online now")
.ringring { border: 2px solid #62bd19; }   // pulsing notification ring animation around the dot
```
This is a real, reusable **"live now" indicator pattern** (a small green dot with a pulsing ring) — directly applicable to CoachingOS's own "live class in progress" badge on batch cards and the Parent-mode "child is in class now" state called out in the prior spec.

**Real page-by-page inventory of ERPNext's own portal pages** (`erpnext/erpnext/www/*`, `erpnext/erpnext/templates/pages/*`, `templates/includes/*` — confirmed file-by-file, this is what ERPNext ships as *public-facing, non-Desk* UI, i.e. the part of ERPNext actually closest in spirit to a student/parent-facing portal):

| Page / template | What it does (confirmed from the actual Jinja2 + JS) | CoachingOS equivalent |
|---|---|---|
| `www/support/index.html` + `index.py` | **Help Center**: hero search bar ("Search the docs"), a "Frequently Read Articles" card grid (ranked by page-view count via a SQL join on `Web Page View`), then a category-grouped article list pulled from `Help Article`/`Help Category` doctypes | Build `/institute/help` (and a lighter version inside `/learn`) with the same 3-part layout: search → popular articles → category list. This is a fully-formed, reusable pattern, not a rough sketch. |
| `www/book_appointment/index.html` + `index.js` (7.9KB — a real two-step booking flow) | **Two-step appointment booking:** Step 1 — date picker + timezone select → time-slot grid (slots render as cards, states: default / hover / `unavailable` / `selected`) → Step 2 — contact form (name, phone, Skype, email, notes) → submit. Config comes from an `Appointment Booking Settings` doctype. | Directly reusable for two CoachingOS features: (a) an admissions-facing **"Book a free demo class / counseling call"** page for prospective students, and (b) an Institute Admin **"Schedule a parent meeting"** flow. Build `<AppointmentScheduler>` with this exact two-step shape. |
| `templates/includes/fee/fee_row.html` | Real fee list row: **Program · Grand Total · Paid Amount · Outstanding Amount**, linking to `/fees/{name}/` | This is the authoritative column set for the Institute Finance table and the Student/Parent Fees card — use these four fields as the baseline row shape, not an invented one. |
| `templates/includes/announcement/announcement_row.html` | Announcement card: subject (as H1), truncated description (150-char clamp via JS, expandable), posted-by + date + attachment count | Direct reference for the `SchoolDiary`-style feed on `/learn` home and `/institute/communication`'s announcement cards — replicate the 150-char clamp pattern for feed density. |
| `templates/includes/discussion/discussion_row.html` | Minimal threaded-discussion list row (subject only, links to `/discussions?discussion=...`) | Low-fidelity reference only — Moodle's forum pattern (§1.1) is the stronger model for a real `<DiscussionThread>` component; use this just to confirm ERPNext's own bar is intentionally simple. |
| `www/book_appointment/index.css` | Real color states for the time-slot grid: default border `#cccccc`, hover bg `#ddd`, `.unavailable` bg `#CBD5E0` / text `#718096`, `.selected` bg `var(--primary-color)` / text white | Use these exact 4 states (default/hover/unavailable/selected) for `<AppointmentScheduler>`'s slot grid and for any other slot-style picker (e.g. a future "pick a batch timing" UI). |

**Real extracted page inventory — Frappe Education portal** (`education/frontend/src/pages/*.vue` — this is the *entire* self-service feature set Frappe ships for a coaching/school context, confirmed file-by-file):

| Vue page | Purpose | CoachingOS equivalent | Status |
|---|---|---|---|
| `Home.vue` | Landing/summary | `/learn` home | ✅ built |
| `Schedule.vue` | Class timetable | `/learn/schedule` | ✅ built |
| `Attendance.vue` | Attendance history + `AttendanceDetail.vue` drill-in | `/learn/timeline` (partial) | ⚠️ needs a dedicated attendance calendar view, not just a timeline feed |
| `Grades.vue` | Assessment results | `/learn/grades` | ✅ built |
| `Fees.vue` + `FeesPaymentDialog.vue` | Outstanding dues + **in-page payment modal** | `/learn/profile` Pending Fees card | ⚠️ **Razorpay checkout exists but isn't wired as a modal here** — Frappe's own reference pattern is a modal dialog, not a separate page; match that pattern when wiring Phase 0 |
| `Leaves.vue` + `NewLeave.vue` | Leave request submission | ❌ missing (confirmed gap from prior audit) | Build `<LeaveRequestForm>` as a **dialog**, matching this reference, not a full page |
| `SchoolDiary.vue` | Teacher-posted daily notes/announcements | Rolls into `/institute/communication` + student-facing feed | ⚠️ no student-facing "diary" feed currently exists — worth adding as a lightweight card list under `/learn` home |
| `UpdateStudentInfo.vue` (component) | Self-service profile edit | `/learn/profile` edit mode | Confirm this exists — prior audit didn't call it out explicitly |
| `ProfileModal.vue` | Profile summary popover | Header avatar dropdown | Reuse pattern for both web and mobile |
| `Calendar.vue` / `CalendarView.vue` / `CalendarEvent.vue` | Month-grid calendar with event dots | `/learn/schedule`, `/institute/schedule` | Adopt this exact calendar interaction (month grid + colored event dots + day drill-in) as the shared `<CalendarView>` component across Institute and Student apps |
| `Sidebar.vue` / `CollapseSidebar.vue` / `SidebarLink.vue` | Collapsible nav | Institute web sidebar | Already matches the planned Institute app IA |
| `Navbar.vue` / `UserDropdown.vue` | Top nav + account menu | Shared header across all 3 apps | Baseline reference |

**Verdict:** This Vue SPA is small (8 pages, ~15 components) but it is the **most directly authoritative UX reference you have**, because it was purpose-built by the Frappe team for exactly this persona (student self-service against ERPNext Education doctypes) — closer to your actual use case than Moodle or generic ERPNext Desk. Two concrete process patterns worth lifting verbatim:
1. **Fees uses a modal dialog for payment**, not a page nav — replicate for Razorpay wiring.
2. **Leave request is a modal dialog** (`NewLeave.vue`), not a page — build `<LeaveRequestForm>` the same way.

**ERPNext Desk data-entry pattern** (informed by `www/` templates + the doctype list in `Extracted_1000_APIs_List.md` §1 — 15 confirmed doctypes: Student, Program, Course, Fee Structure, Payment Entry, User, Role, Assessment Plan, Attendance, Batch, Instructor, Department, Leave Application, Task, Project): Frappe Desk forms use a **section-break, 2-column, collapsible-field-group layout** — this is the layout structure (not the visual chrome) to replicate in `<FormSection>` for every Institute Admin create/edit form (§3.2 of the prior spec).

---

### 1.3 BigBlueButton — `bbb` / ` (full re-upload)

**Stack confirmed after the fuller re-upload:** `bigbluebutton-html5` client is a Meteor + React app. The re-upload surfaces **7 real CSS files** that weren't visible before (`public/stylesheets/*.css`) — `toastify.css`, `fontSizing.css`, `normalize.css`, `bbb-icons.css`, `toggleSwitch.css`, `modals.css`, `fonts.css` — plus the actual `main.html` shell markup with inline `<style>`. This gives a genuine page-by-page picture of the pre-join and in-session chrome, not just the sound/asset manifest from before.

**Real extracted colors** (from `client/main.html`'s inline styles — the loading shell rendered before the React app mounts):
```css
body               { background-color: #06172A; }   /* deep navy — the actual BBB "waiting to join" background */
body (print/high-contrast override) { background-color: #FFF; color: #000; }
.browser-warning-banner { background: #ffdddd; color: #a00; }  /* light-red compatibility warning banner */
font-family: 'Source Sans Pro', Arial, sans-serif;   /* body font */
font-family: Tahoma, ... ;                            /* Farsi-language override — confirms BBB ships per-locale font swaps */
```
`#06172A` is a real, verifiable BBB brand color (not a guess) — a deep navy consistent with "video call at night" conferencing tools generally. **This is a legitimate option for the `<LiveClassFrame>` loading-state background** while the iframe boots, so the transition from CoachingOS's own chrome into BBB's iframe doesn't flash white.

**Real extracted component-level UI patterns** (all confirmed via the actual CSS, all CSS-variable-driven rather than hardcoded — consistent with the "token consumer" pattern also found in ERPNext, §1.2):

| Stylesheet | Confirmed pattern | CoachingOS application |
|---|---|---|
| `toggleSwitch.css` | A settings toggle switch: track color is `var(--color-danger)` when off, `var(--color-success)` when on; thumb is a solid `#FAFAFA` circle with a drop shadow; focus/active states get a glow using `var(--color-primary)` | This is the reference implementation for the shared `<Switch>` primitive flagged as missing in the prior spec (§2.1) — use red/green track + solid thumb, not a generic on/off gray toggle. |
| `modals.css` | React-Modal overlay/content system: overlay is `rgba(0,0,0,0.5)`, content enters with a `scale(0.5) rotateX(-30deg) → scale(1) rotateX(0)` 3D-tilt animation over 150ms, and modals stack in three explicit z-index tiers (`modal-low`/`modal-medium`/`modal-high`, FIFO within a tier) | The three-tier z-index stacking convention (not just "one dialog at a time") is worth adopting verbatim for CoachingOS, since Live Class chrome realistically needs to stack: a base modal (e.g. "leave class?") over a toast over the iframe itself. |
| `toastify.css` | Toast entrance/exit are directional bounce animations (`bounceInRight`/`bounceInLeft`/top/bottom variants), not simple fades | Use directional bounce (not fade) for the "user joined" / "hand raised" toasts in `<LiveClassFrame>`'s chrome, matching BBB's own in-session notification feel so the wrapper doesn't feel visually disconnected from the embedded iframe. |
| `fontSizing.css` | A user-controlled **accessibility font-size scale**: `.extraSmallFont` (0.5rem) → `.smallFont` (1.0rem) → `.mediumFont` (1.5rem) → `.largeFont` (2.0rem) → `.extraLargeFont` (3.0rem) | This is a genuinely useful feature to lift wholesale: add a font-size accessibility control to the Student/Parent app (§2.3's "Study Companion" mood) — valuable for younger students and for parents who may need larger text, and it's a two-hour build given BBB already proves the exact scale steps that read well. |
| `bbb-icons.css` | A dedicated icon font for in-call actions (mute, camera, hand-raise, screen-share, etc.) | Confirms the icon vocabulary a live-class chrome needs; CoachingOS should cover the same action set with `lucide-react` equivalents in its own chrome (mute/camera/leave/hand-raise/chat), keeping icon meaning consistent with what students already see inside the BBB iframe itself. |

**Resource manifest (confirmed, unchanged from prior pass):** `userJoin.mp3`, `bbb-handRaise.mp3`, `conf-muted.mp3`/`conf-unmuted.mp3`, `Poll.mp3`, `LeftCall.mp3`, `ScreenshareOff.mp3`, plus virtual-background images and two on-device TFLite segmentation models (`segm_full_v679.tflite`, `segm_lite_v681.tflite`) for background blur/replacement.

**Verdict — unchanged from the prior spec, now confirmed by deeper inspection:** BBB is a complete, self-contained real-time video engine (WebRTC signaling, background blur ML, hand-raise/poll/mute event sounds, its own modal/toast/toggle component system). **Do not rebuild any of this.** `<LiveClassFrame>` must be an iframe wrapping BBB's own join URL. CoachingOS's job is only the **chrome around the iframe** — and that chrome should now explicitly borrow four concrete, verified BBB patterns: the `#06172A` navy loading background, the three-tier modal z-index stacking, directional-bounce toasts, and the accessibility font-size scale — so the wrapper and the embedded client feel like one continuous product instead of two stitched-together UIs.

---

### 1.4 Metabase — `metabase`

**Stack confirmed:** React + Emotion (styled-components) + **Mantine**, with a genuinely sophisticated two-tier color system: a base HSL palette (`ui/colors/constants/base-colors.ts`) feeding a **semantic CSS-variable layer** (`--mb-color-*`) that supports full whitelabeling.

**Real extracted colors:**
```ts
// Brand (dynamic CSS var, but base default ≈ Metabase blue)
blue.40 (base/brand): hsl(208, 72%, 60%)   ≈ #509EE3
blue.50:              hsl(208, 68%, 53%)   ≈ #3F7DC4  (darker, hover/active state)
blue.10:              hsl(208, 79%, 96%)   ≈ #EAF3FC  (tint, selected-row backgrounds)

// "Orion" — dark neutral scale (used for text + dark-mode surfaces)
orion.100: hsl(204, 66%, 8%)   ≈ #0B1A21   (near-black, dark bg)
orion.80:  hsl(205, 19%, 23%)  ≈ #303B42   (elevated dark surface)
orion.60:  hsl(205, 8%, 43%)   ≈ #656B6E   (muted text)
orion.10:  hsl(240, 4%, 95%)   ≈ #F1F1F3   (light bg)

// "Ocean" — light neutral-blue scale for cards/nav in light mode
ocean.10:  hsl(208, 79%, 96%)  ≈ #EAF3FC
ocean.40:  hsl(208, 72%, 60%)  ≈ #509EE3
```
Each brand/accent color is generated as an 11-step **tint/shade ramp** (5→100) via `color-mix()`, not hand-picked hex values — i.e. Metabase's actual engineering practice is "one brand color in, a full ramp out," which is the correct pattern for CoachingOS's own `custom_branding` feature (tenant picks one primary color, the frontend derives the full tint/shade ramp programmatically — implement this with the same `color-mix()`/CSS-variable approach rather than storing 11 hardcoded hex values per tenant).

**Dashboard architecture** (`frontend/src/metabase/dashboard`, referenced via `documents` module): a responsive grid of number-cards and chart-cards, each independently loading, skeleton-first. This is the direct reference for `<KPICard>` + the dashboard grid layout used in Super Admin `/superadmin/dashboard`, `/superadmin/analytics`, and Institute `/institute/dashboard`.

**Verdict:** Don't rebuild Metabase's chart rendering — it's embedded via signed iframe (unchanged from prior spec). **Do** adopt its two concrete engineering patterns: (1) semantic CSS-variable color layer instead of hardcoded hex in components, (2) programmatic tint/shade ramp generation from a single brand color for whitelabeling.

---

### 1.5 Novu — `novu`

**Stack confirmed:** React + Tailwind, HSL-based CSS custom properties in `apps/dashboard/src/index.css`.

**Real extracted colors:**
```css
--novu-500 (brand primary): hsl(346, 73%, 50%)  ≈ #E0264B   /* rose/magenta-red — Novu's signature accent */
--novu-700:                 hsl(346, 70%, 50%)  ≈ #DD284C   /* hover/active */
--novu-800:                 hsl(346, 72%, 42%)  ≈ #B81F3D   /* pressed */
--foreground-950 (near-black text): hsl(222, 32%, 8%) ≈ #0A0D14
--neutral-0…950: an 13-step neutral scale from pure white to near-black
--success: var(--green-500)   --warning: var(--orange-500)   --error/destructive: var(--red-500)
```
**Verdict:** Novu is a dark-mode-friendly developer console with **one saturated accent (rose/magenta) used sparingly** against a mostly neutral/gray UI — exactly the restraint you want in an internal tool. This directly informs the Super Admin app's use of a single reserved accent color (`#6E40C9` violet, per the prior spec) against dense neutrals, rather than a colorful consumer palette — same design principle, different accent hue chosen to avoid clashing with any tenant's `custom_branding` primary color (which could plausibly be red/pink).

**Real extracted page/route inventory** (`apps/dashboard/src/utils/routes.ts` — this is Novu's complete internal console, i.e. the literal feature list Super Admins need for `/superadmin/notifications`):

| Novu route | Purpose | Maps to CoachingOS Super Admin screen |
|---|---|---|
| `WORKFLOWS`, `EDIT_WORKFLOW` (+ `EDIT_STEP`, `EDIT_STEP_TEMPLATE`, `EDIT_STEP_CONDITIONS`, `EDIT_WORKFLOW_PREFERENCES`) | Visual workflow/template builder, step-by-step | `/superadmin/notifications` → **Workflow/Template Editor** (embed or link to Novu's own dashboard rather than rebuild — confirmed correct in prior spec) |
| `TEST_WORKFLOW`, `TRIGGER_WORKFLOW` | Test-send a notification | Same embed |
| `SUBSCRIBERS`, `EDIT_SUBSCRIBER`, `CREATE_SUBSCRIBER` | Subscriber directory (maps 1:1 to your users/students) | Not needed as a separate UI — CoachingOS already manages subscribers implicitly via student/teacher accounts; the gateway's Novu adapter syncs this automatically |
| `TOPICS`, `TOPICS_CREATE`, `TOPICS_EDIT` | Broadcast groups (e.g. "Batch 10A parents") | Informs how `/institute/communication`'s audience picker should work — Novu Topics ≈ your batch/institute audience segments |
| `ACTIVITY_FEED`, `ACTIVITY_WORKFLOW_RUNS`, `ACTIVITY_REQUESTS`, `ACTIVITY_CONVERSATIONS` | Delivery logs/debugging | `/superadmin/notifications` → **Delivery Log** tab |
| `INTEGRATIONS`, `INTEGRATIONS_CONNECT` | Channel providers (SMS/WhatsApp/Email/Push) | Confirms your existing Wati.io/MSG91/Firebase adapters map cleanly to Novu's integration model — no new UI needed beyond a read-only "connected channels" status card |
| `LAYOUTS`, `TRANSLATIONS`, `VARIABLES` | Template layout wrapper, i18n, reusable variables | Phase-3/optional — only relevant once you support multiple languages per tenant |
| `WEBHOOKS`, `DOMAINS` | Outbound webhooks, custom sending domains | Phase-3/optional, Pro-tier only |

**Consumer-facing component (all personas):** `@novu/notification-center`'s `NovuBell` — already installed per the prior codebase audit — is the correct approach for every non-admin user; Novu's own dashboard should **never** be exposed outside Super Admin.

---

## 2. CoachingOS Color System — Grounded in the Above

Each app's palette is not arbitrary — it's derived from the strongest real pattern found in the corresponding OSS module, adjusted for accessibility and whitelabel-safety.

### 2.1 Super Admin — dark, single reserved accent (Novu-derived restraint + Metabase Orion dark scale)
```ts
export const platform = {
  bg: '#0B1220',        // deeper than Novu's near-black, roomier than Metabase Orion-100
  surface: '#141B2E',
  elevated: '#1C2540',
  border: '#293252',
  text: '#F0F4FC',
  muted: '#8A93B2',
  accent: '#7C5CFF',    // violet — deliberately far from Novu's rose AND any plausible tenant brand color
  success: '#22C55E',   // same hue family as Novu/Moodle/ERPNext green — cross-app consistency for "success" semantics
  warning: '#F59E0B',
  danger: '#EF4444',
};
```
**Rule:** `accent` is reserved for Super Admin only and must never be reused as a tenant `custom_branding` default, to keep "this is the platform operator's view" visually unambiguous from "this is a tenant's branded view."

### 2.2 Institute + Teacher — light, Moodle-semantic-triad + ERPNext form density (Bootstrap-lineage, refined)
```ts
export const institute = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#DFE3EA',
  text: '#1A2233',
  muted: '#616B7C',
  primary: 'var(--inst-primary, #2F6FED)',  // dynamic per tenant; #2F6FED is the un-branded default, deliberately close to Moodle's #0d6efd for familiarity to anyone who's used Moodle/ERPNext before
  success: '#188544',    // same family as Moodle's #198754
  warning: '#B7791F',    // same family as Moodle's #ffc107, darkened for AA contrast on white
  danger: '#D6334C',
};
```

### 2.3 Student/Parent — soft, Metabase Ocean tint scale warmed toward PW's confident blue
```ts
export const mobile = {
  light: {
    bg: '#F3F6FC',      // ≈ Metabase ocean.5/10 tint, softened
    card: '#FFFFFF',
    border: '#E4E9F5',
    text: '#131A2B',
    muted: '#6B7488',
    accent: '#2F6FED',   // shared brand blue with Institute app (same tenant identity, softer mood via more rounding/whitespace, not a different hue) — swapped by custom_branding if enabled
    success: '#16A34A',
    streak: '#F59E0B',   // warm amber for streak/gamification — deliberately outside the blue/green semantic set so it reads as "delight," not "status"
  },
};
```
**Note on brand consistency:** Institute and Student apps intentionally **share the same primary blue** (unlike Super Admin's reserved violet) — a student and their institute admin are using the *same* branded product from the tenant's point of view; only Super Admin needs visual separation as "the other company's tool."

---

## 3. Full Feature Parity Checklist (OSS feature → CoachingOS page)

This is the literal, page-by-page answer to "make sure all 7 modules' frontend features exist in our UI." Cross-reference against §4 (route inventory) in the prior spec for build status; this table is the **feature completeness audit**, organized by OSS source.

| # | OSS feature (confirmed in code) | Source | CoachingOS page | Interface |
|---|---|---|---|---|
| 1 | Course/activity dashboard with completion rings | Moodle `course/format` | `/learn/courses/[batchId]` | Student |
| 2 | Quiz attempt (question nav, timer, review) | Moodle `mod/quiz` | `/learn/tests/[quizId]` | Student |
| 3 | Assignment upload + rubric grading | Moodle `mod/assign` | `<AssignmentUploader>` in course viewer + `<RubricGrader>` in `/teach/grades` | Student + Teacher |
| 4 | Discussion forum | Moodle `mod/forum` | Phase-3 `<DiscussionThread>` | Student + Teacher |
| 5 | Poll / choice activity | Moodle `mod/choice` | Phase-3 `<PollWidget>` | Student |
| 6 | Survey/feedback form | Moodle `mod/feedback` | Phase-3 `<SurveyForm>` | Student |
| 7 | Glossary | Moodle `mod/glossary` | Phase-3, low priority | Student |
| 8 | SCORM package playback | Moodle `mod/scorm` | Phase-3 `<ScormPlayer>` iframe | Student |
| 9 | Question bank authoring | Moodle `qbank` | `/teach/tests` create flow | Teacher |
| 10 | Content authoring/upload | Moodle course editing | `/teach/courses/[courseId]` | Teacher |
| 11 | Grading grid (spreadsheet-style) | Moodle `grade/grader` | `/teach/grades` `<GradeEntryGrid>` | Teacher |
| 12 | Student CRUD + profile | ERPNext `Student` doctype | `/institute/students` | Institute Admin |
| 13 | Batch/Program management + enrollment | ERPNext `Batch`/`Program` | `/institute/batches` | Institute Admin |
| 14 | Attendance marking + reports | ERPNext `Attendance` | `/institute/attendance`, `/teach/attendance` | Institute Admin + Teacher |
| 15 | Fee schedule + payment entries | ERPNext `Fee Structure`/`Payment Entry` | `/institute/finance` | Institute Admin |
| 16 | Assessment/grades | ERPNext `Assessment Plan` | `/institute/grades` | Institute Admin |
| 17 | Instructor directory | ERPNext `Instructor` | `/institute/staff` | Institute Admin |
| 18 | Leave application (submit) | ERPNext `Leave Application` / Education `NewLeave.vue` | `<LeaveRequestForm>` dialog in `/learn/profile` | Student + Parent |
| 19 | Leave application (approve) | ERPNext `Leave Application` | `/institute/leave-requests` | Institute Admin |
| 20 | Student self-service Fees + pay-now modal | Education `Fees.vue`/`FeesPaymentDialog.vue` | `/learn/profile` Pending Fees card | Student + Parent |
| 21 | Student self-service Attendance history | Education `Attendance.vue` | New: attendance calendar in `/learn` | Student + Parent |
| 22 | Self-service profile edit | Education `UpdateStudentInfo.vue` | `/learn/profile` edit mode | Student |
| 23 | Calendar (month grid, event dots) | Education `Calendar.vue` | `<CalendarView>` shared component | Institute + Student |
| 24 | Daily diary/announcements feed | Education `SchoolDiary.vue` | New: card feed on `/learn` home | Student + Parent |
| 25 | Live class join (video/audio/chat/hand-raise/poll) | BBB HTML5 client | `/learn/live-class/[meetingId]`, `/teach/live-class` | Student + Teacher |
| 26 | Live class recordings | BBB `getRecordings`/`publishRecordings` | `/institute/recordings`, `/teach/recordings`, `/learn/recordings` | All three |
| 27 | Background blur/virtual background | BBB TFLite models | Inherited automatically via BBB iframe — no CoachingOS work needed | Student + Teacher |
| 28 | Embedded BI dashboard w/ KPI cards | Metabase dashboard grid | `/institute/dashboard`, `/superadmin/analytics` | Institute Admin + Super Admin |
| 29 | Whitelabel color theming via CSS variables | Metabase `--mb-color-*` pattern | `custom_branding` feature — tenant primary color → generated ramp | Institute + Student |
| 30 | In-app notification bell/feed | Novu `notification-center` | Header of all 3 apps | All personas |
| 31 | Notification workflow/template authoring | Novu dashboard `WORKFLOWS` | `/superadmin/notifications` (embed) | Super Admin |
| 32 | Notification delivery logs | Novu `ACTIVITY_FEED` | `/superadmin/notifications` Delivery Log tab | Super Admin |
| 33 | Broadcast audience segments (Topics) | Novu `TOPICS` | Audience picker in `/institute/communication` | Institute Admin |
| 34 | Channel/provider connection status | Novu `INTEGRATIONS` | Read-only status card, Super Admin settings | Super Admin |
| 35 | Help Center (search + popular articles + category list) | ERPNext `www/support` | New: `/institute/help`, lighter version in `/learn` | Institute Admin + Student/Parent |
| 36 | Two-step appointment booking (date/timezone → slot grid → contact form) | ERPNext `www/book_appointment` | New: `<AppointmentScheduler>` for "book a demo class" (admissions) and "schedule a parent meeting" (Institute Admin) | Institute Admin (+ public admissions page) |
| 37 | "Live now" presence indicator (pulsing dot) | ERPNext `.circle`/`.ringring` | Batch-card live-class badge + Parent "child in class now" state | Institute + Student/Parent |
| 38 | Accessibility font-size scale (5-step) | BBB `fontSizing.css` | New: font-size control in Student/Parent app settings | Student + Parent |
| 39 | Three-tier modal z-index stacking + directional-bounce toasts | BBB `modals.css`/`toastify.css` | `<LiveClassFrame>` chrome (dialogs/toasts over the BBB iframe) | Student + Teacher |

---

## 4. Frontend ↔ Backend API Communication Architecture

### 4.1 Reality check on "1000s of APIs"

`Extracted_1000_APIs_List.md` enumerates **980 rows**, but inspecting the actual patterns shows it's a **paginated/parameterized expansion of a much smaller unique surface**:

| OSS system | Unique endpoint *patterns* found | How the list inflates it |
|---|---|---|
| ERPNext | 15 doctypes × `GET /api/resource/{doctype}` (generic Frappe REST — same shape supports POST/PUT/DELETE too) | Repeated across `limit_start=0,20,40…580` — i.e. pagination pages, not distinct endpoints |
| Moodle | 10 unique `wsfunction` calls (`core_course_get_courses`, `mod_quiz_get_quizzes_by_courses`, `core_user_create_users`, etc.) | Repeated per `courseid=0..N` |
| Novu | 10 unique routes (`events/trigger`, `subscribers`, `topics`, `workflows`, `layouts`, `environments`, `tenants`, etc.) | Repeated per `page=0..N` |
| Metabase | 2 unique patterns (`GET /api/dashboard/:id`, `POST /api/card/:id/query`) | Repeated per dashboard/card id |
| BigBlueButton | 10 unique actions (`create`, `join`, `end`, `getMeetingInfo`, `getRecordings`, etc.) | Repeated per `meetingID` |

**Real unique surface: ~47 endpoint patterns.** This matters directly for frontend architecture: **you do not write ~1000 separate API integrations.** You write ~47 typed client functions (one per pattern, parameterized), and the "1000s of calls" happen naturally at runtime through normal pagination/looping — exactly like any list page already does. Communicating with "all 1000 APIs" is achieved by making sure the frontend's data layer supports **generic pagination, generic doctype/resource fetching, and generic ID-parameterized calls** — not by hand-writing a thousand fetch functions.

**Critical architectural point, unchanged from the prior spec and reinforced here:** the Next.js/mobile frontend **never calls ERPNext/Moodle/Novu/Metabase/BBB directly.** Every one of those 47 patterns is already wrapped by the NestJS Gateway's 14 modules (confirmed in `features.md`'s ground-truth module table) and exposed as **~50 clean `/api/v1/*` Gateway routes** with caching, tenant-isolation, and auth already applied (per `CoachingOS_Architecture_v3.md` §1). The frontend's entire job is to consume the Gateway, never the underlying OSS systems.

### 4.2 Required Next.js data layer (all 3 web/mobile codebases)

**One typed client per Gateway module**, generated/maintained by hand as thin Axios wrappers, matching the module list in `features.md` §1:

```
web/lib/api/
├── auth.ts            // send-otp, verify-otp, refresh, logout, features
├── students.ts        // list, create, get, update, bulk-import, rfid-card, timeline
├── batches.ts         // list, create, get, enroll, schedule, instructors
├── attendance.ts       // manual, reports  (+ rfid-punch consumed via WebSocket, not REST)
├── fees.ts             // schedule, payment, pending, razorpay/*
├── educationPortal.ts  // parent/children, students/:id/{schedule,attendance,invoices,programs,grades,leave}
├── lms.ts              // courses, courses/:id/content, courses/:id/grades
├── liveClass.ts        // list, create, join, delete, recordings
├── tests.ts            // list, attempt/start, attempt/review, attempt/submit
├── analytics.ts        // dashboard/:id, kpis
├── tenants.ts           // (Super Admin) create, list, get, update, delete, features
├── superadmin.ts        // stats, audit-logs, tenant metrics, suspend, feature catalog, tenant features
├── health.ts             // liveness, readiness
└── proxy.ts               // (Super Admin only) raw erp/:doctype, raw moodle call
```

Each file exports typed functions consumed by TanStack Query hooks — one hook file per resource, e.g.:

```ts
// web/hooks/useStudents.ts
export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.list(params),
  });
}
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}
```

**This pattern must be applied uniformly across all 14 Gateway modules for all 3 interfaces** — Super Admin, Institute/Teacher, and Student/Parent (mobile mirrors the same hook pattern against the same `lib/api` shape, per the shared `api-client.ts` interceptor already in place).

### 4.3 Pagination — handling the "many pages" reality directly

Since ERPNext resources and several other endpoints are page-based (`limit_start`), every list-consuming hook must support cursor/offset pagination out of the box, not as an afterthought:

```ts
export function useInfiniteStudents(filters: StudentFilters) {
  return useInfiniteQuery({
    queryKey: ['students', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => studentsApi.list({ ...filters, limit_start: pageParam }),
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length * 20 : undefined,
  });
}
```
Use this for every Institute Admin data table (`<DataTable>` from the prior spec should accept either a paged `useQuery` result for small lists or an `useInfiniteQuery`/virtualized result for large ones like Students across a big institute).

### 4.4 ID-parameterized calls (Moodle courseid, BBB meetingID, Metabase dashboard/card id)

These map naturally to dynamic route segments already present in the app (`/learn/courses/[batchId]`, `/learn/live-class/[meetingId]`) — no special handling needed beyond making sure every such page reads its ID from the route param and passes it straight through to the typed client function. The "N repeats per ID" pattern in the API list is just what happens when a user browses N courses/meetings — not something the frontend needs to special-case.

### 4.5 Real-time channels (not REST — must be WebSocket/SSE)

Two features in the checklist are fundamentally not request/response and must not be implemented as polling:
- **RFID live attendance feed** (`/institute/attendance`, `/teach/attendance-rfid`) — Socket.io client (already installed: `socket.io-client` in `web/package.json`), subscribed to a tenant-scoped room, pushed by the Gateway when `attendance/rfid-punch` webhook fires.
- **Live-class presence/status** ("your child is in class now" for Parent mode) — same Socket.io channel, tenant-scoped, driven by BBB's own webhook-to-Gateway event.

Per `CoachingOS_Architecture_v3.md`, the Gateway already uses a Redis adapter for Socket.io scaling — the frontend just needs one shared `useSocket()` hook per app that joins the tenant room on auth and exposes typed event listeners (`attendance:punch`, `liveclass:status`), rather than each page opening its own connection.

### 4.6 Auth header + tenant-isolation contract (applies to every one of the 47 patterns)

- Every request carries `Authorization: Bearer <JWT>` via the existing Axios interceptor — no endpoint is called unauthenticated except `auth/send-otp` and `auth/verify-otp`.
- The JWT encodes `role` and `instituteId`; the frontend **never sends `instituteId` as a request parameter it can edit** — it's resolved server-side from the token on every Gateway route. Any component that appears to need a tenant filter (Metabase embeds, analytics KPIs, proxy calls) must rely on this server-side resolution, matching the hard security rule from the prior spec §6.
- 401 responses trigger the existing refresh-token interceptor; a second 401 after refresh triggers logout — this is already implemented in `web/lib/api-client.ts` and must be mirrored exactly in `mobile/lib`.

### 4.7 Error/loading contract (ties back to the Definition of Done in the prior spec)

Every one of the 47 typed client functions returns errors in a normalized shape (`{ code, message }`) via the Axios interceptor, so every `useQuery`/`useMutation` consumer can render a single shared `<ErrorState>` component rather than each page inventing its own error UI. Combined with the mandatory loading-skeleton/empty-state rule from the prior spec, this is what makes "communicate with all the APIs" actually reliable in production rather than just technically wired.

---

## 5. Summary — What This Document Adds Beyond the Prior Master Spec

The earlier `CoachingOS_Frontend_Master_Spec.md` covers *what to build and in what order*. This document covers *why it should look the way it does* (grounded in real extracted OSS colors/patterns) and *how the data layer must be shaped* to make three separate frontends reliably reach the entire backend surface without hand-writing a thousand integrations. Use both together: Master Spec for sequencing and route inventory, this document for design-token sourcing, OSS feature-parity auditing, and API client architecture.
