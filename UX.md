# CoachingOS — Complete UI/UX Architecture Plan
## Design Language, Screen Maps, Component Library, and API Connections

> Reads v2.0 + v3.0 architecture decisions. All UI decisions flow from the backend constraints already established.

---

## 0. Architecture Decision: Separate vs Unified

Before any screen is designed, this question must be settled because it determines the entire deployment structure.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                       │
├─────────────────────┬───────────────────────────────────────────┤
│ Surface             │ Deployment                                 │
├─────────────────────┼───────────────────────────────────────────┤
│ Super Admin Panel   │ SEPARATE Next.js app                       │
│                     │ superadmin.yourplatform.com                │
│                     │ Dark-first, data-dense, internal tool      │
├─────────────────────┼───────────────────────────────────────────┤
│ Institute Admin     │ SAME Next.js app, separate route group     │
│                     │ {slug}.yourplatform.com                    │
│                     │ or custom domain per institute             │
│                     │ Light-first, branding-aware, responsive    │
├─────────────────────┼───────────────────────────────────────────┤
│ Student + Teacher   │ ONE React Native (Expo) app                │
│ + Parent Mobile     │ "CoachingOS" on Play Store / App Store     │
│                     │ Role-detected, UI switches post-login      │
│                     │ Student: study-mode, gamified, dark-ok     │
│                     │ Teacher: efficiency-mode, action-forward   │
│                     │ Parent: read-mode, trustworthy, clean      │
└─────────────────────┴───────────────────────────────────────────┘
```

**Why one mobile app for three roles:**
One binary on the store means one review, one update, one APK size. Students, teachers, and parents from the same institute already use the same app — they just see different screens after OTP login. The JWT role field (`student | instructor | parent`) is the only branching condition. This is exactly how Slack serves multiple workspace types from one app.

**Why separate Super Admin:**
The super admin is an internal operational tool, not a product. It runs on a different JWT secret, has no tenant-branded styling, and is never user-facing. Bundling it with the institute admin creates security and complexity risk.

---

## Part 1: Design Language — "Scholar's Precision"

The design language is named for what it serves: students who need precision (exact rank, exact score, exact deadline) and coaches who need scholarship-grade operational tools. Not a consumer app, not corporate enterprise. The space between.

**Inspirations synthesized:** GitHub's data density + Linear's interaction quality + Duolingo's retention mechanics + the aesthetic of a quality academic planner.

**The signature element:** A **Progress Ring** system. Every entity in the platform — a student, a batch, a course, a test — has a circular progress ring as its primary identity mark. Attendance rings, completion rings, score rings. When a student opens their app, they see their rings before they see lists. The ring fills clockwise in the institute's primary color, with a glow at the fill endpoint. This single element unifies all three apps and the admin panel.

---

### 1.1 Color Token System

Three color contexts: **Platform** (super admin), **Institute** (admin panel, dynamic per branding), and **Mobile** (shared across roles with per-role accent).

```
PLATFORM TOKENS (Super Admin — dark, fixed, non-configurable)
─────────────────────────────────────────────────────────────
--platform-bg-base:        #0D1117    deep ink, base background
--platform-bg-surface:     #161B22    raised surface
--platform-bg-elevated:    #21262D    modals, popovers
--platform-border:         #30363D    dividers
--platform-text-primary:   #F0F6FC    near-white
--platform-text-secondary: #8B949E    muted labels
--platform-text-subtle:    #484F58    timestamps, hints
--platform-accent:         #6E40C9    violet (CoachingOS brand)
--platform-accent-hover:   #8957E5
--platform-success:        #3FB950    green
--platform-warning:        #D29922    amber
--platform-danger:         #F85149    red
--platform-info:           #58A6FF    sky blue

INSTITUTE TOKENS (Admin Panel — light, dynamic, per-institute brand)
──────────────────────────────────────────────────────────────────
--inst-bg-base:            #F6F8FA    off-white canvas
--inst-bg-surface:         #FFFFFF    card/panel surface
--inst-bg-subtle:          #F0F2F5    sidebar, secondary areas
--inst-border:             #D0D7DE    dividers
--inst-text-primary:       #1F2328    near-black
--inst-text-secondary:     #59636E    labels
--inst-text-subtle:        #818B98    hints
--inst-primary:            ← from institute.branding.primaryColor (e.g. #1E40AF)
--inst-primary-light:      ← computed: primary at 10% opacity (highlight)
--inst-primary-text:       #FFFFFF    text on primary bg
--inst-success:            #1A7F37
--inst-warning:            #9A6700
--inst-danger:             #CF222E
--inst-streak:             #FFA657    amber, gamification only

MOBILE TOKENS (React Native — shared, with role accent override)
────────────────────────────────────────────────────────────────
Light mode:
  --mob-bg:                #F4F6FA
  --mob-card:              #FFFFFF
  --mob-border:            #E5E7EB
  --mob-text:              #111827
  --mob-text-muted:        #6B7280

Dark mode (auto on system dark):
  --mob-bg:                #0F1117
  --mob-card:              #1A1D25
  --mob-border:            #2A2D35
  --mob-text:              #F9FAFB
  --mob-text-muted:        #9CA3AF

Role accent (overrides per JWT role):
  student:    --accent: #6366F1    indigo (focus, learning)
  instructor: --accent: #0EA5E9    sky blue (clarity, instruction)
  parent:     --accent: #10B981    emerald (calm, trust, safety)

Achievement colors (all roles):
  --streak:   #F59E0B    fire amber
  --rank-1:   #FFD700    gold
  --rank-2:   #C0C0C0    silver
  --rank-3:   #CD7F32    bronze
  --complete: #10B981    completion green
  --pending:  #F59E0B    in-progress amber
```

---

### 1.2 Typography Scale

```
WEB (Next.js)
──────────────
Display face:   Geist (variable) — precision, modern
Body face:      Geist (variable, regular weight) — consistency
Data face:      Geist Mono — rankings, scores, IDs, timestamps
Source:         next/font/google → import { Geist, Geist_Mono } from 'next/font/google'

Scale (px at 16px base, rem values):
  --text-xs:    0.75rem  / 12px  — hints, tags, timestamps
  --text-sm:    0.875rem / 14px  — table cells, labels, meta
  --text-base:  1rem     / 16px  — body copy, form inputs
  --text-lg:    1.125rem / 18px  — card titles, section headers
  --text-xl:    1.25rem  / 20px  — page section headings
  --text-2xl:   1.5rem   / 24px  — page titles
  --text-3xl:   1.875rem / 30px  — dashboard KPI numbers
  --text-4xl:   2.25rem  / 36px  — hero numbers (total students, MRR)
  --text-5xl:   3rem     / 48px  — super admin platform metrics

MOBILE (React Native)
──────────────────────
Platform font:  System default (SF Pro on iOS, Google Sans on Android)
  → NativeWind classes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
Data/numbers:   Monospace via fontFamily: 'monospace' for scores and ranks
```

---

### 1.3 Spacing, Radius, Shadow

```
SPACING (4px base grid)
  --space-1:   4px
  --space-2:   8px
  --space-3:   12px
  --space-4:   16px
  --space-5:   20px
  --space-6:   24px
  --space-8:   32px
  --space-10:  40px
  --space-12:  48px
  --space-16:  64px

BORDER RADIUS
  --radius-sm:  4px   — tags, badges, small chips
  --radius-md:  8px   — input fields, small cards
  --radius-lg:  12px  — main cards, panels
  --radius-xl:  16px  — modal sheets, floating cards
  --radius-2xl: 24px  — mobile bottom sheets
  --radius-full: 9999px — avatars, pill badges, progress rings

SHADOW (web)
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.05)           — subtle lift
  --shadow-md:   0 4px 6px rgba(0,0,0,0.07)           — card
  --shadow-lg:   0 10px 15px rgba(0,0,0,0.10)         — dropdown, modal
  --shadow-glow: 0 0 0 3px var(--inst-primary-light)  — focus ring

MOBILE ELEVATION (React Native shadow)
  level-1: shadowOffset {0,1}, shadowOpacity 0.05, elevation 1
  level-2: shadowOffset {0,4}, shadowOpacity 0.08, elevation 4
  level-3: shadowOffset {0,8}, shadowOpacity 0.12, elevation 8
```

---

### 1.4 Motion Design

```
PRINCIPLES
  — Motion communicates state, not decoration
  — Duration: fast interactions 150ms, standard 250ms, revealing 350ms
  — Easing: ease-out for elements entering, ease-in for leaving
  — Reduced motion: all animations respect prefers-reduced-motion

WEB ANIMATIONS (Framer Motion)
  Page transition:     fade + 8px Y slide, 250ms ease-out
  Card appear:         opacity 0→1 + 4px Y, 200ms, staggered 40ms between siblings
  KPI counter:         number rolls up from previous value, 600ms, easing cubic
  Progress ring:       strokeDashoffset animates over 800ms on mount
  Sidebar collapse:    width 240px→64px, 200ms ease-in-out
  Toast notification:  slides from right, 250ms, auto-dismiss 4s
  Tab switch:          content fades 150ms, no slide (prevents motion sickness)
  Data table row:      hover lifts with shadow-sm + background transition 100ms
  Dropdown:            scale 0.96→1 + opacity, 150ms
  Modal:               overlay fades, sheet scales 0.94→1, 200ms

