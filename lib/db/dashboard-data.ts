import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
};

export type AdminDashboardData = {
  pendingApprovals: number;
  employeesOnLeave: number;
  totalEmployees: number;
  requestsThisMonth: number;
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
};

const ADMIN_DEMO_DATA: AdminDashboardData = {
  pendingApprovals: 3,
  employeesOnLeave: 0,
  totalEmployees: 4,
  requestsThisMonth: 5,
};

type RawBalance = {
  allocated_days: number | string;
  used_days: number | string;
  remaining_days: number | string;
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
    const [balancesResult, pendingResult, approvedResult] = await Promise.all([
      supabase
        .from("leave_balances")
        .select("allocated_days, used_days, remaining_days, leave_types!inner(code, name)")
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
    ]);

    if (balancesResult.error || pendingResult.error || approvedResult.error) {
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
          remainingDays: numeric(balance.remaining_days),
        };
      })
      .filter((balance): balance is LeaveBalanceSummary => balance !== null)
      .sort((a) => (a.code === "VACATION" ? -1 : 1));

    if (balances.length < 2) throw new Error("Required leave balances unavailable");

    return preparedResult({
      balances,
      pendingRequests: pendingResult.count ?? 0,
      approvedRequests: approvedResult.count ?? 0,
    });
  } catch {
    return unavailableResult(EMPLOYEE_DEMO_DATA);
  }
}

export async function getAdminDashboardData(): Promise<
  DashboardDataResult<AdminDashboardData>
> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return preparedResult(ADMIN_DEMO_DATA);

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01T00:00:00.000Z`;

  try {
    const [employeesResult, pendingResult, onLeaveResult, monthlyResult] = await Promise.all([
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("employment_status", "ACTIVE"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "APPROVED")
        .lte("start_date", today)
        .gte("end_date", today),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart),
    ]);

    if (
      employeesResult.error ||
      pendingResult.error ||
      onLeaveResult.error ||
      monthlyResult.error
    ) {
      throw new Error("Management dashboard data unavailable");
    }

    return preparedResult({
      pendingApprovals: pendingResult.count ?? 0,
      employeesOnLeave: onLeaveResult.count ?? 0,
      totalEmployees: employeesResult.count ?? 0,
      requestsThisMonth: monthlyResult.count ?? 0,
    });
  } catch {
    return unavailableResult(ADMIN_DEMO_DATA);
  }
}
