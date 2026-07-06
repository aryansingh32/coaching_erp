# Deep UI Analysis: Original Open Source Applications vs CoachingOS Implementation

## Executive Summary

This document provides a comprehensive analysis of the original UI and code structures of 7 open-source applications integrated into CoachingOS, compares them with the current implementation, and identifies gaps that need to be addressed to build a complete unified system.

---

## 1. Moodle (Learning Management System)

### 1.1 Original UI Architecture

**Technology Stack:**
- **Backend:** PHP (server-side rendering)
- **Frontend:** Mustache templates (.mustache files)
- **JavaScript:** AMD modules (RequireJS)
- **CSS:** Bootstrap-based with custom themes

**Directory Structure:**
```
moodle/public/
├── course/              # Course management UI
│   ├── format/         # Course format templates (topics, weeks, etc.)
│   │   └── templates/
│   │       ├── local/content/cm.mustache          # Course module display
│   │       ├── local/content/cm/activity.mustache # Activity cards
│   │       └── local/activitychooser/            # Activity picker
│   ├── renderer.php     # Course rendering logic
│   └── view.php         # Course view page
├── mod/                 # Activity modules
│   ├── quiz/           # Quiz/Online tests
│   ├── forum/          # Discussion forums
│   ├── assign/         # Assignments
│   ├── resource/       # Files/PDFs
│   ├── bigbluebuttonbn # BBB integration
│   └── ...
├── grade/               # Grading interface
│   └── templates/
│       ├── grades/grader/    # Grader interface
│       └── general_action_bar.mustache
└── user/                # User profiles
    └── templates/
        └── edit_profile_fields.mustache
```

**Key UI Components:**

1. **Course Dashboard:**
   - Course cards with progress indicators
   - Activity completion tracking
   - Section-based content organization
   - Activity chooser for adding content

2. **Quiz Interface:**
   - Question-by-question navigation
   - Timer display
   - Review and grading interface
   - Attempt history

3. **Forum Interface:**
   - Threaded discussions
   - Post editing and replies
   - Subscription management
   - Attachments and embeds

4. **Assignment Interface:**
   - File upload zones
   - Submission status tracking
   - Grading rubrics
   - Feedback display

**Template System (Mustache):**
```mustache
<!-- Example: course/format/templates/local/content/cm.mustache -->
{{#activities}}
<div class="activity {{modname}}">
    <div class="activity-icon">{{{icon}}}</div>
    <div class="activity-content">
        <h3>{{name}}</h3>
        <p>{{description}}</p>
        {{#completion}}
        <div class="completion-status">{{completion}}</div>
        {{/completion}}
    </div>
</div>
{{/activities}}
```

### 1.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Headless (no Moodle UI exposed)
- **Integration:** Moodle Web Services API via Gateway
- **Frontend:** Custom Next.js components consuming Moodle data

**Gateway Endpoints:**
```typescript
// gateway/src/modules/lms/lms.controller.ts
GET  /api/v1/lms/courses              // Course list
GET  /api/v1/lms/courses/:id/content  // Course content (chapters, videos, PDFs)
GET  /api/v1/lms/courses/:id/grades   // Student grades
```

**Current Next.js Implementation:**
```
web/app/learn/
├── courses/
│   ├── page.tsx           # Course list
│   └── [batchId]/page.tsx # Course detail (INCOMPLETE)
└── tests/                 # MISSING - no test UI
```

**Gaps Identified:**

1. **Course Content Viewer Missing:**
   - No chapter accordion component
   - No video player integration
   - No PDF viewer with watermarking
   - No progress tracking UI

2. **Quiz/Test Interface Missing:**
   - Backend supports Moodle Quiz (`tests` module exists)
   - No frontend test-taking UI
   - No question display component
   - No timer or navigation UI

3. **Forum Interface Missing:**
   - No discussion UI
   - No thread view
   - No posting interface

4. **Assignment Interface Missing:**
   - No file upload UI
   - No submission tracking
   - No grading feedback display

### 1.3 Required Next.js Components

**Priority 1 - Course Content:**
```typescript
// web/components/learn/CourseContentViewer.tsx
interface CourseContentViewerProps {
  batchId: string;
  courseId: number;
}

// Features:
// - Chapter accordion (expandable sections)
// - Video player with HLS streaming
// - PDF viewer with student watermarking
// - Progress ring per chapter
// - Completion tracking
// - Mobile-responsive layout
```

**Priority 2 - Quiz Interface:**
```typescript
// web/components/learn/QuizInterface.tsx
interface QuizInterfaceProps {
  quizId: string;
  attemptId?: string;
}

// Features:
// - Question-by-question display
// - Multiple choice, true/false, text answers
// - Timer countdown
// - Navigation (prev/next/question map)
// - Submit confirmation
// - Review mode (after submission)
// - Score display with rank
```

**Priority 3 - Assignment Upload:**
```typescript
// web/components/learn/AssignmentUploader.tsx
interface AssignmentUploaderProps {
  assignmentId: string;
}

// Features:
// - Drag-and-drop file upload
// - File type validation
// - Upload progress indicator
// - Submission status
// - Resubmission handling
```

