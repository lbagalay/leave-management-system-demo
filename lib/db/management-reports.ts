import "server-only";

import { getManagementEmployeeDirectory } from "@/lib/db/management-employees";
import { getManagementScope } from "@/lib/db/management-leave";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";
import type { LeaveRequestStatus } from "@/types/database";
import {
  REPORT_RANGES,
  type DepartmentLeaveUsage,
  type EmployeeLeaveUsage,
  type ManagementReport,
  type ReportPeriod,
  type ReportRange,
  type ReportRequest,
} from "@/types/management";

type RawReportRequest = {
  id: string;
  employee_id: string;
  number_of_days: number | string;
  status: LeaveRequestStatus;
  created_at: string;
  employees:
    | {
        employee_number: string;
        first_name: string;
        last_name: string;
        department_id: string;
        departments: { id: string; name: string } | { id: string; name: string }[];
      }
    | {
        employee_number: string;
        first_name: string;
        last_name: string;
        department_id: string;
        departments: { id: string; name: string } | { id: string; name: string }[];
      }[];
  leave_types: { code: string; name: string } | { code: string; name: string }[];
};

function related<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function monthBoundary(year: number, month: number, offset: number) {
  const boundary = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${boundary.getUTCFullYear()}-${pad(boundary.getUTCMonth() + 1)}-01T00:00:00+08:00`;
}

export function parseReportRange(value: string | null | undefined): ReportRange {
  const normalized = value?.toUpperCase();
  return REPORT_RANGES.includes(normalized as ReportRange)
    ? (normalized as ReportRange)
    : "THIS_MONTH";
}

export function getReportPeriod(
  range: ReportRange,
  now = new Date(),
): ReportPeriod {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    timeZone: "Asia/Manila",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  if (range === "LAST_MONTH") {
    const startIso = monthBoundary(year, month, -1);
    const endIso = monthBoundary(year, month, 0);
    const start = new Date(startIso);
    return {
      range,
      label: new Intl.DateTimeFormat("en-PH", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).format(start),
      startIso,
      endIso,
      filenameLabel: startIso.slice(0, 7),
    };
  }

  if (range === "THIS_YEAR") {
    return {
      range,
      label: String(year),
      startIso: `${year}-01-01T00:00:00+08:00`,
      endIso: `${year + 1}-01-01T00:00:00+08:00`,
      filenameLabel: String(year),
    };
  }

  const startIso = monthBoundary(year, month, 0);
  return {
    range,
    label: new Intl.DateTimeFormat("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(now),
    startIso,
    endIso: monthBoundary(year, month, 1),
    filenameLabel: startIso.slice(0, 7),
  };
}

export async function getManagementReport(
  userId: string,
  role: UserRole,
  range: ReportRange,
): Promise<ManagementReport | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const [scope, directory] = await Promise.all([
    getManagementScope(userId, role),
    getManagementEmployeeDirectory(userId, role),
  ]);
  if (!scope || !directory) return null;

  const period = getReportPeriod(range);
  let requestQuery = supabase
    .from("leave_requests")
    .select(
      "id, employee_id, number_of_days, status, created_at, employees!inner(employee_number, first_name, last_name, department_id, departments!inner(id, name)), leave_types!inner(code, name)",
    )
    .gte("created_at", period.startIso)
    .lt("created_at", period.endIso)
    .order("created_at", { ascending: false });

  if (scope.departmentId) {
    requestQuery = requestQuery.eq("employees.department_id", scope.departmentId);
  }

  const requestResult = await requestQuery;
  if (requestResult.error) throw new Error("Reports unavailable");

  const requests = (requestResult.data as unknown as RawReportRequest[]).map(
    (request): ReportRequest => {
      const employee = related(request.employees);
      const department = related(employee.departments);
      const leaveType = related(request.leave_types);
      return {
        id: request.id,
        employeeId: request.employee_id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        employeeNumber: employee.employee_number,
        departmentId: employee.department_id,
        departmentName: department.name,
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        numberOfDays: numeric(request.number_of_days),
        status: request.status,
        createdAt: request.created_at,
      };
    },
  );

  const employeeUsageMap = new Map<string, EmployeeLeaveUsage>(
    directory.employees.map((employee) => [
      employee.id,
      {
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        employeeName: employee.fullName,
        departmentName: employee.departmentName,
        vacationUsed: 0,
        sickUsed: 0,
        totalDaysUsed: 0,
      },
    ]),
  );
  const departmentUsageMap = new Map<string, DepartmentLeaveUsage>(
    directory.departments.map((department) => [
      department.id,
      {
        departmentId: department.id,
        departmentName: department.name,
        totalRequests: 0,
        approvedDaysUsed: 0,
      },
    ]),
  );

  for (const request of requests) {
    const departmentUsage = departmentUsageMap.get(request.departmentId);
    if (departmentUsage) {
      departmentUsage.totalRequests += 1;
      if (request.status === "APPROVED") {
        departmentUsage.approvedDaysUsed += request.numberOfDays;
      }
    }

    if (request.status !== "APPROVED") continue;
    const employeeUsage = employeeUsageMap.get(request.employeeId);
    if (!employeeUsage) continue;
    employeeUsage.totalDaysUsed += request.numberOfDays;
    if (request.leaveTypeCode === "VACATION") {
      employeeUsage.vacationUsed += request.numberOfDays;
    }
    if (request.leaveTypeCode === "SICK") {
      employeeUsage.sickUsed += request.numberOfDays;
    }
  }

  const approvedRequests = requests.filter(
    (request) => request.status === "APPROVED",
  );

  return {
    period,
    requestsThisPeriod: requests.length,
    approvedRequests: approvedRequests.length,
    rejectedRequests: requests.filter((request) => request.status === "REJECTED")
      .length,
    approvedLeaveDaysUsed: approvedRequests.reduce(
      (total, request) => total + request.numberOfDays,
      0,
    ),
    employeeUsage: Array.from(employeeUsageMap.values()).sort(
      (a, b) => b.totalDaysUsed - a.totalDaysUsed || a.employeeName.localeCompare(b.employeeName),
    ),
    departmentUsage: Array.from(departmentUsageMap.values()).sort(
      (a, b) => b.approvedDaysUsed - a.approvedDaysUsed || a.departmentName.localeCompare(b.departmentName),
    ),
  };
}