MOBILE ANIMATIONS (React Native Reanimated 3)
  Screen transition:   native iOS/Android stack animations (kept default)
  Tab switch:          instant (standard mobile convention)
  Progress ring:       Animated.spring on mount, fills in 1s
  Card press:          scale 1→0.97, 80ms, spring back
  Swipe actions:       standard RN gesture handler
  Skeleton loader:     shimmer animation left-to-right, 1.5s loop
  Achievement unlock:  confetti burst (Lottie), badge scales 0→1.2→1
  Streak milestone:    flame icon pulses 3x, amber glow
```

---

### 1.5 Core Component Library

Shared library at `packages/ui/` (monorepo package). Used by both web and mobile where possible (logic), with separate renderers.

```
PRIMITIVE COMPONENTS
  Button          → variant: primary | secondary | ghost | danger | link
                    size: sm | md | lg | icon
  Input           → type: text | tel | otp | search | number
                    states: default | focus | error | disabled | loading
  Badge           → variant: default | success | warning | danger | info | premium
  Avatar          → with initials fallback, progress ring overlay
  Skeleton        → shimmer loading state for any component
  Toast           → position: top-right (web), top (mobile)
  Modal           → web: centered dialog, mobile: bottom sheet
  Dropdown        → web: popover menu, mobile: ActionSheet

DATA DISPLAY COMPONENTS
  ProgressRing    → THE signature component, SVG circle, animated, sized xs→2xl
  StatCard        → KPI card: number + label + trend + optional sparkline
  DataTable       → sortable, filterable, paginated, selectable rows
  InlineChart     → sparkline (7/30 day trend mini chart)
  AttendanceGrid  → calendar heatmap (month view, color intensity by %)
  ScoreBar        → horizontal bar, label + value, colored by threshold
  TimelineItem    → vertical timeline entry with icon, timestamp, content
  LeaderboardRow  → rank number + avatar + name + score + delta
  CourseCard      → thumbnail + title + progress ring + teacher + chapter count
  VideoCard       → thumbnail with play overlay + duration + watched indicator
  FeeRow          → student name + amount + due date + status badge + action

FORM COMPONENTS
  OTPInput        → 6-box OTP entry, auto-focus, auto-submit
  PhoneInput      → +91 prefix + 10 digit, auto-format
  DatePicker      → calendar popover (web), DateTimePicker (mobile)
  FileUpload      → drag-drop (web), document picker (mobile), progress bar
  RichTextEditor  → web only, for announcements (Tiptap)
  QuestionBuilder → MCQ / Integer / Multi-correct editor (test module)
  ColorPicker     → for institute branding settings

LAYOUT COMPONENTS
  WebShell        → sidebar + topbar + content area
  MobileShell     → bottom tab bar + stack navigator
  SectionHeader   → title + subtitle + action button slot
  EmptyState      → illustration + headline + CTA (not generic, per context)
  ErrorBoundary   → graceful error display with retry
  PageLoader      → skeleton layout matching destination page
```

---

## Part 2: Super Admin SaaS Panel

**URL:** `superadmin.yourplatform.com`
**Auth:** Separate JWT, Google OAuth for internal team (no OTP)
**Theme:** Dark fixed (no light mode toggle — internal tool)

### 2.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│  ■ CoachingOS  [superadmin]          ● 3 alerts   [RM ▾]      │  ← 56px topbar
├──────────────┬─────────────────────────────────────────────────┤
│              │                                                  │
│  Dashboard   │          MAIN CONTENT AREA                       │
│  Institutes  │          1200px max-width, centered              │
│  Analytics   │                                                  │
│  Outbox      │                                                  │
│  System      │                                                  │
│  Settings    │                                                  │
│              │                                                  │
│  ─────────   │                                                  │
│  Docs ↗      │                                                  │
│  Logout      │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
   220px fixed                fill remaining
```

Sidebar: fixed, no collapse on desktop (content is always visible to internal staff). On mobile: drawer.
Topbar: Platform name + environment badge (staging/prod) + alert bell + user menu.

---

### 2.2 Super Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Platform Overview                          ↻ Live  Jun 19, 2026 │
├────────────┬───────────────┬──────────────┬────────────────────┤
│ ◉ 147      │  ◉ 84,203    │ ◉ ₹42.8L     │ ◉ 3               │
│ Institutes │  Students     │ Platform MRR │ Services Down      │
│ ▲ 12 month│  ▲ 6.2% WoW  │ ▲ ₹3.2L MoM │ ● moodle-worker   │
└────────────┴───────────────┴──────────────┴────────────────────┘

┌─────────────────────────────────┐ ┌────────────────────────────┐
│ MRR Growth (12 months)          │ │ Plan Distribution          │
│                                 │ │                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ +8.1%   │ │  ● Professional  48  33%   │
│                                 │ │  ● Growth        61  41%   │
│  [recharts AreaChart]           │ │  ● Starter       38  26%   │
└─────────────────────────────────┘ └────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Recently Active Institutes                          View all →  │
├──────────────┬───────────┬────────────┬──────────┬─────────────┤
│ Institute    │ Plan      │ Students   │ Last Act │ MRR         │
├──────────────┼───────────┼────────────┼──────────┼─────────────┤
│ Raju Classes │ Growth    │ 847        │ 2m ago   │ ₹12,999     │
│ Allen Pvt    │ Pro       │ 2,341      │ 5m ago   │ ₹29,999     │
│ SR Academy   │ Starter   │ 124        │ 1h ago   │ ₹4,999      │
└──────────────┴───────────┴────────────┴──────────┴─────────────┘

┌─────────────────────────────┐ ┌────────────────────────────────┐
│ Event Outbox Health         │ │ System Services                │
│                             │ │                                │
│ ✓ Published  1,247          │ │ ✓ gateway          99.98%      │
│ ⏳ Pending      3           │ │ ✓ erpnext          99.91%      │
│ ✗ Dead          1           │ │ ✓ moodle           99.87%      │
│ [View dead events]          │ │ ✗ moodle-worker    DEGRADED    │
└─────────────────────────────┘ └────────────────────────────────┘
```

**APIs used:**
- `GET /superadmin/analytics/platform` → KPI cards
- `GET /superadmin/institutes?limit=5&sort=last_active` → recent institutes table
- `GET /superadmin/outbox/stats` → outbox health
- `GET /superadmin/analytics/health` → service status

---

### 2.3 Institutes Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Institutes                                    [+ New Institute] │
├──────────────────────────────────┬──────────────────────────────┤
│ [Search institutes...]           │ Plan ▾  Status ▾  Sort ▾    │
└──────────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ☐ │ Institute        │ Slug            │ Plan   │ Students │ MRR │ Status  │ Actions │
├───┼──────────────────┼─────────────────┼────────┼──────────┼─────┼─────────┼─────────┤
│ ☐ │ ● Raju Classes   │ raju-coaching   │ Growth │ 847      │ ₹13k│ Active  │ ⋮       │
│ ☐ │ ● Allen Private  │ allen-private   │ Pro    │ 2,341    │ ₹30k│ Active  │ ⋮       │
│ ☐ │ ○ Sunrise Acad.  │ sunrise-acad    │ Starter│ 124      │ ₹5k │ Trial   │ ⋮       │
│ ☐ │ ✕ Matrix Classes │ matrix-classes  │ Growth │ 0        │ -   │Suspended│ ⋮       │
└───┴──────────────────┴─────────────────┴────────┴──────────┴─────┴─────────┴─────────┘
```

**Institute Detail Drawer (slides in from right, 480px):**
```
Raju Coaching Classes          [Suspend] [Edit Plan]
slug: raju-coaching
Plan: Growth  →  [Upgrade to Pro]
Created: Jan 15, 2024

Provisioning Status:
  ✓ PostgreSQL record
  ✓ ERPNext Company "Raju Coaching Classes"
  ✓ Moodle Category (ID: 42)
  ✓ Novu Channel configured

Stats (live):
  Students: 847 active, 23 inactive
  Teachers: 12
  Batches: 18 active
  Storage: 47.3 GB / 100 GB
  API calls (today): 12,847

Feature Flags:
  ✓ Live Classes (BBB)
  ✓ RFID Attendance
  ✓ Parent App
  ✗ AI Doubt Solver  [Enable]
  ✗ Advanced Analytics  [Upgrade plan]

Branding:
  Primary: ██ #C62828  (deep red)
  Logo: [preview] raju-coaching/logo.png

Contact: admin@rajuclasses.com | +91 98765 43210
```

---

### 2.4 Dead Letter Events (Outbox Monitor)

```
┌─────────────────────────────────────────────────────────────────┐
│ Event Outbox — Dead Letter Queue               1 event needs fix │
├──────────────────────────────────────────────────────────────────┤
│ event_id: 3e7f2a...  │ Type: student.created                    │
│ Institute: Raju Classes │ Created: 2h 14m ago                   │
│ Attempts: 5/5  Last error: "Moodle: Connection refused"         │
│ Payload: { erpStudentName: "EDU-STU-2024-00847", ... }          │
│                                                                  │
│ [🔁 Retry Now]  [👁 View Full Payload]  [⊘ Mark Resolved]      │
└──────────────────────────────────────────────────────────────────┘
```