---

## 2. ERPNext (Enterprise Resource Planning)

### 2.1 Original UI Architecture

**Technology Stack:**
- **Backend:** Python (Frappe Framework)
- **Frontend:** Frappe Desk (jQuery + Vue.js 3)
- **CSS:** Bootstrap 5 with custom Frappe UI
- **Build:** Webpack for asset bundling

**Directory Structure:**
```
erpnext/erpnext/
├── accounts/           # Accounting module
├── buying/             # Purchase management
├── selling/            # Sales management
├── crm/                # Customer relationship management
├── manufacturing/      # Manufacturing module
├── stock/              # Inventory management
├── hr/                 # Human resources
├── projects/           # Project management
├── education/          # Education module (SEPARATE)
├── setup/              # Setup and configuration
├── templates/          # Jinja2 templates
├── public/             # Static assets
└── www/                # Web interface
```

**Key UI Components:**

1. **Desk Interface:**
   - Sidebar navigation (workspace menu)
   - Data tables with filters
   - Form views with field layouts
   - Dashboard with charts
   - Report builders

2. **Form System:**
   - Dynamic field rendering
   - Link fields (foreign keys)
   - Table fields (child tables)
   - Section-based layouts
   - Custom field types

3. **Data Tables:**
   - Pagination
   - Column sorting
   - Global search
   - Bulk actions
   - Export functionality

4. **Dashboard:**
   - Number cards (KPIs)
   - Charts (line, bar, pie)
   - Heatmaps
   - Custom widgets

**Example Form Structure (Jinja2):**
```html
<!-- Frappe Desk Form Template -->
<div class="form-layout">
    <section class="section-break">
        <div class="section-head">
            <h3>Student Information</h3>
        </div>
        <div class="form-column">
            {{ frm.field('student_name') }}
            {{ frm.field('student_mobile_number') }}
            {{ frm.field('student_email_id') }}
        </div>
    </section>
    <section class="section-break">
        <div class="section-head">
            <h3>Academic Details</h3>
        </div>
        <div class="form-column">
            {{ frm.field('batch') }}
            {{ frm.field('program') }}
        </div>
    </section>
</div>
```

### 2.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Headless (no Frappe Desk exposed)
- **Integration:** ERPNext REST API via Gateway
- **Frontend:** Custom Next.js components

**Gateway Endpoints:**
```typescript
// gateway/src/modules/students/students.controller.ts
GET    /api/v1/students              // Student list
POST   /api/v1/students             // Create student
GET    /api/v1/students/:erpId      // Student details
PUT    /api/v1/students/:erpId      // Update student
POST   /api/v1/students/bulk-import // CSV import
POST   /api/v1/students/:erpId/rfid-card // RFID assignment

// gateway/src/modules/batches/batches.controller.ts
GET    /api/v1/batches              // Batch list
POST   /api/v1/batches              // Create batch
GET    /api/v1/batches/:id          // Batch details
POST   /api/v1/batches/:id/enroll  // Enroll student
POST   /api/v1/batches/:id/schedule // Add schedule
POST   /api/v1/batches/:id/instructors // Assign teacher

// gateway/src/modules/attendance/attendance.controller.ts
POST   /api/v1/attendance/manual    // Manual attendance
GET    /api/v1/attendance/reports   // Attendance reports

// gateway/src/modules/fees/fees.controller.ts
POST   /api/v1/fees/schedule        // Create fee schedule
GET    /api/v1/fees/pending/:studentId // Pending fees
POST   /api/v1/fees/payment         // Initiate payment
```

**Current Next.js Implementation:**
```
web/app/institute/
├── dashboard/page.tsx      # Institute dashboard
├── students/
│   ├── page.tsx           # Student list
│   ├── new/page.tsx       # Create student
│   ├── import/page.tsx    # MISSING - bulk import UI
│   └── [erpId]/page.tsx   # Student detail
├── batches/
│   ├── page.tsx           # Batch list
│   └── [id]/page.tsx      # Batch detail
├── attendance/
│   ├── page.tsx           # Attendance marking
│   └── reports/page.tsx   # Attendance reports
├── fees/
│   ├── page.tsx           # Fee management
│   └── [studentId]/page.tsx # Student fees
└── schedule/page.tsx      # Schedule calendar
```

**Gaps Identified:**

1. **Bulk Import UI Missing:**
   - Backend endpoint exists (`students/bulk-import`)
   - No CSV upload interface
   - No column mapping UI
   - No validation display
   - No progress indicator

2. **Advanced Form Features Missing:**
   - No dynamic field rendering
   - No link field autocomplete
   - No table field (child table) UI
   - No section-based layouts

3. **Report Builder Missing:**
   - No custom report creation
   - No filter builder
   - No export functionality
   - No scheduled reports

4. **Teacher Management Missing:**
   - No dedicated teacher directory
   - No teacher profile pages
   - No teacher assignment UI

### 2.3 Required Next.js Components

