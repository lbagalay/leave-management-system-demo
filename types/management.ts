import type { EmploymentStatus, LeaveRequestStatus } from "@/types/database";
import type { EmployeeLeaveRequest } from "@/types/leave";

export type ManagementEmployeeBalance = {
  leaveTypeId: string;
  code: string;
  name: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
};

export type ManagementEmployeeSummary = {
  id: string;
  employeeNumber: string;
  fullName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentStatus: EmploymentStatus;
  currentLeaveStatus: "AVAILABLE" | "ON_LEAVE";
  vacationBalance: ManagementEmployeeBalance | null;
  sickBalance: ManagementEmployeeBalance | null;
};

export type ManagementEmployeeDetail = ManagementEmployeeSummary & {
  balances: ManagementEmployeeBalance[];
  recentRequests: EmployeeLeaveRequest[];
};

export type EmployeeDirectoryData = {
  employees: ManagementEmployeeSummary[];
  departments: { id: string; name: string }[];
  balanceYear: number;
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