This screen is the operational lifeline. When Moodle was down, this shows exactly which student operations failed and allows manual retry with one click.

---

## Part 3: Institute Admin Panel

**URL:** `{slug}.yourplatform.com` or custom domain
**Theme:** Light default, honors institute branding (primary color applied to sidebar, progress rings, buttons)
**Responsive:** Desktop-first, works on tablet, minimal mobile (for quick checks)

### 3.1 Shell Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [◉ LOGO]  Raju Coaching Classes      🔔 4    [Admin Name ▾]     │  ← 64px topbar
│                                                                   │   institute branded
├──────────────────┬────────────────────────────────────────────────┤
│                  │                                                │
│ ⊞ Dashboard      │                                                │
│                  │                                                │
│ ACADEMICS        │   MAIN CONTENT (fluid, max 1440px)             │
│ 👤 Students      │                                                │
│ 🎓 Batches       │                                                │
│ 📚 Courses       │                                                │
│ ✏  Tests         │                                                │
│ 🎥 Live Classes  │                                                │
│                  │                                                │
│ OPERATIONS       │                                                │
│ ✓  Attendance    │                                                │
│ ₹  Fees          │                                                │
│ 📢 Communications│                                                │
│                  │                                                │
│ PEOPLE           │                                                │
│ 👨‍🏫 Teachers      │                                                │
│ 👪 Parents       │                                                │
│                  │                                                │
│ INTELLIGENCE     │                                                │
│ 📊 Analytics     │                                                │
│                  │                                                │
│ ADMIN            │                                                │
│ ⚙  Settings      │                                                │
│ 📥 Admissions    │                                                │
│                  │                                                │
└──────────────────┴────────────────────────────────────────────────┘
 240px, collapses to    fill
 icons at 64px
```

**Sidebar behavior:** Stays expanded on desktop (≥1280px). Collapses to icon-only at 1024px. Becomes a hamburger drawer on mobile. The active section item has a left border in the institute's primary color.

**Topbar:** Institute logo (from `institute.branding.logo_url`) + name + notification bell with unread count + admin user menu (profile, switch institutes if multi-branch, logout).

---

### 3.2 Institute Dashboard

The homepage. Every metric visible within 3 seconds of opening. Zero clicks needed for daily operations.

```
┌─────────────────────────────────────────────────────────────────┐
│ Good morning, Rajesh   Thursday, 19 June 2026      ↻ Live      │
└─────────────────────────────────────────────────────────────────┘

TODAY AT A GLANCE
┌────────────────┬────────────────┬────────────────┬─────────────┐
│  🟢 247 / 312  │  ₹ 84,000     │  2 Live Now    │  3 Tests    │
│  Present Today │  Collected     │  47 Students   │  Running    │
│  ████████░ 79% │  Today        │  in class      │  Today      │
│  [View Details]│  [View Ledger] │  [Join Class]  │ [View Tests]│
└────────────────┴────────────────┴────────────────┴─────────────┘

┌────────────────────────────┐ ┌───────────────────────────────────┐
│ RFID LIVE FEED             │ │ FEE ALERTS                        │
│ Real-time attendance punches│ │                                   │
│ ─────────────────────────  │ │ ⚠  23 students — fee overdue >15d │
│ 09:47  📍 Rahul Sharma     │ │ ⚠  41 students — due this week    │
│        JEE 2026 A  ✓ Entry │ │                                   │
│ 09:46  📍 Priya Patel      │ │ [Send WhatsApp to all overdue]    │
│        NEET 2026 B ✓ Entry │ │                                   │
│ 09:44  📍 Amit Gupta       │ │ UPCOMING TESTS                    │
│        Class 11 Sci ✓ Entry│ │ Physics Mock 4 — Jun 20, 10:00AM │
│ [See all 247 entries]      │ │ Chemistry Final — Jun 22, 9:00AM  │
└────────────────────────────┘ └───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BATCH PERFORMANCE THIS WEEK                        All Batches →│
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Batch        │ Attendance%  │ Avg Score    │ Fee Collection%    │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ JEE 2026 A   │ ████████ 87% │  ██████ 72%  │  ████████████ 94% │
│ NEET 2026 B  │ ██████░░ 74% │  █████░░ 61% │  █████████░░  82% │
│ Class 12 Sci │ ████████ 91% │  ███████ 78% │  ██████████░  89% │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

**APIs used by dashboard:**
```
GET /api/v1/admin/dashboard/kpis          → today's numbers
GET /api/v1/attendance/live               → WebSocket: RFID live feed
GET /api/v1/fees/alerts                   → overdue counts
GET /api/v1/batches/performance/weekly    → batch performance table
GET /api/v1/live-class/active             → active classes count
GET /api/v1/tests/today                   → running tests
```

---

### 3.3 Student Management

**List View:**
```
Students                                      [+ Add Student]  [↑ Import CSV]
─────────────────────────────────────────────────────────────────────────────
[🔍 Search name, phone, ID...]  Batch ▾  Status ▾  Fee Status ▾  Sort ▾

┌──────┬──────────────────────┬──────────┬───────────┬──────────┬───────────┐
│  ◉   │ Student              │ Batch    │ Attend%   │ Fee Dues │ Status    │
├──────┼──────────────────────┼──────────┼───────────┼──────────┼───────────┤
│  ⊙78%│ Rahul Sharma         │ JEE 26 A │ ████░ 78% │ ₹12,000  │ ● Active  │
│      │ +91 98765 00001      │          │           │ Overdue  │           │
├──────┼──────────────────────┼──────────┼───────────┼──────────┼───────────┤
│  ⊙91%│ Priya Patel          │ NEET 26  │ █████ 91% │ ✓ Clear  │ ● Active  │
│      │ +91 98765 00002      │          │           │          │           │
└──────┴──────────────────────┴──────────┴───────────┴──────────┴───────────┘
```

The `⊙78%` icon in the first column is a miniature ProgressRing showing attendance percentage. Scannable at a glance.

**Student Profile (right drawer, 560px, or full page on tablet):**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Students                    [Edit]  [⋮ More actions] │
├─────────────────────────────────────────────────────────────────┤
│  [Photo]  Rahul Sharma                                          │
│           JEE 2026 A  |  EDU-STU-2024-00847                    │
│           +91 98765 00001  |  rahul@gmail.com                   │
│           Parent: Suresh Sharma  +91 87654 32109                │
│  RFID Card: ██████ 4A2F (Active)                                │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│ │  ⊙           │ │  78/100      │ │  Rank 23 / 84            │ │
│ │  78%         │ │  Avg Score   │ │  in JEE 2026 A           │ │
│ │  Attendance  │ │  Last 5 Tests│ │  ↑ 4 from last test      │ │
│ └──────────────┘ └──────────────┘ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ TABS:  [Overview]  [Attendance]  [Tests]  [Fees]  [Activity]   │
│                                                                 │
│ OVERVIEW:                                                       │
│  Fee Outstanding:  ₹12,000  [Send reminder]  [Record payment]  │
│  Last Attended:    Today, 09:47 AM                              │
│  Last Test:        Physics Mock 3 — 78/100 — Rank 18           │
│  Videos Watched:   34 / 67 in current course                   │
│  Dropout Risk:     🟡 Medium — attendance dropped 12% this week │
│                    [Take action]                                │
├─────────────────────────────────────────────────────────────────┤
│ Quick Actions:                                                  │
│ [📱 WhatsApp Parent] [₹ Record Payment] [📋 Print ID Card]    │
└─────────────────────────────────────────────────────────────────┘
```

**APIs:** `GET /api/v1/students/:id/complete-profile`, `GET /api/v1/analytics/students/:id/risk-score`, `POST /api/v1/notifications/individual`

---

### 3.4 Attendance Management

**Daily Attendance Board (real-time):**

```
Attendance — Today: Thursday, 19 Jun 2026
─────────────────────────────────────────────────────────────────
Batch: [JEE 2026 A ▾]   Session: [Morning ▾]

  Present  ████████████████░░░░  79 / 100 (79%)
  Absent                         21 students
  Not Marked                      0

  [📤 Export] [📢 Notify Absent Parents] [✎ Manual Override]

ABSENT TODAY (21):
┌──────────────────────────┬──────────────────────────────────────┐
│ Ankit Verma              │ Parent notified 09:30 ✓              │
│ Sonal Desai              │ [📱 Notify Parent]                   │
│ Ravi Tiwari              │ Notified 09:30 ✓                     │
│ ...                      │                                      │
└──────────────────────────┴──────────────────────────────────────┘

RFID ACTIVITY TODAY (Live — updates every 5s):
  09:47  Rahul Sharma     JEE 2026 A   → ENTRY
  09:46  Priya Patel      JEE 2026 A   → ENTRY
  09:02  Vikas Yadav      Class 12 Sci → ENTRY
  08:58  Sneha Agarwal    NEET 2026 B  → ENTRY