**Priority 1 - Bulk Import:**
```typescript
// web/components/institute/BulkImportWizard.tsx
interface BulkImportWizardProps {
  instituteId: string;
}

// Features:
// - CSV file upload zone
// - Column mapping interface
// - Validation preview
// - Error display with row numbers
// - Progress indicator (BullMQ job polling)
// - Success/error summary
```

**Priority 2 - Advanced Data Table:**
```typescript
// web/components/shared/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
}

// Features:
// - Server-side pagination
// - Column sorting
// - Global search
// - Column filters
// - Bulk actions
// - Export to CSV/Excel
// - Row selection
```

**Priority 3 - Dynamic Form Builder:**
```typescript
// web/components/shared/DynamicForm.tsx
interface DynamicFormProps {
  schema: FormSchema;
  onSubmit: (data: any) => void;
}

// Features:
// - Field type rendering (text, select, date, link, table)
// - Section-based layout
// - Field validation
// - Conditional fields
// - Auto-save
// - Form history
```

---

## 3. BigBlueButton (Live Classes)

### 3.1 Original UI Architecture

**Technology Stack:**
- **Backend:** Meteor.js (real-time web framework)
- **Frontend:** React + Redux
- **Real-time:** WebRTC via BBB Web SFU
- **Build:** Webpack

**Directory Structure:**
```
bigbluebutton/bigbluebutton-html5/
├── client/              # React client
│   ├── main.html       # Entry point
│   ├── main.tsx        # Main component
│   └── meetingClient.jsx
├── server/             # Meteor server
├── public/             # Static assets
└── imports/            # Meteor imports
```

**Key UI Components:**

1. **Video Conference:**
   - Multi-user video grid
   - Audio controls (mute/unmute)
   - Screen sharing
   - Webcam sharing
   - Layout options (grid, focus, presentation)

2. **Whiteboard:**
   - Drawing tools (pen, shapes, text)
   - Multi-user annotations
   - Undo/redo
   - Clear board
   - Save annotations

3. **Presentation:**
   - Slide navigation
   - Zoom controls
   - Fullscreen mode
   - Presentation upload
   - Annotations on slides

4. **Chat:**
   - Public chat
   - Private chat
   - Emoji support
   - File sharing
   - Chat history

5. **Breakout Rooms:**
   - Room creation
   - User assignment
   - Room switching
   - Broadcast message

6. **Polling:**
   - Poll creation
   - Multiple choice options
   - Real-time results
   - Poll history

### 3.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Iframe wrapper (not rebuilding BBB UI)
- **Integration:** BBB API via Gateway
- **Frontend:** Custom Next.js layout with iframe

**Gateway Endpoints:**
```typescript
// gateway/src/modules/live-class/live-class.controller.ts
GET    /api/v1/live-class/list       // List live classes
POST   /api/v1/live-class/create    // Create BBB meeting
POST   /api/v1/live-class/:id/join  // Get join URL
POST   /api/v1/live-class/:id/end   // End meeting
GET    /api/v1/live-class/:id/recordings // Get recordings
```

**Current Next.js Implementation:**
```
web/app/learn/live-class/
└── [meetingId]/page.tsx    # MISSING - live class iframe wrapper

web/app/teach/live-class/
└── page.tsx                # MISSING - teacher live class management
```

**Gaps Identified:**

1. **Live Class Iframe Wrapper Missing:**
   - No iframe component for BBB client
   - No custom header overlay
   - No CSS injection for branding
   - No doubt chat overlay

2. **Teacher Management Missing:**
   - No class creation UI
   - No class scheduling
   - No active class monitoring
   - No recording management

3. **Student Interface Missing:**
   - No class join UI
   - No class list
   - No recording playback

### 3.3 Required Next.js Components

**Priority 1 - Live Class Iframe Wrapper:**
```typescript
// web/components/learn/LiveClassIframe.tsx
interface LiveClassIframeProps {
  meetingId: string;
  userName: string;
  role: 'student' | 'teacher';
  customStyleUrl?: string;
}

// Features:
// - Full-screen iframe for BBB client
// - Custom header overlay (institute branding)
// - CSS injection to hide BBB branding
// - Doubt chat overlay (side panel)
// - Exit button with confirmation
// - Fullscreen toggle
// - Recording indicator
```

**Priority 2 - Teacher Live Class Management:**
```typescript
// web/components/teach/LiveClassManager.tsx
interface LiveClassManagerProps {
  batchId: string;
}

// Features:
// - Schedule new class
// - View upcoming classes
// - Start class instantly
// - View active classes
// - End class
// - Manage recordings
// - Class history
```

**Priority 3 - Recording Library:**
```typescript
// web/components/learn/RecordingLibrary.tsx
interface RecordingLibraryProps {
  batchId: string;
}

// Features:
// - Recording list with thumbnails
// - Video player for playback
// - Recording metadata (duration, date)
// - Download option
// - Share link generation
```

---

## 4. Metabase (Analytics & Dashboards)

### 4.1 Original UI Architecture

**Technology Stack:**
- **Backend:** Clojure (Metabase server)
- **Frontend:** React + Redux
- **Build:** Rspack (React bundler)
- **Charts:** Recharts, D3.js

