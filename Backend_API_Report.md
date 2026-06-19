# CoachingOS: Backend API Report (BFF Layer)

This document provides a comprehensive map of the CoachingOS Backend-For-Frontend (BFF) API layer located in the `gateway` module. 

**Purpose:** This report is designed to be fed into an AI assistant alongside the `CoachingOS_UI_UX_Plan.md` file to properly instruct the AI on how to bind the Next.js frontend to the backend services.

---

## 1. Architecture Overview

The CoachingOS ecosystem is powered by 8 underlying microservices/monoliths (ERPNext, Moodle, BBB, ClickHouse, Novu, etc.) which expose over 1000+ endpoints. 

**Crucially, the frontend (Next.js & React Native) must NEVER interact with these 1000+ endpoints directly.**

Instead, the frontend communicates *exclusively* with the NestJS Gateway (`gateway/src/modules`). This gateway acts as a BFF (Backend-for-Frontend), orchestrating complex operations across the microservices and exposing exactly **33 streamlined REST APIs**.

---

## 2. The 33 Frontend-Facing APIs

Below is the exhaustive list of the available endpoints exposed by the NestJS Gateway. When building the Next.js frontend features, only these endpoints should be used.

### A. Authentication Module (`/api/v1/auth`)
Handles unified login across all platforms.
*   `POST /auth/send-otp` - Initiates passwordless login via phone/email (triggers Novu).
*   `POST /auth/verify-otp` - Validates OTP and returns JWT tokens.
*   `POST /auth/refresh` - Refreshes the JWT token.
*   `POST /auth/logout` - Invalidates the current session.

### B. Students Module (`/api/v1/students`)
Aggregates student data from ERPNext (profile) and Moodle (progress).
*   `GET /students` - List students (paginated, for Admin/Institute panels).
*   `POST /students` - Create a new student profile (syncs to ERPNext & Moodle).
*   `GET /students/:erpId` - Fetch complete student profile and current active batches.
*   `PUT /students/:erpId` - Update student information.
*   `POST /students/bulk-import` - Upload CSV for mass student onboarding.
*   `POST /students/:erpId/rfid-card` - Assign or replace an RFID card.
*   `GET /students/:erpId/timeline` - Get activity feed (for Parent App).

### C. Batches & Courses Module (`/api/v1/batches`)
Orchestrates classroom scheduling (ERPNext) and LMS content (Moodle).
*   `GET /batches` - List all active batches for an institute.
*   `POST /batches` - Create a new batch/course.
*   `GET /batches/:id` - Get batch details, enrolled students, and assigned Moodle course ID.
*   `POST /batches/:id/enroll` - Enroll a student (creates ERP invoice + Moodle enrollment).
*   `POST /batches/:id/schedule` - Add an upcoming class (syncs to ERPNext calendar).
*   `POST /batches/:id/instructors` - Assign teachers to a batch.

### D. Attendance Module (`/api/v1/attendance`)
Processes raw attendance data into ERPNext.
*   `POST /attendance/rfid-punch` - Webhook receiver for the hardware RFID service.
*   `POST /attendance/manual` - Called by the Teacher App to mark attendance manually.
*   `GET /attendance/reports` - Fetch attendance analytics for a batch or student.

### E. Fees & Payments Module (`/api/v1/fees`)
Manages financial transactions with ERPNext ledgers and Razorpay.
*   `GET /fees/pending/:studentId` - Retrieve outstanding fees for a student.
*   `POST /fees/schedule` - Generate fee schedules/invoices for a batch.
*   `POST /fees/payment` - Initiate a payment (returns Razorpay order ID).
*   `POST /fees/webhook/razorpay` - Razorpay secure webhook to mark invoices as paid.

### F. Tenants Module (`/api/v1/tenants`)
Used exclusively by the Super Admin Panel for B2B SaaS management.
*   `GET /tenants` - List all registered coaching institutes.
*   `POST /tenants` - Provision a new institute (creates Frappe company + Moodle category).
*   `GET /tenants/:id` - Get tenant details and active feature flags.
*   `PUT /tenants/:id` - Update tenant configurations.
*   `DELETE /tenants/:id` - Deactivate a tenant.

### G. Analytics Module (`/api/v1/analytics`)
Direct proxy to ClickHouse for high-performance dashboard rendering.
*   `GET /analytics/kpis` - Get top-level global KPIs (Super Admin).
*   `GET /analytics/dashboard/:id` - Get specific dashboard data (Institute/Teacher metrics).

### H. Health Module (`/api/v1/health`)
Infrastructure monitoring.
*   `GET /health` - Basic liveness probe.
*   `GET /health/ready` - Deep readiness probe (checks connection to ERPNext, Moodle, Redis, etc.).

---

## 3. Frontend Integration Guidelines for AI

When generating Next.js components and React Native screens:

1.  **API Client:** Create a central `apiClient` using Axios configured with the base URL of the Gateway.
2.  **Authentication:** Attach the JWT token received from `POST /auth/verify-otp` as a Bearer token in the `Authorization` header for all subsequent requests.
3.  **Role-Based Access (RBAC):** 
    *   `students` and `parents` should only hit their specific parameterized endpoints (e.g., `/students/:erpId`).
    *   `instructors` can hit `/batches/:id` and `/attendance/manual`.
    *   `admins` can hit list endpoints like `/students` and `/fees/schedule`.
    *   `superadmins` exclusively use `/tenants` and `/analytics`.
4.  **Error Handling:** Expect standard HTTP status codes from the Gateway. Validation errors will return `400 Bad Request` with an array of error messages.

**Proceed with building the Next.js UI matching these 33 endpoints as defined in the `CoachingOS_UI_UX_Plan.md`.**