```

**Monthly Report View:**

Calendar heatmap using the AttendanceGrid component. Each day cell is colored from white → institute primary color based on attendance percentage. Hover shows exact count.

**APIs:** `GET /api/v1/attendance/batch/:name/today`, `POST /api/v1/attendance/manual`, `GET /api/v1/attendance/batch/:name/monthly`, `WebSocket /api/v1/attendance/live`

---

### 3.5 Fee Management

```
Fee Management
─────────────────────────────────────────────────────────────────
┌──────────┬──────────────┬──────────────┬────────────────────────┐
│ ₹3.2L    │ ₹84K         │ ₹47K         │ 23 Students            │
│ Monthly  │ Today        │ Outstanding  │ Overdue > 15 days      │
│ Target   │ Collected    │ This Week    │                        │
└──────────┴──────────────┴──────────────┴────────────────────────┘

TABS: [All Students] [Due This Week] [Overdue] [Paid This Month] [Receipts]

OVERDUE TAB:
┌──────────────────┬────────────┬──────────┬────────────┬──────────────┐
│ Student          │ Batch      │ Amount   │ Due Since  │ Action       │
├──────────────────┼────────────┼──────────┼────────────┼──────────────┤
│ Ankit Verma      │ JEE 2026 A │ ₹15,000  │ 23 days    │ [💬 WhatsApp]│
│ Sonal Desai      │ NEET 2026  │ ₹12,500  │ 31 days    │ [💬 WhatsApp]│
└──────────────────┴────────────┴──────────┴────────────┴──────────────┘

[Send WhatsApp reminder to ALL overdue →]   This sends via Novu in batch

COLLECT PAYMENT MODAL (opened from any row):
  Student: Ankit Verma
  Outstanding: ₹15,000
  ───────────────────────
  Payment Mode: [Cash ▾] / [UPI] / [Cheque] / [Send Payment Link]
  Amount:  [_15000___]
  Ref No.: [_________]  (auto from Razorpay if online)
  [Record Payment]  →  generates PDF receipt, records in ERPNext, notifies parent
```

**APIs:** `GET /api/v1/fees/collection/overdue`, `POST /api/v1/fees/cash-payment`, `POST /api/v1/fees/student/:id/payment/initiate`, `POST /api/v1/fees/reminder/bulk`, `GET /api/v1/fees/student/:id/receipt/:paymentId`

---

### 3.6 Test Creation Wizard

4-step wizard. Each step is a full panel, not a modal.

```
Create Test         Step 1 of 4: Details
─────────────────────────────────────────
Test Name:    [Physics Mock Test 4_____________]
Subject:      [Physics ▾]
Batch:        [JEE 2026 A ▾]  [JEE 2026 B ▾]  + Add batch
Date & Time:  [20 Jun 2026 ▾]  [10:00 AM ▾]
Duration:     [180 minutes___]
Marking:      +[4] for correct,  -[1] for wrong,  [0] for skipped
Instructions: [Rich text editor for exam instructions]

                                               [Next: Add Questions →]
─────────────────────────────────────────
Step 2 of 4: Questions
─────────────────────────────────────────
[+ Add Question]  [📎 Import from Question Bank]  [⬆ Bulk Upload CSV]