**Directory Structure:**
```
metabase/frontend/src/metabase/
├── dashboard/           # Dashboard UI
├── query_builder/       # SQL/visual query builder
├── questions/           # Question/saved query UI
├── data-grid/           # Data table display
├── visualizations/      # Chart components
├── embedding/           # Embedding SDK
├── embedding-sdk/       # Embed SDK bundle
├── admin/               # Admin interface
├── browse/              # Data browser
└── public/              # Public dashboards
```

**Key UI Components:**

1. **Dashboard Builder:**
   - Drag-and-drop card layout
   - Card sizing and positioning
   - Dashboard parameters
   - Auto-refresh settings
   - Sharing options

2. **Query Builder:**
   - Visual query builder (GUI)
   - SQL editor with syntax highlighting
   - Join tables
   - Filter conditions
   - Aggregation functions
   - Preview results

3. **Visualization Types:**
   - Line charts
   - Bar charts
   - Pie charts
   - Area charts
   - Scatter plots
   - Maps
   - Tables
   - Numbers

4. **Data Browser:**
   - Table view
   - Column details
   - Foreign key relationships
   - Sample data preview

5. **Embedding SDK:**
   - Iframe embedding
   - JWT authentication
   - Parameter passing
   - Theme customization

### 4.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Iframe embedding (not rebuilding Metabase UI)
- **Integration:** Metabase embedding API via Gateway
- **Frontend:** Iframe components in Next.js

**Gateway Endpoints:**
```typescript
// gateway/src/modules/analytics/analytics.controller.ts
GET    /api/v1/analytics/dashboard/:id  // Dashboard data
GET    /api/v1/analytics/kpis          // KPI metrics
```

**Current Next.js Implementation:**
```
web/app/institute/analytics/page.tsx    # MISSING - Metabase embed
web/app/superadmin/analytics/page.tsx   # MISSING - platform analytics
```

**Gaps Identified:**

1. **Dashboard Embedding Missing:**
   - No iframe component for Metabase
   - No JWT token generation
   - No parameter passing (institute_id, batch_id)
   - No responsive sizing

2. **KPI Cards Missing:**
   - No standalone KPI display
   - No trend indicators
   - No comparison views

3. **Custom Dashboard Builder Missing:**
   - No UI for creating custom dashboards
   - No chart selection
   - No filter configuration

### 4.3 Required Next.js Components

**Priority 1 - Metabase Dashboard Embed:**
```typescript
// web/components/analytics/MetabaseDashboard.tsx
interface MetabaseDashboardProps {
  dashboardId: number;
  instituteId: string;
  batchId?: string;
  height?: string;
  bordered?: boolean;
  title?: string;
}

// Features:
// - Iframe with Metabase dashboard
// - JWT-signed embed URL
// - Locked parameters (institute_id, batch_id)
// - Responsive height
// - Loading state
// - Error handling
// - Fullscreen mode
```

**Priority 2 - KPI Cards:**
```typescript
// web/components/analytics/KPICard.tsx
interface KPICardProps {
  title: string;
  value: number | string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  icon?: React.ReactNode;
  color?: string;
}

// Features:
// - Large value display
// - Trend indicator (up/down arrow)
// - Percentage change
// - Color coding (green for good, red for bad)
// - Icon support
// - Click to drill down
```

**Priority 3 - Analytics Grid:**
```typescript
// web/components/analytics/AnalyticsGrid.tsx
interface AnalyticsGridProps {
  instituteId: string;
  dashboardIds: number[];
}

// Features:
// - Grid layout for multiple dashboards
// - Responsive (1-4 columns)
// - Collapsible sections
// - Refresh controls
// - Date range picker
```

---

## 5. Education (Frappe Module)

### 5.1 Original UI Architecture

**Technology Stack:**
- **Backend:** Python (Frappe Framework)
- **Frontend:** Vue 3 SPA (Vite)
- **CSS:** Tailwind CSS
- **Build:** Vite

**Directory Structure:**
```
education/frontend/src/
├── components/          # Vue components
│   ├── AttendanceDetail.vue
│   ├── Calendar.vue
│   ├── CalendarEvent.vue
│   ├── FeesPaymentDialog.vue
│   ├── Grades.vue
│   ├── Navbar.vue
│   ├── Sidebar.vue
│   └── ...
├── pages/              # Page components
│   ├── Attendance.vue
│   ├── Fees.vue
│   ├── Grades.vue
│   ├── Schedule.vue
│   ├── Leaves.vue
│   └── Home.vue
├── router.js           # Vue Router
├── stores/             # Pinia stores
└── utils/              # Utilities
```

**Key UI Components:**

1. **Attendance Interface:**
   - Batch selector
   - Student list with P/A/L toggles
   - Date picker
   - Bulk actions (mark all present)
   - Attendance summary

2. **Fees Interface:**
   - Fee schedule table
   - Payment history
   - Pending fees list
   - Payment dialog
   - Receipt generation

3. **Grades Interface:**
   - Grade table
   - Subject-wise grades
   - Overall performance
   - Rank display
   - Grade trends

