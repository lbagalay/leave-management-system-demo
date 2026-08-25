import type { UserRole } from "@/types/auth";

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "RESIGNED";

export type AppUserRecord = {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: UserRole;
  department_id: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DepartmentRecord = {
  id: string;
  name: string;
  created_at: string;
};

export type EmployeeRecord = {
  id: string;
  user_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  department_id: string;
  position: string;
  hire_date: string;
  employment_status: EmploymentStatus;
  created_at: string;
  updated_at: string;
};
