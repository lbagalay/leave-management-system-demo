import "server-only";

import { getManagementScope } from "@/lib/db/management-leave";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";
import type { EmploymentStatus } from "@/types/database";
import type { EmployeeLeaveRequest } from "@/types/leave";
import type {
  EmployeeDirectoryData,
  ManagementEmployeeBalance,
  ManagementEmployeeDetail,
  ManagementEmployeeSummary,
} from "@/types/management";

type RawBalance = {
  leave_type_id: string;
  year: number;
  allocated_days: number | string;
  used_days: number | string;
  remaining_days: number | string;
  leave_types: { code: string; name: string } | { code: string; name: string }[];
};

type RawEmployee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  department_id: string;
  position: string;
  employment_status: EmploymentStatus;
  departments: { id: string; name: string } | { id: string; name: string }[];
  leave_balances: RawBalance[];
};

type RawCurrentLeave = { employee_id: string };

type RawEmployeeRequest = {
  id: string;
  start_date: string;
  end_date: string;
  number_of_days: number | string;
  reason: string;
  status: EmployeeLeaveRequest["status"];
  reviewer_remarks: string | null;
  created_at: string;
  leave_types: { code: string; name: string } | { code: string; name: string }[];
};

function related<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date());
}

function mapBalance(balance: RawBalance): ManagementEmployeeBalance {
  const leaveType = related(balance.leave_types);
  return {
    leaveTypeId: balance.leave_type_id,
    code: leaveType.code,
    name: leaveType.name,
    year: balance.year,
    allocatedDays: numeric(balance.allocated_days),
    usedDays: numeric(balance.used_days),
    remainingDays: numeric(balance.remaining_days),
  };
}

export async function getManagementEmployeeDirectory(
  userId: string,
  role: UserRole,
): Promise<EmployeeDirectoryData | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const scope = await getManagementScope(userId, role);
  if (!scope) return null;

  const today = manilaToday();
  const balanceYear = Number(today.slice(0, 4));
  let employeeQuery = supabase
    .from("employees")
    .select(
      "id, employee_number, first_name, last_name, department_id, position, employment_status, departments!inner(id, name), leave_balances(leave_type_id, year, allocated_days, used_days, remaining_days, leave_types!inner(code, name))",
    )
    .order("employee_number", { ascending: true });

  let currentLeaveQuery = supabase
    .from("leave_requests")
    .select("employee_id, employees!inner(department_id)")
    .eq("status", "APPROVED")
    .lte("start_date", today)
    .gte("end_date", today);

  if (scope.departmentId) {
    employeeQuery = employeeQuery.eq("department_id", scope.departmentId);
    currentLeaveQuery = currentLeaveQuery.eq(
      "employees.department_id",
      scope.departmentId,
    );
  }

  const [employeeResult, currentLeaveResult] = await Promise.all([
    employeeQuery,
    currentLeaveQuery,
  ]);

  if (employeeResult.error || currentLeaveResult.error) {
    throw new Error("Employee directory unavailable");
  }

  const onLeave = new Set(
    (currentLeaveResult.data as unknown as RawCurrentLeave[]).map(
      (request) => request.employee_id,
    ),
  );
  const employees = (employeeResult.data as unknown as RawEmployee[]).map(
    (employee): ManagementEmployeeSummary => {
      const department = related(employee.departments);
      const balances = employee.leave_balances
        .filter((balance) => balance.year === balanceYear)
        .map(mapBalance);

      return {
        id: employee.id,
        employeeNumber: employee.employee_number,
        fullName: `${employee.first_name} ${employee.last_name}`,
        departmentId: employee.department_id,
        departmentName: department.name,
        position: employee.position,
        employmentStatus: employee.employment_status,
        currentLeaveStatus: onLeave.has(employee.id) ? "ON_LEAVE" : "AVAILABLE",
        vacationBalance:
          balances.find((balance) => balance.code === "VACATION") ?? null,
        sickBalance: balances.find((balance) => balance.code === "SICK") ?? null,
      };
    },
  );
  const departments = Array.from(
    new Map(
      employees.map((employee) => [
        employee.departmentId,
        { id: employee.departmentId, name: employee.departmentName },
      ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return { employees, departments, balanceYear };
}

export async function getManagementEmployeeDetail(
  userId: string,
  role: UserRole,
  employeeId: string,
): Promise<ManagementEmployeeDetail | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const directory = await getManagementEmployeeDirectory(userId, role);
  const employee = directory?.employees.find((item) => item.id === employeeId);
  if (!directory || !employee) return null;

  const [balanceResult, requestResult] = await Promise.all([
    supabase
      .from("leave_balances")
      .select(
        "leave_type_id, year, allocated_days, used_days, remaining_days, leave_types!inner(code, name)",
      )
      .eq("employee_id", employeeId)
      .eq("year", directory.balanceYear),
    supabase
      .from("leave_requests")
      .select(
        "id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, created_at, leave_types!inner(code, name)",
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (balanceResult.error || requestResult.error) {
    throw new Error("Employee details unavailable");
  }

  const balances = (balanceResult.data as unknown as RawBalance[])
    .map(mapBalance)
    .sort((a, b) => {
      const priority = (code: string) =>
        code === "VACATION" ? 0 : code === "SICK" ? 1 : 2;
      return priority(a.code) - priority(b.code) || a.name.localeCompare(b.name);
    });
  const recentRequests = (
    requestResult.data as unknown as RawEmployeeRequest[]
  ).map((request): EmployeeLeaveRequest => {
    const leaveType = related(request.leave_types);
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
  });

  return { ...employee, balances, recentRequests };
}