4. **Schedule Interface:**
   - Calendar view (month/week/day)
   - Class cards
   - Filter by batch/subject
   - Class details

5. **Leave Management:**
   - Leave request form
   - Leave history
   - Approval status
   - Balance display

### 5.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Migration from Vue 3 to Next.js (in progress)
- **Integration:** Same ERPNext backend
- **Frontend:** Next.js components replacing Vue

**Current Next.js Implementation:**
```
web/app/institute/
├── attendance/page.tsx      # PARTIAL - needs completion
├── fees/page.tsx            # PARTIAL - needs completion
├── schedule/page.tsx        # PARTIAL - needs completion
└── grades/                  # MISSING - no grades page
```

**Gaps Identified:**

1. **Attendance UI Incomplete:**
   - Basic structure exists
   - Missing RFID live feed integration
   - Missing bulk actions
   - Missing attendance heatmap

2. **Fees UI Incomplete:**
   - Basic structure exists
   - Missing payment dialog
   - Missing receipt generation
   - Missing fee schedule builder

3. **Grades UI Missing:**
   - No grades page at all
   - No grade entry interface
   - No grade report cards
   - No performance trends

4. **Leave Management Missing:**
   - No leave request UI
   - No approval inbox
   - No leave balance display

### 5.3 Required Next.js Components

**Priority 1 - Complete Attendance Interface:**
```typescript
// web/components/institute/AttendanceManager.tsx
interface AttendanceManagerProps {
  batchId?: string;
  date?: Date;
}

// Features:
// - Batch selector
// - Date picker
// - Student list with P/A/L toggles
// - Bulk actions (mark all present/absent)
// - RFID live feed panel (WebSocket)
// - Attendance summary (present/absent/late counts)
// - Attendance heatmap (monthly view)
// - Export to CSV
```

**Priority 2 - Complete Fees Interface:**
```typescript
// web/components/institute/FeesManager.tsx
interface FeesManagerProps {
  batchId?: string;
  studentId?: string;
}

// Features:
// - Fee schedule table
// - Payment history
// - Pending fees list with due dates
// - Payment dialog (Razorpay integration)
// - Receipt generation (PDF)
// - Fee defaulter list
// - Bulk fee reminders
```

**Priority 3 - Grades Interface:**
```typescript
// web/components/institute/GradesManager.tsx
interface GradesManagerProps {
  batchId: string;
  studentId?: string;
}

// Features:
// - Grade entry form
// - Grade table (student × subject)
// - Subject-wise averages
// - Overall performance
// - Rank display
// - Grade trends (charts)
// - Report card generation (PDF)
```

**Priority 4 - Leave Management:**
```typescript
// web/components/institute/LeaveManager.tsx
interface LeaveManagerProps {
  studentId?: string;
  role: 'student' | 'parent' | 'admin';
}

// Features:
// - Leave request form
// - Leave history
// - Approval inbox (for admin)
// - Leave balance display
// - Leave calendar
// - Approval/rejection workflow
```

---

## 6. Novu (Notifications)

### 6.1 Original UI Architecture

**Technology Stack:**
- **Backend:** Node.js (NestJS)
- **Frontend:** React (Vite)
- **CSS:** Tailwind CSS
- **Build:** Vite

**Directory Structure:**
```
novu/apps/dashboard/src/
├── components/          # React components
├── pages/              # Page components
├── routes/             # Route definitions
├── hooks/              # Custom hooks
├── api/                # API clients
├── context/            # React context
├── config/             # Configuration
└── utils/              # Utilities
```

**Key UI Components:**

1. **Notification Dashboard:**
   - Template editor
   - Workflow builder
   - Channel configuration
   - Subscriber management
   - Notification history

2. **Notification Center (End-user):**
   - Notification bell
   - Notification popover
   - Unread count
   - Mark as read
   - Notification preferences

3. **Template Editor:**
   - Rich text editor
   - Variable insertion
   - Preview
   - Multi-language support
   - Template versioning

4. **Workflow Builder:**
   - Drag-and-drop workflow
   - Trigger configuration
   - Step chaining
   - Conditional logic
   - Testing

### 6.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Novu SDK integration
- **Integration:** Novu API via Gateway
- **Frontend:** Novu React components

**Current Next.js Implementation:**
```
web/components/notifications/
└── NovuBell.tsx         # EXISTS - notification bell component
```

**Gaps Identified:**

1. **Notification Bell Not Integrated:**
   - Component exists but not used in layouts
   - Missing from institute layout
   - Missing from student layout
   - Missing from teacher layout

2. **Template Management Missing:**
   - No UI for managing notification templates
   - No workflow builder
   - No channel configuration

3. **Notification Preferences Missing:**
   - No user preference UI
   - No channel selection
   - No frequency controls

### 6.3 Required Next.js Components

**Priority 1 - Notification Bell Integration:**
```typescript
// web/app/(institute)/layout.tsx
// web/app/(learn)/layout.tsx
// web/app/(teach)/layout.tsx

// Add to all layouts:
import { NovuProvider, PopoverNotificationCenter, NotificationBell } from '@novu/notification-center';

<NovuProvider
  subscriberId={user.erpId}
  applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_ID}
>
  <PopoverNotificationCenter colorScheme="light">
    {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
  </PopoverNotificationCenter>
</NovuProvider>
```

