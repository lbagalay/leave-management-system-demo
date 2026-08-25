import "server-only";

import { getManagementLeaveRequests, getManagementScope } from "@/lib/db/management-leave";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";
import type { EmployeeLeaveRequest } from "@/types/leave";
import type { ManagementLeaveRequest } from "@/types/leave";

export type LeaveBalanceSummary = {
  code: "VACATION" | "SICK";
  name: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
};

export type EmployeeDashboardData = {
  balances: LeaveBalanceSummary[];
  pendingRequests: number;
  approvedRequests: number;
  upcomingLeave: number;
  recentRequests: EmployeeLeaveRequest[];
};

export type AdminDashboardData = {
  pendingApprovals: number;
  employeesOnLeave: number;
  totalEmployees: number;
  requestsThisMonth: number;
  pendingRequests: ManagementLeaveRequest[];
};

export type DashboardDataResult<T> = {
  data: T;
  databaseUnavailable: boolean;
};

const EMPLOYEE_DEMO_DATA: EmployeeDashboardData = {
  balances: [
    {
      code: "VACATION",
      name: "Vacation Leave",
      allocatedDays: 15,
      usedDays: 5,
      remainingDays: 10,
    },
    {
      code: "SICK",
      name: "Sick Leave",
      allocatedDays: 10,
      usedDays: 2,
      remainingDays: 8,
    },
  ],
  pendingRequests: 1,
  approvedRequests: 2,
  upcomingLeave: 0,
  recentRequests: [],
};

const ADMIN_DEMO_DATA: AdminDashboardData = {
  pendingApprovals: 3,
  employeesOnLeave: 0,
  totalEmployees: 4,
  requestsThisMonth: 5,
  pendingRequests: [],
};

type RawBalance = {
  allocated_days: number | string;
  used_days: number | string;
  available_days: number | string;
  leave_types:
    | { code: string; name: string }
    | { code: string; name: string }[];
};

type RawDashboardRequest = {
  id: string;
  start_date: string;
  end_date: string;
  number_of_days: number | string;
  reason: string;
  status: EmployeeLeaveRequest["status"];
  reviewer_remarks: string | null;
  created_at: string;
  leave_types:
    | { code: string; name: string }
    | { code: string; name: string }[];
};

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function preparedResult<T>(data: T): DashboardDataResult<T> {
  return { data, databaseUnavailable: false };
}

function unavailableResult<T>(data: T): DashboardDataResult<T> {
  return { data, databaseUnavailable: true };
}

export async function getEmployeeDashboardData(
  userId: string,
): Promise<DashboardDataResult<EmployeeDashboardData>> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return preparedResult(EMPLOYEE_DEMO_DATA);

  try {
    const employeeResult = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const employee = employeeResult.data as { id: string } | null;
    if (employeeResult.error || !employee) throw new Error("Employee profile unavailable");

    const employeeId = employee.id;
    const today = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Manila",
    }).format(new Date());
    const [
      balancesResult,
      pendingResult,
      approvedResult,
      upcomingResult,
      recentResult,
    ] = await Promise.all([
      supabase
        .from("leave_balances")
        .select("allocated_days, used_days, available_days, leave_types!inner(code, name)")
        .eq("employee_id", employeeId)
        .in("leave_types.code", ["VACATION", "SICK"]),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", employeeId)
        .eq("status", "PENDING"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", employeeId)
        .eq("status", "APPROVED"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", employeeId)
        .eq("status", "APPROVED")
        .gte("start_date", today),
      supabase
        .from("leave_requests")
        .select(
          "id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, created_at, leave_types!inner(code, name)",
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (
      balancesResult.error ||
      pendingResult.error ||
      approvedResult.error ||
      upcomingResult.error ||
      recentResult.error
    ) {
      throw new Error("Employee dashboard data unavailable");
    }

    const balances = (balancesResult.data as unknown as RawBalance[])
      .map((balance) => {
        const leaveType = Array.isArray(balance.leave_types)
          ? balance.leave_types[0]
          : balance.leave_types;

        if (!leaveType || !["VACATION", "SICK"].includes(leaveType.code)) return null;

        return {
          code: leaveType.code as LeaveBalanceSummary["code"],
          name: leaveType.name,
          allocatedDays: numeric(balance.allocated_days),
          usedDays: numeric(balance.used_days),
          remainingDays: numeric(balance.available_days),
        };
      })
      .filter((balance): balance is LeaveBalanceSummary => balance !== null)
      .sort((a) => (a.code === "VACATION" ? -1 : 1));

    if (balances.length < 2) throw new Error("Required leave balances unavailable");

    const recentRequests = (recentResult.data as unknown as RawDashboardRequest[]).map(
      (request): EmployeeLeaveRequest => {
        const leaveType = Array.isArray(request.leave_types)
          ? request.leave_types[0]
          : request.leave_types;

        return {
          id: request.id,
          leaveTypeName: leaveType.name,
          leaveTypeCode: leaveType.code,
          startDate: request.start_date,
          endDate: request.end_date,
          numberOfDays: numeric(request.number_of_days),
          reason: request.reason,
          status: request.status,
          reviewerRemarks: request.reviewer_remarks,
          createdAt: request.created_at,
        };
      },
    );

    return preparedResult({
      balances,
      pendingRequests: pendingResult.count ?? 0,
      approvedRequests: approvedResult.count ?? 0,
      upcomingLeave: upcomingResult.count ?? 0,
      recentRequests,
    });
  } catch {
    return unavailableResult(EMPLOYEE_DEMO_DATA);
  }
}

export async function getAdminDashboardData(
  userId: string,
  role: UserRole,
): Promise<
  DashboardDataResult<AdminDashboardData>
> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return preparedResult(ADMIN_DEMO_DATA);

  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date());

  try {
    const scope = await getManagementScope(userId, role);
    const requests = await getManagementLeaveRequests(userId, role);
    if (!scope || !requests) throw new Error("Management scope unavailable");

    let employeesQuery = supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("employment_status", "ACTIVE");

    if (scope.departmentId) {
      employeesQuery = employeesQuery.eq("department_id", scope.departmentId);
    }

    const employeesResult = await employeesQuery;
    if (employeesResult.error) {
      throw new Error("Management dashboard data unavailable");
    }

    const pendingRequests = requests.filter((request) => request.status === "PENDING");
    const employeesOnLeave = new Set(
      requests
        .filter(
          (request) =>
            request.status === "APPROVED" &&
            request.startDate <= today &&
            request.endDate >= today,
        )
        .map((request) => request.employeeId),
    ).size;
    const requestsThisMonth = requests.filter(
      (request) => request.createdAt.slice(0, 7) === today.slice(0, 7),
    ).length;

    return preparedResult({
      pendingApprovals: pendingRequests.length,
      employeesOnLeave,
      totalEmployees: employeesResult.count ?? 0,
      requestsThisMonth,
      pendingRequests: pendingRequests.slice(0, 5),
    });
  } catch {
    return unavailableResult(ADMIN_DEMO_DATA);
  }
}