┌─────────────────────────────────────────────────────────────────┐
│ Q1  [MCQ ▾]  Topic: [Kinematics ▾]  Difficulty: [Medium ▾]    │
│                                                                 │
│ Question: [A ball is thrown at 30° to horizontal with...]      │
│ [+ Add image]                                                   │
│                                                                 │
│  ⊙ A.  [15 m/s_________________________]                       │
│  ○ B.  [20 m/s_________________________]                       │
│  ○ C.  [10 m/s_________________________]         ← mark correct│
│  ○ D.  [25 m/s_________________________]                       │
│                                                                 │
│ Explanation: [optional explanation for result screen]          │
│                                              [+ Add Q2]        │
└─────────────────────────────────────────────────────────────────┘
─────────────────────────────────────────
Step 3 of 4: Preview
─────────────────────────────────────────
[Student's view of the test — rendered exactly as they will see it]
[Every question scrollable, correct answers highlighted for admin]

[← Back] [Next: Schedule & Notify →]
─────────────────────────────────────────
Step 4 of 4: Schedule & Notify
─────────────────────────────────────────
Summary:
  75 Questions  |  180 mins  |  2 Batches  |  156 students

Notification:
  ✓ WhatsApp to all students 1 hour before test
  ✓ Push notification on test start
  ✓ WhatsApp to parents when result published

[Save as Draft]  [Schedule & Notify Students →]
```

---

### 3.7 Analytics Dashboard

```
Analytics                         [Export Report ▾]  [Date Range: Last 30d ▾]
─────────────────────────────────────────────────────────────────

TABS: [Overview] [Attendance] [Tests] [Fees] [Engagement] [Admissions]

OVERVIEW TAB:
┌────────────────────────────────┐ ┌────────────────────────────────┐
│ Attendance Trend (30 days)     │ │ Test Performance               │
│                                │ │                                │
│  100%│    ╭──╮     ╭─         │ │  Physics     ████████ 79/100   │
│   80%│╭──╯  ╰────╯            │ │  Chemistry   ██████░░ 68/100   │
│   60%│                        │ │  Maths       ███████░ 74/100   │
│      └───────────────────────  │ │  Biology     █████░░░ 62/100   │
│      [Recharts: AreaChart]     │ │  [Recharts: BarChart]          │
└────────────────────────────────┘ └────────────────────────────────┘

┌────────────────────────────────┐ ┌────────────────────────────────┐
│ Fee Collection vs Target       │ │ Student Risk Overview          │
│                                │ │                                │
│  Target:    ₹3,20,000         │ │  🟢 Low risk:    234 students  │
│  Collected: ₹2,68,000 (83%)   │ │  🟡 Medium risk:  56 students  │
│  Overdue:   ₹47,000           │ │  🔴 High risk:    22 students  │
│  [Recharts: PieChart]          │ │  [Take action on high risk]    │
└────────────────────────────────┘ └────────────────────────────────┘

EMBEDDED METABASE SECTION (invisible iframe, styled to match):
  [Advanced: Admission Funnel] [Revenue vs Target]  [Year-over-Year]
  → Each opens a Metabase signed URL in a custom-styled iframe
  → Border and background match the admin panel exactly
  → Metabase chrome is hidden via #bordered=false&titled=false
```

---

### 3.8 Settings Panel

```
Settings
─────────────────────────────────────────
TABS: [Branding] [Staff Accounts] [RFID Devices] [Notifications] [Integrations] [Billing]

BRANDING TAB:
  Institute Name:  [Raju Coaching Classes__________]
  Logo:            [Upload .png or .svg, max 2MB]  [preview]
  App Name:        [Raju Academy___________________]
                   (shown on student mobile app)
  Primary Color:   [███ #C62828]  [Color picker]
  Secondary Color: [███ #1A237E]  [Color picker]
  Preview:         [Shows how the app looks with these colors]
  [Save Branding]  → updates branding JSONB in PostgreSQL institutes table
                   → mobile app fetches this on next launch

RFID DEVICES TAB:
  Device 1:  Reader-001  |  Entry Gate     |  IP: 192.168.1.10  | ✓ Online
  Device 2:  Reader-002  |  Class 101 Door |  IP: 192.168.1.11  | ● Offline
  [+ Add Device]  [Test Connection]

STAFF ACCOUNTS TAB:
  Current Staff:
  Priyanka (Admin)   admin@rajuclasses.com   ● Active   [Manage]
  Vikram (Teacher)   vikram@rajuclasses.com  ● Active   [Manage]
  [+ Add Staff Member]

  Roles:
  Admin: Full access to all modules
  Teacher: Attendance + Courses + Tests + Live Class only
  Accountant: Fees module only
```

---

## Part 4: Mobile App — Architecture

### 4.1 App Flow

```
APP LAUNCH
    │
    ├─ First time? → Institute Discovery Screen
    │                 (enter slug OR scan QR code)
    │                 → Institute branding loaded
    │                 → Institute-colored login screen
    │
    └─ Returning?  → Check JWT validity
                     ├─ Valid  → Direct to role home
                     └─ Expired → OTP Login Screen

OTP LOGIN SCREEN
    │
    [Enter phone number]
    [Send OTP]
    [Enter 6-digit OTP]
    [Verify]
    │
    ├─ role: 'student'    → StudentNavigator
    ├─ role: 'instructor' → TeacherNavigator
    └─ role: 'parent'     → ParentNavigator
```

### 4.2 Navigation Architecture

```typescript
// apps/mobile/src/navigation/index.tsx

function RootNavigator() {
  const { user } = useAuthStore();

  if (!user) return <AuthStack />;

  // Role-based navigation — same component tree, different screens
  const navigators = {
    student:    <StudentTabs />,
    instructor: <TeacherTabs />,
    parent:     <ParentTabs />,
  };

  return navigators[user.role] ?? <AuthStack />;
}

// StudentTabs: 5 bottom tabs
// TeacherTabs: 4 bottom tabs
// ParentTabs:  4 bottom tabs
// All share: AuthStack, NotificationScreen, ProfileScreen, SettingsScreen
```

### 4.3 Institute Discovery & Onboarding

```
SCREEN: Institute Discovery
────────────────────────────────
[CoachingOS logo centered]

"Enter your institute code
 or scan QR code"

  [___________________]  type slug
  or
  [📷 Scan Institute QR]

  [Continue →]

────────────────────────────────
(After valid slug entered:)

  [INSTITUTE LOGO]
  Raju Coaching Classes

  "Welcome to Raju Academy"

  [Continue with Phone →]

────────────────────────────────
SCREEN: OTP Login (institute-branded)
Background: institute primary color subtle gradient

  [LOGO]  Raju Academy

  [+91  |  Enter phone number]
  [Send OTP]

  ──── OTP Sent to +91 98765 00001 ────
  [_] [_] [_] [_] [_] [_]   ← 6 boxes, auto-focus
  Resend in 45s
  [Verify & Login]
```

---

## Part 5: Student App

**Design north star:** Students should feel progress, not just consume content. Every screen reinforces where they stand and what to do next.

### 5.1 Student Bottom Navigation

```
 ┌──────────────────────────────────────────────┐
 │                                              │
 │              CONTENT AREA                   │
 │                                              │
 └──────────────────────────────────────────────┘
 ┌──────┬──────────┬──────────┬──────────┬──────┐
 │  ⊞   │   📚    │   ✏     │   🎥    │   👤  │
 │ Home │ Courses  │  Tests   │  Live   │  Me   │
 └──────┴──────────┴──────────┴──────────┴──────┘
```

### 5.2 Student Home Screen

```
SCREEN: Student Home
────────────────────────────────────────────
[Status bar]
  Good morning, Rahul 👋          [🔔 3]

  ┌─────────────────────────────────────────┐
  │  🔥 23 day streak            Rank: #23  │
  │  Keep studying to maintain it!          │
  │  ████████████████████░░░░ 85% this week │
  └─────────────────────────────────────────┘

  NEXT CLASS
  ┌─────────────────────────────────────────┐
  │ ⏱ Physics — Optics              in 43m  │
  │ Mr. Arvind Kumar  |  Online (BBB)        │
  │ [Join Class →]                          │
  └─────────────────────────────────────────┘

  TODAY'S SCHEDULE
  ┌─────────────────────────────────────────┐
  │ ✓  09:00  Chemistry Doubt Session       │
  │ →  10:30  Physics — Optics (current)    │
  │    12:00  Mathematics — Limits          │
  └─────────────────────────────────────────┘

  YOUR PROGRESS RINGS
  ┌───────────┬──────────────┬──────────────┐
  │    ⊙      │      ⊙       │      ⊙       │
  │   78%     │     34/67    │    Rank 23   │
  │ Attendance│   Videos     │  This Month  │
  └───────────┴──────────────┴──────────────┘

  CONTINUE LEARNING
  [Course Card: Physics Ch.8 — Optics       ]
  [  ████████░░░░░ 60% complete  Resume →   ]

  PENDING
  ┌─────────────────────────────────────────┐
  │ 📝 Mock Test 4 — Tomorrow 10:00 AM      │
  │ 💸 Fee Due — ₹12,000 — Jun 25           │
  └─────────────────────────────────────────┘
```

The ProgressRing components here are the signature element: three rings showing attendance, content completion, and rank. These are the first visual elements students see.

**APIs:** `GET /api/v1/mobile/student/home`

---

### 5.3 Student Courses Screen

```
SCREEN: Courses
────────────────────────────────────────────
  [🔍 Search courses...]

  MY BATCH: JEE 2026 A
  ┌────────────────────────────────────────┐
  │ [⊙ 60%]  Physics — XI & XII           │
  │           Ch 8/14  •  34/67 videos     │
  │           Mr. Arvind Kumar             │
  │           [Continue →]                 │
  ├────────────────────────────────────────┤
  │ [⊙ 42%]  Chemistry — XI & XII         │
  │           Ch 5/12  •  21/50 videos     │
  │           Ms. Sunita Patel             │
  │           [Continue →]                 │
  ├────────────────────────────────────────┤
  │ [⊙ 78%]  Mathematics — XI & XII       │
  │           Ch 11/14  •  52/67 videos    │
  │           Mr. Rajesh Agarwal           │
  │           [Continue →]                 │
  └────────────────────────────────────────┘

SCREEN: Course Detail (Physics)
────────────────────────────────────────────
← Physics — XI & XII        [⊙ 60%]

  Chapter 1: Units & Measurements  ✓ Done
  Chapter 2: Kinematics            ✓ Done
  Chapter 3: Laws of Motion        ✓ Done
  Chapter 4: Work, Energy & Power  ✓ Done
  ─────────────────────────────────────────
  Chapter 8: Optics            ← current
    ╠═ Lecture 8.1: Reflection  ✓ Watched
    ╠═ Lecture 8.2: Refraction  → Watch now
    ╠═ Notes PDF                ↓ Download
    ╚═ Practice Set             📝 Attempt
  ─────────────────────────────────────────
  Chapter 9: Modern Physics        ○ Locked
  Chapter 14: Semiconductors       ○ Locked
```

---

### 5.4 Video Player Screen

```
SCREEN: Video Player (fullscreen landscape)
────────────────────────────────────────────
[HLS video fills screen — react-native-video]

  [← ]              [⚙ Quality]
  Physics 8.2 — Refraction of Light

  ─────────── 14:32 / 47:10 ─────────────
  [Scrub bar: ▶▶▶▶▶▶▶▶░░░░░░░░░░░░░░░░]
  [⏮ 10s] [⏯ Play] [⏭ 10s]    [↔ PiP]

  [Notes 📄]  [Doubts 💬]  [Speed 1.0x ▾]

Portrait mode: video top 40%, chapters list below
  Landscape: fullscreen video only
```

---

### 5.5 Test Taking Screen

```
SCREEN: Test — Physics Mock 4
────────────────────────────────────────────
  Physics Mock 4          ⏱ 2:34:18 remaining

  Q 14 / 75              [Overview Grid]

  ┌──────────────────────────────────────┐
  │ A ball is projected with velocity    │
  │ u = 20 m/s at an angle 30° to the   │
  │ horizontal. What is the range?       │
  │                                      │
  │ [Image if attached]                  │
  └──────────────────────────────────────┘

  ○  A.  20√3 m
  ⊙  B.  40√3 m        ← selected
  ○  C.  20 m
  ○  D.  40 m

  +4   -1   Marks

  [← Previous]  [Mark for Review ⚑]  [Next →]

  ─────────── Bottom action bar ─────────
  [Save & Next]              [Submit Test]

QUESTION OVERVIEW MODAL (from grid button):
  Shows 75 small squares, colored:
  Green = answered, Red = marked for review, Grey = not visited
  Tap any square → jump to question
```

**Timer expires → auto-submit with animation + results screen**

---

### 5.6 Student Results & Leaderboard

```
SCREEN: Test Results — Physics Mock 4
────────────────────────────────────────────

  ┌────────────────────────────────────────┐
  │         Physics Mock 4 Results         │
  │                                        │
  │           ⊙ 268/300                   │
  │                                        │
  │  Rank 18 / 87    ↑ 5 from last test   │
  │  Percentile: 79.3%                     │
  │                                        │
  │  Correct: 68    Wrong: 7    Skip: 0    │
  └────────────────────────────────────────┘

  SUBJECT ANALYSIS
  Physics   ████████░░ 82/100
  Chemistry █████░░░░░ 54/100
  Maths     ████████░░ 78/100

  LEADERBOARD (your batch)
  🥇 Priya Patel      298  (99.2%)
  🥈 Amit Gupta       284  (94.7%)
  🥉 Sneha Sharma     279  (93.0%)
  ─────────────────────────────────
  18. Rahul Sharma    268  (89.3%) ← you
  ─────────────────────────────────

  [📄 View Answer Key]  [📊 Detailed Analysis]
```

---

### 5.7 Fees Screen (Student)

```
SCREEN: My Fees
────────────────────────────────────────────
  FEE SUMMARY
  ┌────────────────────────────────────────┐
  │  Total Course Fee:     ₹48,000         │
  │  Paid:          ████████░░  ₹36,000   │
  │  Outstanding:              ₹12,000     │
  │  Due Date:                Jun 25, 2026 │
  │                                        │
  │  [Pay ₹12,000 Online →]               │
  └────────────────────────────────────────┘

  PAYMENT HISTORY
  ┌───────────────────────────────────────────┐
  │ ✓ Apr 10  ₹12,000  UPI    RZP-ABC123 [📄]│
  │ ✓ Mar 05  ₹12,000  Cash   CASH-001   [📄]│
  │ ✓ Feb 01  ₹12,000  UPI    RZP-XYZ456 [📄]│
  └───────────────────────────────────────────┘
  [📄] → opens receipt PDF

PAYMENT FLOW (after tapping "Pay Online"):
  → Razorpay SDK opens (native sheet on iOS/Android)
  → Student pays via UPI/card/netbanking
  → Success screen: receipt + notification to parent
```

---

### 5.8 Me / Profile Screen

```
SCREEN: Profile
────────────────────────────────────────────

  [Photo]  Rahul Sharma
           JEE 2026 A   |   Raju Academy
           +91 98765 00001

  ┌──────────────┬──────────────┬──────────┐
  │ 🔥 23 days  │ ⊙ 78%       │ Rank #23 │
  │    Streak   │  Attendance  │ JEE 2026A│
  └──────────────┴──────────────┴──────────┘

  ACHIEVEMENTS
  [🏅 First Perfect Score] [🔥 30 Day Streak] [📚 100 Videos]
  [🏆 Top 10 in Class]     [⚡ Speed Demon]   [+ 3 more]

  SETTINGS
  Notifications   [Toggle: ON]
  Dark Mode       [Toggle: AUTO]
  Download Videos [Toggle: WiFi only]
  Language        [English ▾]
  [RFID Card: ██████ 4A2F]
  [Logout]
```

---

## Part 6: Teacher App

**Design north star:** Speed. Teachers are busy. Actions must be reachable in 2 taps maximum.

### 6.1 Teacher Bottom Navigation

```
 ┌──────────────────────────────────────────────┐
 │                CONTENT AREA                  │
 └──────────────────────────────────────────────┘
 ┌──────────┬──────────┬──────────┬─────────────┐
 │    ⊞    │    ✓    │    📚   │      👤      │
 │  Today   │ Attend.  │ Content  │     Me       │
 └──────────┴──────────┴──────────┴─────────────┘
```

### 6.2 Teacher Home

```
SCREEN: Teacher Home
────────────────────────────────────────────
  Hello, Mr. Arvind Kumar 👋    [🔔]

  TODAY'S CLASSES
  ┌────────────────────────────────────────┐
  │ 10:30 AM  Physics — Optics     Now    │
  │           JEE 2026 A  |  Room 201     │
  │  [✓ Mark Attendance]  [🎥 Start Online]│
  ├────────────────────────────────────────┤
  │ 02:00 PM  Physics — Waves             │
  │           JEE 2026 B  |  Room 201     │
  │  [Starts in 3h 20m]                   │
  └────────────────────────────────────────┘

  QUICK STATS
  ┌────────────────────────────────────────┐
  │ Classes Today: 2    Students: 180      │
  │ Avg Attendance (this week): 84%        │
  │ Tests to Grade: 3 submissions pending  │
  └────────────────────────────────────────┘

  PENDING TASKS
  📝 Grade Assignment: JEE 2026 A — Ch 7 HW (23 pending)
  📤 Upload: Video for Ch 9 Optics (reminder: 3 days)
```

### 6.3 Attendance Taking Screen

```
SCREEN: Take Attendance
────────────────────────────────────────────
← Physics — JEE 2026 A — Jun 19, 2026

  [Search student...]         Present: 47/84

  [Mark All Present]  [Mark All Absent]

  ┌────────────────────────────────────────┐
  │  ● Rahul Sharma           [P] [A] [L] │
  │  ● Priya Patel            [P] [A] [L] │
  │  ● Ankit Verma            [P] [A] [L] │
  │  ● Sonal Desai            [P] [A] [L] │
  │  ...84 students total                  │
  └────────────────────────────────────────┘
  [P] = Present (green tap)
  [A] = Absent (red tap)
  [L] = Late (amber tap)

  [✓ Submit Attendance →]

  After submit:
  → ERPNext Student Attendance created
  → Absent parents notified via Novu
  → ClickHouse event logged
  → Confirmation toast
```

### 6.4 Content Upload Screen

```
SCREEN: Upload Content
────────────────────────────────────────────
  Course:  [Physics — XI & XII ▾]
  Chapter: [Chapter 8: Optics ▾]
  Type:    [Video ▾] / [PDF Notes] / [Assignment]

  ┌────────────────────────────────────────┐
  │                                        │
  │  [📎 Tap to select file]              │
  │  or drag here (web version)            │
  │                                        │
  │  Supports: MP4, MOV, PDF, PPT         │
  └────────────────────────────────────────┘

  Title: [Physics 8.3 — Total Internal Reflection]

  (After upload starts:)
  Uploading... ████████░░░░░░ 67%
  Processing video... (background via BullMQ)
  "You'll get a notification when it's ready"

  [Cancel]  [Upload]
```

---

## Part 7: Parent App

**Design north star:** Transparency and reassurance. Parents should feel informed, not overwhelmed. Clean, readable, single-column, large text.

### 7.1 Parent Bottom Navigation

```
 ┌──────────────────────────────────────────────┐
 │                CONTENT AREA                  │
 └──────────────────────────────────────────────┘
 ┌──────────┬──────────┬──────────┬─────────────┐
 │    ⊞    │    ✓    │   ₹     │      💬      │
 │  Home    │ Attend.  │  Fees    │   Updates    │
 └──────────┴──────────┴──────────┴─────────────┘
```

### 7.2 Parent Home (Multi-child aware)

```
SCREEN: Parent Home
────────────────────────────────────────────

  [Switch Child: Rahul ▾ | Priya]    ← if 2 children

  RAHUL'S STATUS TODAY — Thursday, Jun 19
  ┌────────────────────────────────────────┐
  │ ✓  Present — Arrived 09:47 AM         │
  │    Raju Coaching Classes, JEE 2026 A  │
  └────────────────────────────────────────┘

  ┌────────────┬───────────────┬───────────┐
  │    ⊙       │  Rank #23     │  ₹12,000  │
  │   78%      │  in JEE 26A   │  Fee Due  │
  │ This Month │  Last Test    │  Jun 25   │
  └────────────┴───────────────┴───────────┘

  RECENT ACTIVITY
  Jun 19  Arrived 09:47 AM  ✓
  Jun 18  Absent — notified at 09:30 AM
  Jun 17  Test: Physics Mock 3 — 78/100 (Rank 18)
  Jun 16  Fee reminder sent
  Jun 15  Arrived 09:52 AM  ✓

  [See full attendance]   [See all test results]

  ANNOUNCEMENTS FROM INSTITUTE
  ┌────────────────────────────────────────┐
  │ "Annual exams schedule published"      │
  │ Jun 18, 2026  |  Raju Classes Admin    │
  └────────────────────────────────────────┘
```

### 7.3 Parent Fees Screen

```
SCREEN: Fees
────────────────────────────────────────────
  RAHUL SHARMA — FEE SUMMARY

  ┌────────────────────────────────────────┐
  │  Total:     ₹48,000                   │
  │  Paid:      ████████░░  ₹36,000  75%  │
  │  Due Now:   ₹12,000  — Jun 25, 2026   │
  │                                        │
  │  [Pay ₹12,000 Online →]               │
  └────────────────────────────────────────┘

  PAYMENT HISTORY
  Apr 10  ₹12,000  UPI (Razorpay)  [Receipt 📄]
  Mar 05  ₹12,000  Cash            [Receipt 📄]
  Feb 01  ₹12,000  UPI (Razorpay)  [Receipt 📄]
```

---

## Part 8: Student Retention Design System

These patterns are baked into the student UI at the component level. Not features added later — foundational to the app experience.

### 8.1 Streak System

```typescript
// apps/mobile/src/components/student/StreakBanner.tsx

function StreakBanner({ streak, weekProgress }: StreakProps) {
  // Shows every time student opens app
  // Disappears after 5 seconds or first scroll
  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text>🔥</Text>
      <Text>{streak} day streak</Text>
      <ProgressBar value={weekProgress} color={Colors.streak} />
    </Animated.View>
  );
}
```

Rules:
- Streak counts consecutive days with at least one learning action (video watched, test attempted, or live class attended)
- Day boundary is midnight in the institute's timezone
- Missed day: streak resets to 0, push notification fires at 8 PM: "Don't break your streak! 5 minutes is all it takes."
- Milestone streaks (7, 30, 100 days): achievement badge + confetti animation + home screen special state

### 8.2 Rank Visibility Pattern

Every test result shows rank in the batch. Not just score. Rank is prominently displayed on:
- Home screen (persistent)
- Test result screen (large, animated number)
- Profile → Me screen
- Leaderboard screen

Students who see their rank compared to peers study more to move up. The leaderboard only shows the top 10 and the student's own row — not a demoralizing full list.

### 8.3 Micro-Goals and Daily Nudges

```
Home screen card — refreshes daily:
  "Today's goal: Watch 1 video"
  [Watch Physics 8.2 →]            ← deeplink to specific video

  If completed:
  "✓ Goal complete! Watch one more?"
  [Watch Physics 8.3 →]
```

Backend generates this from the last-watched item in ClickHouse `student_engagement` view.

### 8.4 Empty States as Action Triggers

Not "No tests scheduled" — instead:

```
EMPTY TEST LIST:
  [Illustration: blank answer sheet]
  "Physics Mock 4 is on June 20th"
  "Watch today's lecture to prepare"
  [Watch Now →]

EMPTY ATTENDANCE (first day):
  [Illustration: calendar]
  "Your attendance history will appear here"
  "Your first class is at 10:30 AM today"
  [Set Reminder →]
```

---

## Part 9: Complete Screen → API Map

Every screen and the exact APIs it calls.

```
SUPER ADMIN
─────────────────────────────────────────────────────────────────
superadmin/dashboard           → GET /superadmin/analytics/platform
                                 GET /superadmin/institutes?limit=5
                                 GET /superadmin/outbox/stats
                                 GET /superadmin/analytics/health
superadmin/institutes          → GET /superadmin/institutes
superadmin/institutes/:id      → GET /superadmin/institutes/:id
superadmin/institutes/new      → POST /superadmin/institutes
superadmin/outbox              → GET /superadmin/outbox/dead
                                 POST /superadmin/outbox/:id/retry

INSTITUTE ADMIN WEB
─────────────────────────────────────────────────────────────────
/dashboard                     → GET /api/v1/admin/dashboard/kpis
                                 WS  /api/v1/attendance/live
                                 GET /api/v1/fees/alerts
                                 GET /api/v1/batches/performance/weekly
                                 GET /api/v1/live-class/active
                                 GET /api/v1/tests/today

/students                      → GET /api/v1/students (paginated, filtered)
/students/new                  → POST /api/v1/students
/students/import               → POST /api/v1/students/bulk-import
/students/:id                  → GET /api/v1/students/:id/complete-profile
                                 GET /api/v1/analytics/students/:id/risk-score
/students/:id/fees             → GET /api/v1/fees/student/:id/ledger
/students/:id/attendance       → GET /api/v1/attendance/student/:id/report
/students/:id/tests            → GET /api/v1/tests/batch/:name/history (filtered)

/batches                       → GET /api/v1/batches
/batches/new                   → POST /api/v1/batches
/batches/:name                 → GET /api/v1/batches/:name
/batches/:name/enroll          → POST /api/v1/batches/:name/students
/batches/:name/schedule        → GET /api/v1/batches/:name/schedule
                                 PUT /api/v1/batches/:name/schedule

/attendance                    → GET /api/v1/attendance/batch/:name/today
                                 WS  /api/v1/attendance/live
/attendance/manual             → POST /api/v1/attendance/manual
/attendance/reports            → GET /api/v1/attendance/batch/:name/monthly

/fees                          → GET /api/v1/fees/collection/today
                                 GET /api/v1/fees/collection/overdue
/fees/collect                  → POST /api/v1/fees/cash-payment
                                 POST /api/v1/fees/student/:id/payment/initiate
/fees/reminders                → POST /api/v1/fees/reminder/bulk
/fees/receipts/:id             → GET /api/v1/fees/student/:id/receipt/:paymentId

/courses                       → GET /api/v1/courses
/courses/new                   → POST /api/v1/courses
/courses/:name/content         → GET /api/v1/courses/:name/content
/courses/:name/upload-pdf      → POST /api/v1/courses/:name/content/pdf
/courses/:name/upload-video    → POST /api/v1/courses/:name/content/video

/tests                         → GET /api/v1/tests/batch/:name/history
/tests/create                  → POST /api/v1/tests
                                 POST /api/v1/tests/:id/questions
                                 POST /api/v1/tests/:id/publish
/tests/:id/results             → GET /api/v1/tests/:id/analytics
                                 GET /api/v1/tests/:id/leaderboard

/live-class                    → GET /api/v1/live-class/upcoming
/live-class/schedule           → POST /api/v1/live-class/schedule
/live-class/:id                → POST /api/v1/live-class/:id/join (moderator)
                                 POST /api/v1/live-class/:id/end
                                 GET  /api/v1/live-class/:id/recordings

/communications/announce       → POST /api/v1/notifications/announce/batch
                                 POST /api/v1/notifications/announce/institute
/communications/templates      → GET /api/v1/notifications/templates
                                 POST /api/v1/notifications/templates

/analytics                     → GET /api/v1/analytics/dashboard/kpis
                                 GET /api/v1/analytics/attendance/trend
                                 GET /api/v1/analytics/fees/collection-trend
                                 GET /api/v1/analytics/tests/performance
                                 GET /api/v1/analytics/embed-urls
                                 GET /api/v1/analytics/engagement/students

/teachers                      → GET /api/v1/teachers
/teachers/new                  → POST /api/v1/teachers
/teachers/:id                  → GET /api/v1/teachers/:id
/teachers/:id/schedule         → GET /api/v1/teachers/:id/schedule

/admissions                    → GET /api/v1/admissions
/admissions/new                → POST /api/v1/admissions

/settings/branding             → PUT /api/v1/tenants/:slug/branding
/settings/rfid                 → GET /api/v1/rfid/devices
                                 POST /api/v1/rfid/devices
/settings/staff                → GET /api/v1/staff
                                 POST /api/v1/staff

STUDENT MOBILE
─────────────────────────────────────────────────────────────────
Home screen                    → GET /api/v1/mobile/student/home
Courses list                   → GET /api/v1/mobile/student/courses
Course detail                  → GET /api/v1/courses/:name/content
                                 GET /api/v1/courses/:name/progress/:studentId
Video player                   → GET CDN URL from lms.getVideoStreamUrl()
PDF viewer                     → GET /api/v1/lms/pdf/:id (signed MinIO URL)
Test list                      → GET /api/v1/mobile/student/tests/active
Test start                     → POST /api/v1/tests/:id/attempt/start
Test save                      → POST /api/v1/tests/:id/attempt/save-answers
Test submit                    → POST /api/v1/tests/:id/attempt/submit
Test results                   → GET /api/v1/tests/:id/results
                                 GET /api/v1/tests/:id/leaderboard
Live class                     → POST /api/v1/live-class/:id/join
Fees summary                   → GET /api/v1/mobile/student/fees/summary
Pay online                     → POST /api/v1/mobile/parent/fees/:id/pay
Profile                        → GET /api/v1/students/:id (own profile)
FCM token register             → POST /api/v1/mobile/fcm-token

TEACHER MOBILE
─────────────────────────────────────────────────────────────────
Home                           → GET /api/v1/mobile/teacher/schedule/today
Attendance taking              → GET /api/v1/mobile/teacher/students/:batchName
                                 POST /api/v1/mobile/teacher/attendance/:batchName
Content upload                 → POST /api/v1/courses/:name/content/video
                                 POST /api/v1/courses/:name/content/pdf
Start live class               → POST /api/v1/live-class/:id/join (moderator)

PARENT MOBILE
─────────────────────────────────────────────────────────────────
Home                           → GET /api/v1/mobile/parent/children
                                 GET /api/v1/mobile/parent/child/:id/summary
Attendance                     → GET /api/v1/attendance/student/:id/report
Test results                   → GET /api/v1/tests/:id/results (child's results)
Fees                           → GET /api/v1/fees/student/:id/ledger
Pay fees                       → POST /api/v1/mobile/parent/fees/:id/pay
Notifications                  → GET /api/v1/notifications/history/:studentId
```

---

## Part 10: Tech Stack and Implementation Guide

### 10.1 Web App (Institute Admin + Super Admin)

```
Framework:     Next.js 14 (App Router, TypeScript)
Styling:       Tailwind CSS v4 + CSS Variables for tokens
Components:    shadcn/ui (base), custom components on top
Charts:        Recharts (embedded analytics charts)
Data Tables:   TanStack Table v8 (sorting, filtering, virtual rows)
Data Fetch:    TanStack Query v5 (caching, background refetch)
State:         Zustand (auth, institute config, UI state)
Forms:         React Hook Form + Zod validation
Animations:    Framer Motion 11
Rich Text:     Tiptap (announcements, instructions)
PDF Preview:   react-pdf
File Upload:   react-dropzone + upload progress via axios
WebSocket:     Socket.io client (live attendance board)
Date:          date-fns (all date formatting/calculation)
Icons:         Lucide React (consistent, tree-shakeable)
Font:          next/font → Geist + Geist Mono

FOLDER STRUCTURE (apps/web/src):
app/
  (superadmin)/
    layout.tsx              ← dark theme layout
    dashboard/page.tsx
    institutes/
      page.tsx
      [id]/page.tsx
    outbox/page.tsx
    system/page.tsx
  (institute)/
    layout.tsx              ← branded light theme layout
    dashboard/page.tsx
    students/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    batches/ ...
    attendance/ ...
    fees/ ...
    tests/ ...
    live-class/ ...
    courses/ ...
    communications/ ...
    analytics/ ...
    teachers/ ...
    settings/ ...
components/
  ui/                       ← shadcn primitives
  shared/                   ← StatCard, ProgressRing, DataTable, etc.
  attendance/               ← LiveFeed, AttendanceGrid, ManualMark
  fees/                     ← FeeTable, CollectPaymentModal, ReceiptViewer
  tests/                    ← QuestionBuilder, TestWizard, ResultCard
  analytics/                ← EmbeddedChart (Metabase iframe wrapper)
lib/
  api.ts                    ← axios instance with JWT interceptor
  socket.ts                 ← Socket.io client
  query-client.ts           ← TanStack Query setup
  auth.ts                   ← JWT decode, role check
  branding.ts               ← CSS variable injection from institute config
hooks/
  useInstitute.ts           ← institute config from JWT + API
  useRealTimeAttendance.ts  ← WebSocket hook for live feed
  useFeatureFlag.ts         ← check plan features
```

### 10.2 Mobile App

```
Framework:      Expo SDK 51 (React Native)
Styling:        NativeWind 4 (Tailwind for RN) + StyleSheet for animations
Navigation:     React Navigation 6 (Bottom tabs + Stack)
Data Fetch:     TanStack Query v5 (same cache patterns as web)
State:          Zustand (same stores reused)
Animations:     React Native Reanimated 3
Video:          react-native-video (HLS streaming)
PDF:            react-native-pdf
WebView:        react-native-webview (BBB live class)
Gestures:       React Native Gesture Handler
Push:           Expo Notifications (FCM + APNs via single API)
Camera:         expo-camera (RFID QR code scanner)
OTP Input:      react-native-otp-textinput (6-box)
Storage:        expo-secure-store (JWT tokens)
Offline:        TanStack Query offline support + AsyncStorage for notes cache
Icons:          react-native-vector-icons / expo/vector-icons

FOLDER STRUCTURE (apps/mobile/src):
navigation/
  RootNavigator.tsx         ← role switch
  AuthStack.tsx
  StudentTabs.tsx
  TeacherTabs.tsx
  ParentTabs.tsx
screens/
  auth/
    InstituteDiscovery.tsx
    OTPLogin.tsx
  student/
    HomeScreen.tsx
    CoursesScreen.tsx
    CourseDetailScreen.tsx
    VideoPlayerScreen.tsx
    TestListScreen.tsx
    TestScreen.tsx           ← timer, question UI, submit
    TestResultScreen.tsx
    LeaderboardScreen.tsx
    LiveClassScreen.tsx      ← BBB WebView + custom header
    FeesScreen.tsx
    ProfileScreen.tsx
  teacher/
    HomeScreen.tsx
    AttendanceScreen.tsx
    ContentUploadScreen.tsx
    TeacherLiveClassScreen.tsx
  parent/
    HomeScreen.tsx
    AttendanceScreen.tsx
    FeesScreen.tsx
    UpdatesScreen.tsx
  shared/
    NotificationsScreen.tsx
    SettingsScreen.tsx
components/
  ProgressRing.tsx           ← SVG ring, Animated.Value
  StreakBanner.tsx
  CourseCard.tsx
  VideoCard.tsx
  SkeletonLoader.tsx
  TestQuestionCard.tsx
  LeaderboardRow.tsx
  AttendanceCalendar.tsx
  BottomSheet.tsx            ← custom, used for modals
services/
  api.ts                    ← axios + JWT + version header
  socket.ts                 ← Socket.io for live attendance
  notifications.ts          ← FCM token registration
  branding.ts               ← institute config + color tokens
```

### 10.3 Shared Data Fetching Patterns

```typescript
// apps/mobile/src/services/api.ts
// SAME pattern on web and mobile — only the base URL differs

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL + '/api/v1',
  timeout: 15000,
  headers: {
    'X-App-Version': Constants.expoConfig?.version ?? '1.0.0',
    'X-Platform': Platform.OS,
  },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) return api.request(error.config);
    useAuthStore.getState().logout();
  }
  if (error.response?.status === 426) {
    // Force update
    useAppStore.getState().setForceUpdate(true);
  }
  return Promise.reject(error);
});