**Priority 2 - Notification Preferences:**
```typescript
// web/components/shared/NotificationPreferences.tsx
interface NotificationPreferencesProps {
  subscriberId: string;
}

// Features:
// - Channel toggles (email, SMS, push, in-app)
// - Notification type preferences
// - Frequency controls
// - Quiet hours
// - Save preferences
```

**Priority 3 - Template Management (Super Admin):**
```typescript
// web/app/superadmin/notifications/page.tsx

// Features:
// - Template list
// - Template editor (embedded Novu dashboard)
// - Workflow builder (embedded Novu dashboard)
// - Channel configuration
// - Test notification
```

---

## 7. ClickHouse (Analytics Database)

### 7.1 Original Architecture

**Technology Stack:**
- **Database:** ClickHouse (OLAP columnar database)
- **Query:** SQL dialect
- **Visualization:** Metabase, Superset, Grafana

**Key Features:**
- Real-time analytics
- High compression
- Fast aggregations
- Time-series optimization
- Materialized views

### 7.2 Current CoachingOS Implementation

**Architecture:**
- **Approach:** Backend-only (no direct UI)
- **Integration:** Gateway queries ClickHouse
- **Frontend:** Metabase dashboards display results

**Gateway Integration:**
```typescript
// gateway/src/modules/analytics/analytics.service.ts
async query(sql: string, params: any): Promise<any> {
  // Query ClickHouse
  // Return results for dashboard
}
```

**Gaps Identified:**

1. **No Direct Query UI:**
   - No SQL editor for ad-hoc queries
   - No query history
   - No result export

2. **No Data Schema Browser:**
   - No table list
   - No column details
   - No sample data preview

### 7.3 Required Next.js Components

**Priority 1 - SQL Query Editor (Super Admin):**
```typescript
// web/app/superadmin/query-editor/page.tsx

// Features:
// - SQL editor with syntax highlighting
// - Query execution
// - Results table
// - Query history
// - Save queries
// - Export results
// - Query templates
```

**Priority 2 - Schema Browser:**
```typescript
// web/components/analytics/SchemaBrowser.tsx

// Features:
// - Table list
// - Column details
// - Data types
// - Sample data preview
// - Table relationships
```

---

## 8. Three-App Architecture Design

### 8.1 App 1: SAAS Super Admin Panel (Web)

**Target Audience:** Platform owner (you)
**Purpose:** Manage all coaching institutes, platform health, billing

**Route Structure:**
```
web/app/superadmin/
├── dashboard/page.tsx           # Platform overview
├── tenants/
│   ├── page.tsx                # Institute list
│   ├── new/page.tsx            # Provision new institute
│   └── [id]/page.tsx           # Institute details
├── plans/
│   ├── page.tsx                # Plan management (Starter/Growth/Pro)
│   └── [id]/page.tsx           # Plan details
├── features/
│   ├── page.tsx                # Feature catalog
│   └── [id]/page.tsx           # Feature configuration
├── analytics/
│   ├── page.tsx                # Platform analytics
│   └── reports/page.tsx        # Custom reports
├── billing/
│   ├── page.tsx                # Revenue overview
│   └── invoices/page.tsx       # Invoice management
├── health/
│   ├── page.tsx                # Service health
│   └── logs/page.tsx           # System logs
├── security/
│   ├── page.tsx                # Security overview
│   └── audit-logs/page.tsx     # Audit trail
└── settings/
    └── page.tsx                # Platform settings
```

**Key Features:**
- Multi-tenant management
- Plan & feature flag management
- Platform analytics (ClickHouse dashboard embeds)
- Billing & revenue tracking
- Service health monitoring
- Audit logging
- API proxy (direct ERPNext/Moodle access)

### 8.2 App 2: Institute Admin Panel + Teacher Interface (Web)

**Target Audience:** Coaching institute admins, teachers
**Purpose:** Complete institute management, teaching tools

