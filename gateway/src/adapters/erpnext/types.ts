export interface ErpStudent {
  name: string;
  first_name: string;
  last_name?: string;
  student_email_id?: string;
  student_mobile_number?: string;
  custom_moodle_id?: number | string;
  custom_novu_subscriber_id?: string;
  custom_fcm_token?: string;
}

export interface ErpStudentGroup {
  name: string;
  student_group_name: string;
  program: string;
  academic_term: string;
  academic_year: string;
}

export interface ErpGuardian {
  name: string;
  guardian_name: string;
  email_address?: string;
  mobile_number?: string;
}

export interface ErpProgramEnrollment {
  name: string;
  student: string;
  program: string;
  academic_term?: string;
  academic_year?: string;
}

export interface ErpAssessmentResult {
  student: string;
  assessment_plan: string;
  student_group?: string;
  course?: string;
  total_score: number;
  maximum_score: number;
  score?: number;
  custom_rank?: number;
  custom_percentile?: number;
}
