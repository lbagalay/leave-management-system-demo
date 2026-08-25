import type { EmploymentStatus, LeaveRequestStatus } from "@/types/database";
import type { EmployeeLeaveRequest } from "@/types/leave";

export type ManagementEmployeeBalance = {
  leaveTypeId: string;
  code: string;
  name: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  adjustmentDays: number;
  remainingDays: number;
  updatedAt: string;
};

export type ManagementLeaveType = {
  id: string;
  code: string;
  name: string;
  defaultDays: number;
};

export type LeaveBalanceAdjustment = {
  id: string;
  leaveTypeName: string;
  year: number;
  previousEntitlement: number;
  newEntitlement: number;
  previousAvailable: number;
  newAvailable: number;
  adjustment: number;
  reason: string;
  updatedBy: string;
  createdAt: string;
};

export type ManagementEmployeeSummary = {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string;
  hireDate: string;
  tenure: string;
  employmentStatus: EmploymentStatus;
  currentLeaveStatus: "AVAILABLE" | "ON_LEAVE";
  vacationBalance: ManagementEmployeeBalance | null;
  sickBalance: ManagementEmployeeBalance | null;
};

export type ManagementEmployeeDetail = ManagementEmployeeSummary & {
  balanceYear: number;
  balances: ManagementEmployeeBalance[];
  recentRequests: EmployeeLeaveRequest[];
  adjustments: LeaveBalanceAdjustment[];
  availableLeaveTypes: ManagementLeaveType[];
};

export type EmployeeDirectoryData = {
  employees: ManagementEmployeeSummary[];
  departments: { id: string; name: string }[];
  balanceYear: number;
};

export type EmployeeManagementSetup = {
  departments: { id: string; name: string }[];
  leaveTypes: ManagementLeaveType[];
  balanceYear: number;
  currentDate: string;
};

export type EmployeeManagementActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type BalanceAdjustmentActionState = EmployeeManagementActionState & {
  fieldErrors?: Partial<Record<"entitlement" | "available" | "reason", string[]>>;
  values?: { entitlement: string; available: string; reason: string };
};

export type CreateEmployeeActionState = EmployeeManagementActionState & {
  fieldErrors?: Partial<
    Record<
      | "employeeNumber"
      | "firstName"
      | "lastName"
      | "email"
      | "departmentId"
      | "position"
      | "hireDate"
      | "employmentStatus"
      | "balances",
      string[]
    >
  >;
  values?: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string;
    position: string;
    hireDate: string;
    employmentStatus: string;
    balances: Record<string, { entitlement: string; available: string }>;
  };
};

export const REPORT_RANGES = ["THIS_MONTH", "LAST_MONTH", "THIS_YEAR"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export type ReportPeriod = {
  range: ReportRange;
  label: string;
  startIso: string;
  endIso: string;
  filenameLabel: string;
};

export type ReportRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  numberOfDays: number;
  status: LeaveRequestStatus;
  createdAt: string;
};

export type EmployeeLeaveUsage = {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  departmentName: string;
  vacationUsed: number;
  sickUsed: number;
  totalDaysUsed: number;
};

export type DepartmentLeaveUsage = {
  departmentId: string;
  departmentName: string;
  totalRequests: number;
  approvedDaysUsed: number;
};

export type ManagementReport = {
  period: ReportPeriod;
  requestsThisPeriod: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvedLeaveDaysUsed: number;
  employeeUsage: EmployeeLeaveUsage[];
  departmentUsage: DepartmentLeaveUsage[];
};