**Route Structure:**
```
web/app/institute/              # Admin interface
├── dashboard/page.tsx          # Institute dashboard
├── students/
│   ├── page.tsx               # Student list
│   ├── new/page.tsx           # Create student
│   ├── import/page.tsx        # Bulk import
│   └── [erpId]/page.tsx       # Student detail
├── batches/
│   ├── page.tsx               # Batch list
│   ├── new/page.tsx           # Create batch
│   └── [id]/page.tsx          # Batch detail
├── teachers/
│   ├── page.tsx               # Teacher directory
│   ├── new/page.tsx           # Add teacher
│   └── [id]/page.tsx          # Teacher detail
├── attendance/
│   ├── page.tsx               # Attendance marking
│   └── reports/page.tsx       # Attendance reports
├── fees/
│   ├── page.tsx               # Fee management
│   ├── schedule/page.tsx      # Fee schedule
│   └── [studentId]/page.tsx   # Student fees
├── schedule/
│   └── page.tsx               # Class schedule
├── grades/
│   ├── page.tsx               # Grade management
│   └── reports/page.tsx       # Grade reports
├── exams/
│   ├── page.tsx               # Exam management
│   └── [id]/page.tsx          # Exam detail
├── live-classes/
│   ├── page.tsx               # Live class management
│   └── [id]/page.tsx          # Class detail
├── content/
│   ├── page.tsx               # Content library
│   └── upload/page.tsx       # Upload content
├── communication/
│   ├── page.tsx               # Announcements
│   └── templates/page.tsx     # Message templates
├── analytics/
│   └── page.tsx               # Institute analytics
└── settings/
    ├── page.tsx               # Institute settings
    ├── branding/page.tsx      # White-label branding
    └── integrations/page.tsx  # Third-party integrations

web/app/teach/                  # Teacher interface
├── home/page.tsx              # Teacher dashboard
├── batches/
│   └── [id]/page.tsx          # Batch view
├── attendance/
│   └── page.tsx               # Quick attendance
├── live-class/
│   ├── page.tsx               # Start class
│   └── [meetingId]/page.tsx   # Active class
├── grades/
│   └── page.tsx               # Grade entry
└── content/
    └── upload/page.tsx        # Upload content
```

**Key Features:**
- Student management (CRUD, bulk import, RFID)
- Batch/Program management
- Teacher management
- Attendance (manual + RFID live feed)
- Fee management (schedules, payments, defaults)
- Class scheduling
- Grade management
- Exam/Quiz management
- Live classes (BBB integration)
- Content management (videos, PDFs)
- Communication (announcements, notifications)
- Analytics (Metabase dashboards)
- White-label branding

### 8.3 App 3: Student/Parent Mobile App (React Native)

**Target Audience:** Students, parents
**Purpose:** Learning, attendance, fees, communication

**Route Structure:**
```
mobile/app/
├── (auth)/
│   ├── login.tsx              # Phone + institute slug
│   └── verify.tsx             # OTP verification
├── (student)/
│   ├── home.tsx               # Student dashboard
│   ├── courses.tsx            # My courses
│   ├── course-detail.tsx      # Course content
│   ├── tests.tsx              # Online tests
│   ├── test-taking.tsx        # Test interface
│   ├── live-class.tsx         # Live class
│   ├── attendance.tsx         # My attendance
│   ├── fees.tsx               # My fees
│   ├── fee-payment.tsx        # Pay fees
│   ├── grades.tsx             # My grades
│   ├── schedule.tsx            # My schedule
│   ├── timeline.tsx           # Activity timeline
│   ├── notifications.tsx       # Notifications
│   ├── profile.tsx            # My profile
│   └── settings.tsx           # Settings
└── (parent)/
    ├── home.tsx               # Parent dashboard
    ├── children.tsx           # Child selector
    ├── child-attendance.tsx   # Child's attendance
    ├── child-fees.tsx         # Child's fees
    ├── child-grades.tsx       # Child's grades
    ├── child-schedule.tsx     # Child's schedule
    ├── leave-request.tsx      # Submit leave
    └── notifications.tsx       # Notifications
```

**Key Features:**
- Course content viewer (videos, PDFs)
- Online test taking
- Live class joining
- Attendance tracking
- Fee payment (Razorpay)
- Grade viewing
- Schedule viewing
- Activity timeline
- Notifications (Novu)
- Profile management
- Parent mode (child switching, leave requests)

---

## 9. Implementation Priority Matrix

### Phase 1: Core Foundation (Week 1-2)

**Priority: CRITICAL**

1. **Notification Bell Integration** (All layouts)
   - Add NovuProvider to all route group layouts
   - Integrate NotificationBell component
   - Test notification flow

2. **Course Content Viewer** (Student web + mobile)
   - Chapter accordion component
   - Video player (HLS)
   - PDF viewer with watermarking
   - Progress tracking

3. **Attendance Interface Completion** (Institute admin)
   - RFID live feed integration
   - Bulk actions
   - Attendance heatmap
   - Export functionality

4. **Fees Interface Completion** (Institute admin)
   - Payment dialog (Razorpay)
   - Receipt generation
   - Fee schedule builder
   - Defaulter list

### Phase 2: Academic Features (Week 3-4)

**Priority: HIGH**

5. **Quiz/Test Interface** (Student web + mobile)
   - Question display
   - Timer
   - Navigation
   - Submit & review
   - Score display

6. **Live Class Iframe Wrapper** (All)
   - BBB iframe component
   - Custom header
   - Doubt chat overlay
   - Recording library

7. **Grades Interface** (Institute admin + teacher)
   - Grade entry form
   - Grade table
   - Report card generation
   - Performance trends

8. **Metabase Dashboard Embed** (Institute admin + super admin)
   - Iframe component
   - JWT token generation
   - Parameter passing
   - Responsive sizing

### Phase 3: Management Features (Week 5-6)

**Priority: MEDIUM**

9. **Bulk Import Wizard** (Institute admin)
   - CSV upload
   - Column mapping
   - Validation
   - Progress indicator