// TanStack Query key factory — consistent cache keys
export const queryKeys = {
  student: {
    home:     ['student', 'home'] as const,
    courses:  ['student', 'courses'] as const,
    course:   (name: string) => ['student', 'course', name] as const,
    tests:    ['student', 'tests'] as const,
    fees:     ['student', 'fees'] as const,
    profile:  (id: string) => ['student', 'profile', id] as const,
  },
  teacher: {
    schedule: ['teacher', 'schedule'] as const,
    students: (batch: string) => ['teacher', 'students', batch] as const,
  },
  parent: {
    children: ['parent', 'children'] as const,
    child:    (id: string) => ['parent', 'child', id] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    students:  (filters: any) => ['admin', 'students', filters] as const,
    fees:      ['admin', 'fees'] as const,
  },
};
```

### 10.4 Branding System in Mobile

```typescript
// apps/mobile/src/services/branding.ts

interface InstituteTheme {
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  logoUrl: string;
  fontFamily: string;
}

// Loaded once on app launch after institute slug is known
export async function loadInstituteTheme(slug: string): Promise<InstituteTheme> {
  const cached = await SecureStore.getItemAsync(`theme:${slug}`);
  if (cached) return JSON.parse(cached);

  const { data } = await api.get(`/tenants/${slug}/branding`);
  await SecureStore.setItemAsync(`theme:${slug}`, JSON.stringify(data));
  return data;
}

