// gateway/src/shared/events/event-types.ts
// Single source of truth for all domain event names and payload types
// Used by gateway, all workers, and analytics

// ─── Event Name Constants ─────────────────────────────────────────
export const EVENTS = {
  // Students
  STUDENT_CREATED: 'student.created',
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_PROFILE_UPDATED: 'student.profile.updated',

  // Batches
  BATCH_CREATED: 'batch.created',
  BATCH_SCHEDULE_UPDATED: 'batch.schedule.updated',
  BATCH_UPDATED: 'batch.updated',

  // Attendance
  RFID_PUNCH: 'attendance.rfid_punch',
  ATTENDANCE_MARKED: 'attendance.marked',
  STUDENT_ABSENT: 'attendance.student_absent',

  // Fees
  FEE_PAYMENT_INITIATED: 'fee.payment.initiated',
  FEE_PAYMENT_CONFIRMED: 'fee.payment.confirmed',
  FEE_OVERDUE: 'fee.overdue',

  // LMS
  CONTENT_UPLOADED: 'lms.content.uploaded',
  VIDEO_PROCESSING_DONE: 'lms.video.ready',
  TEST_SUBMITTED: 'lms.test.submitted',
  RESULTS_PUBLISHED: 'lms.results.published',

  // Live Class
  CLASS_SCHEDULED: 'class.scheduled',
  CLASS_STARTED: 'class.started',
  CLASS_RECORDING_READY: 'class.recording.ready',

  // Institute
  INSTITUTE_PROVISIONED: 'institute.provisioned',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

// ─── NATS JetStream Stream Definitions ────────────────────────────
export const NATS_STREAMS = {
  STUDENT_EVENTS: {
    name: 'STUDENT_EVENTS',
    subjects: ['student.>'],
  },
  BATCH_EVENTS: {
    name: 'BATCH_EVENTS',
    subjects: ['batch.>'],
  },
  ATTENDANCE: {
    name: 'ATTENDANCE',
    subjects: ['attendance.>'],
  },
  FEE_EVENTS: {
    name: 'FEE_EVENTS',
    subjects: ['fee.>'],
  },
  LMS_EVENTS: {
    name: 'LMS_EVENTS',
    subjects: ['lms.>'],
  },
  CLASS_EVENTS: {
    name: 'CLASS_EVENTS',
    subjects: ['class.>'],
  },
  INSTITUTE_EVENTS: {
    name: 'INSTITUTE_EVENTS',
    subjects: ['institute.>'],
  },
} as const;

// ─── Domain Event Interface ───────────────────────────────────────
export interface DomainEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: string;
  instituteId: string;
  eventId?: string; // UUID for idempotency
}

// ─── Event Payload Types ──────────────────────────────────────────
export interface StudentCreatedPayload {
  erpStudentName: string;
  studentName: string;
  phone: string;
  email?: string;
  parentPhone?: string;
  parentName?: string;
  instituteId: string;
}

export interface StudentEnrolledPayload {
  erpStudentName: string;
  studentGroupName: string;
  programName: string;
  instituteId: string;
}

export interface BatchCreatedPayload {
  studentGroupName: string;
  programName: string;
  batchName: string;
  instituteId: string;
  instituteSlug: string;
  moodleCategoryId: number;
}

export interface RfidPunchPayload {
  cardUid: string;
  erpStudentId: string;
  studentName: string;
  instituteId: string;
  studentGroupName: string;
  deviceId: string;
  punchTime: string;
  type: 'entry' | 'exit';
}

export interface AttendanceMarkedPayload {
  erpStudentName: string;
  studentGroupName: string;
  courseName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day';
  instituteId: string;
  source: 'rfid' | 'manual' | 'online';
}

export interface FeePaymentConfirmedPayload {
  erpStudentName: string;
  razorpayPaymentId: string;
  amount: number;
  mode: string;
  instituteId: string;
}

export interface TestSubmittedPayload {
  erpStudentName: string;
  assessmentPlanName: string;
  studentGroupName: string;
  score: number;
  rank?: number;
  percentile?: number;
  timeTakenSec: number;
  instituteId: string;
}

export interface ClassScheduledPayload {
  meetingId: string;
  batchName: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  instituteId: string;
}

export interface InstituteProvisionedPayload {
  instituteId: string;
  slug: string;
  plan: string;
}