10. **Teacher Management** (Institute admin)
    - Teacher directory
    - Teacher profiles
    - Teacher assignment

11. **Leave Management** (All)
    - Leave request form
    - Approval inbox
    - Leave balance
    - Leave calendar

12. **Advanced Data Table** (Shared component)
    - Server-side pagination
    - Sorting
    - Filtering
    - Export

### Phase 4: Super Admin Features (Week 7-8)

**Priority: MEDIUM**

13. **Plan & Feature Management** (Super admin)
    - Plan configuration
    - Feature flag matrix
    - Tenant feature assignment

14. **Platform Analytics** (Super admin)
    - Platform KPIs
    - Multi-tenant dashboards
    - Revenue tracking

15. **Audit Logs** (Super admin)
    - Activity stream
    - Filtering
    - Export

### Phase 5: Mobile App Completion (Week 9-10)

**Priority: HIGH**

16. **Mobile Course Viewer** (Student)
    - Video player
    - PDF viewer
    - Progress tracking
    - Offline support

17. **Mobile Test Taking** (Student)
    - Question display
    - Timer
    - Submit
    - Review

18. **Mobile Fee Payment** (Student/Parent)
    - Razorpay integration
    - Payment history
    - Receipt download

19. **Mobile Parent Mode** (Parent)
    - Child selector
    - Child dashboard
    - Leave requests
    - Notifications

---

## 10. Technical Specifications

### 10.1 Design System

**Color Tokens:**
```typescript
// web/lib/tokens.ts
export const tokens = {
  platform: {
    bg: '#0D1117',
    surface: '#161B22',
    elevated: '#21262D',
    border: '#30363D',
    text: '#F0F6FC',
    muted: '#8B949E',
    accent: '#6E40C9',
    success: '#3FB950',
    warning: '#D29922',
    danger: '#F85149',
  },
  institute: {
    bg: '#F6F8FA',
    surface: '#FFFFFF',
    border: '#D0D7DE',
    text: '#1F2328',
    muted: '#59636E',
    primary: 'var(--inst-primary)', // Dynamic
    success: '#1A7F37',
    warning: '#9A6700',
    danger: '#CF222E',
  },
  mobile: {
    light: {
      bg: '#F4F6FA',
      card: '#FFFFFF',
      border: '#E5E7EB',
      text: '#111827',
      muted: '#6B7280',
    },
    dark: {
      bg: '#0F1117',
      card: '#1A1D25',
      border: '#2A2D35',
      text: '#F9FAFB',
      muted: '#9CA3AF',
    },
  },
};
```

**Typography:**
- Font: Geist Sans (Vercel)
- Headings: 600 weight
- Body: 400 weight
- Monospace: Geist Mono

**Spacing:**
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

**Border Radius:**
- Sm: 4px
- Md: 8px
- Lg: 12px
- Xl: 16px
- Full: 9999px

### 10.2 Component Library

**Base Components:**
- Button (variants: default, outline, ghost, danger)
- Input (text, number, email, password)
- Select (single, multi)
- Checkbox
- Radio
- Switch
- Slider
- DatePicker
- TimePicker

**Layout Components:**
- Card
- Container
- Grid
- Flex
- Stack
- Separator
- ScrollArea

**Data Components:**
- DataTable
- KPICard
- ProgressRing
- Badge
- Avatar
- Skeleton

**Feedback Components:**
- Toast (Sonner)
- Dialog (Radix)
- Alert
- EmptyState
- LoadingState

**Navigation Components:**
- Sidebar
- Topbar
- Breadcrumbs
- Tabs
- Pagination

### 10.3 API Client

```typescript
// web/lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL + '/api/v1',
  timeout: 15000,
  headers: { 'X-App-Version': '1.0.0' },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (token refresh)
apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      useAuthStore.getResponse().setTokens(data.accessToken, data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient.request(error.config);
    }
    useAuthStore.getState().logout();
  }
  return Promise.reject(error);
});
```

### 10.4 State Management

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

---

## 11. Conclusion

This analysis provides a comprehensive roadmap for building the complete CoachingOS UI system. The key insights are:

1. **Headless Architecture is Correct:** The original UIs of Moodle, ERPNext, and BBB are not suitable for a unified SaaS experience. Building custom Next.js components that consume their APIs is the right approach.

2. **Iframe Wrapping for Complex Apps:** BBB and Metabase should be wrapped in iframes rather than rebuilt. This saves months of development while maintaining full functionality.

3. **Vue to Next.js Migration:** The Education module's Vue 3 frontend needs to be migrated to Next.js. This is a straightforward component-by-component migration.

4. **Feature-Flag System:** The platform has a robust feature-flag system that must be respected in all UI components. This ensures proper plan gating (Starter/Growth/Pro).

5. **Three-App Architecture:** The unified Next.js web app with route groups is the correct approach for the Super Admin and Institute/Teacher interfaces. The React Native app is correct for Students/Parents.

6. **Implementation Priority:** Focus on core academic features first (courses, tests, attendance, fees), then management features, then super admin features.

The next steps are to implement the components identified in the priority matrix, starting with Phase 1 (Core Foundation).
