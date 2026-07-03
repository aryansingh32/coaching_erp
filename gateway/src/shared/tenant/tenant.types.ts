export type UserRole = 'student' | 'instructor' | 'parent' | 'admin' | 'super_admin';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  tenantId?: string;
  linkedStudents?: string[];
}
