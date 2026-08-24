import type { LeaveRequestStatus } from "@/types/database";
import type { UserRole } from "@/types/auth";

export type LeaveTypeOption = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export type EmployeeLeaveBalance = {
  leaveTypeId: string;
  code: string;
  name: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
};

export type EmployeeLeaveRequest = {
  id: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewerRemarks: string | null;
  createdAt: string;
};

export type LeaveFormData = {
  leaveTypes: LeaveTypeOption[];
  balances: EmployeeLeaveBalance[];
  year: number;
};

export type LeaveRequestActionState = {
  message: string;
  fieldErrors?: Partial<
    Record<"leaveTypeId" | "startDate" | "endDate" | "reason", string[]>
  >;
  values?: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
};

export type CancelRequestActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type ManagementLeaveRequest = EmployeeLeaveRequest & {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;
  position: string;
  leaveTypeId: string;
  reviewedAt: string | null;
};

export type ManagementRequestDetail = ManagementLeaveRequest & {
  balanceYear: number;
  currentBalance: number | null;
  balanceBeforeReview: number | null;
  balanceAfterApproval: number | null;
  previousRequests: EmployeeLeaveRequest[];
};

export type ManagementScope = {
  role: Extract<UserRole, "ADMIN" | "SUPERVISOR">;
  departmentId: string | null;
};

export type ReviewRequestActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: { remarks?: string[] };
};