// Context provider applies theme to all components
export function ThemeProvider({ theme, children }) {
  return (
    <ThemeContext.Provider value={theme}>
      {/* NativeWind uses this to override --accent color */}
      {children}
    </ThemeContext.Provider>
  );
}

// ProgressRing uses institute primary color automatically
function ProgressRing({ value, size }) {
  const { primaryColor } = useTheme();
  return <SvgRing color={primaryColor} value={value} size={size} />;
}
```

---

## Part 11: Offline Support Strategy

Students study in areas with poor connectivity (Tier 2/3 cities). The student app must be partially functional offline.

```
WHAT WORKS OFFLINE:
  ✓ Browsing already-downloaded course content
  ✓ Watching downloaded HLS video segments
  ✓ Reading cached PDF notes
  ✓ Viewing last-synced test results and rank
  ✓ Viewing attendance history (cached)
  ✓ Viewing fee payment history (cached)

WHAT REQUIRES INTERNET:
  ✗ Taking a live test
  ✗ Joining a live class
  ✗ Uploading doubt photos
  ✗ Paying fees
  ✗ Real-time attendance

IMPLEMENTATION:
  Video download: User taps "Download" → expo-file-system downloads HLS segments
  PDF cache:      react-native-pdf caches automatically on first view
  Data cache:     TanStack Query persister stores query results in AsyncStorage
  Offline banner: NetInfo detects connectivity → shows "Offline mode" banner
                  queued actions sync when connection returns
```

---

## Part 12: Performance Targets

```
WEB (Lighthouse targets):
  Performance:    > 90
  FCP:            < 1.2s
  LCP:            < 2.5s
  TTI:            < 3.5s
  CLS:            < 0.1

Achieved via:
  - Next.js Image optimization (all thumbnails, logos)
  - next/font for zero layout shift
  - TanStack Query: stale-while-revalidate for instant loads
  - Skeleton loaders for all async content
  - Code splitting per route (default in App Router)
  - Recharts dynamic import (chart library is large)
  - Metabase iframes lazy-loaded (only when analytics tab active)
  - API responses: compression enabled in Nginx

MOBILE:
  App launch (cold):     < 3s on mid-range Android
  Screen transition:     < 300ms (native stack nav)
  API response (cached): < 50ms (TanStack Query cache hit)
  API response (fresh):  < 800ms (gateway + Redis cache)
  Video start time:      < 2s (HLS segment buffering)
  Test submit:           < 1.5s (direct gateway → PostgreSQL)
```

---

## Part 13: Accessibility

```
WEB:
  - All interactive elements reachable via keyboard (Tab order enforced)
  - Focus rings visible (--shadow-glow token applied globally)
  - Color contrast: WCAG AA minimum everywhere (4.5:1 for text)
  - aria-label on all icon-only buttons
  - aria-live regions for real-time attendance feed
  - prefers-reduced-motion: all Framer Motion animations respect this
  - Screen reader: semantic HTML throughout (section, nav, main, article)

MOBILE:
  - accessibilityLabel on all touchable components
  - accessibilityRole set correctly (button, image, text)
  - Dynamic text size: NativeWind responsive text, no fixed px
  - Color not the only indicator: all states have shape/icon differentiation
  - VoiceOver (iOS) and TalkBack (Android) tested on core flows
```

---

## Summary: Design Decision Map

| Question | Decision | Reason |
|---|---|---|
| Separate apps or unified mobile? | ONE Expo app, role-switching UI | One store review, one update, shared code, same arch as Slack |
| Super admin separate? | Yes, separate Next.js deployment | Different JWT, different audience, security boundary |
| Light or dark default for admin? | Light (institute panel), Dark (super admin) | Admin works in offices; super admin is internal ops |
| Student app dark mode? | AUTO (follows system) | Students study at night; dark mode reduces eye strain |
| Primary font? | Geist (web) + System (mobile) | Editorial precision for web; performance and native feel on mobile |
| Signature UI element? | Progress Ring | Unifies all apps, communicates progress visually, memorable brand element |
| Component library? | shadcn/ui (web) + custom primitives (mobile) | shadcn: flexibility without lock-in; mobile: no CSS-in-JS overhead |
| Real-time pattern? | Socket.io with Redis adapter | Scales across multiple gateway instances (v3 architecture requirement) |
| Chart library? | Recharts (web) + react-native-svg (mobile) | Best Next.js integration; no webview dependency on mobile |
| Metabase embedding? | Hidden iframe, styled to match | Complete white-label per v2/v3 architecture |
| Offline support? | Student content only | Tests and payments need real-time; study content doesn't |
| Animation philosophy? | One signature motion, rest minimal | Spend boldness in one place (skill principle applied) |
```
