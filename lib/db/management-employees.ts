import "server-only";

import { getManagementScope } from "@/lib/db/management-leave";
import { currentManilaDate } from "@/lib/leave/dates";
import { formatTenure } from "@/lib/leave/tenure";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";
import type { EmploymentStatus } from "@/types/database";
import type { EmployeeLeaveRequest } from "@/types/leave";
import type {
  EmployeeDirectoryData,
  EmployeeManagementSetup,
  LeaveBalanceAdjustment,
  ManagementEmployeeBalance,
  ManagementEmployeeDetail,
  ManagementEmployeeSummary,
  ManagementLeaveType,
} from "@/types/management";

type RawBalance = {
  leave_type_id: string;
  year: number;
  allocated_days: number | string;
  used_days: number | string;
  adjustment_days: number | string;
  available_days: number | string;
  updated_at: string;
  leave_types: { code: string; name: string } | { code: string; name: string }[];
};

type RawEmployee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  department_id: string;
  position: string;
  hire_date: string;
  employment_status: EmploymentStatus;
  departments: { id: string; name: string } | { id: string; name: string }[];
  app_users: { email: string } | { email: string }[];
  leave_balances: RawBalance[];
};

type RawCurrentLeave = { employee_id: string };
type RawDepartment = { id: string; name: string };
type RawLeaveType = {
  id: string;
  code: string;
  name: string;
  default_days: number | string;
};

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

type RawAdjustment = {
  id: string;
  year: number;
  previous_entitlement: number | string;
  new_entitlement: number | string;
  previous_available: number | string;
  new_available: number | string;
  adjustment: number | string;
  reason: string;
  created_at: string;
  leave_types: { name: string } | { name: string }[];
  app_users: { name: string } | { name: string }[];
};

function related<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
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
    adjustmentDays: numeric(balance.adjustment_days),
    remainingDays: numeric(balance.available_days),
    updatedAt: balance.updated_at,
  };
}

function mapLeaveType(leaveType: RawLeaveType): ManagementLeaveType {
  return {
    id: leaveType.id,
    code: leaveType.code,
    name: leaveType.name,
    defaultDays: numeric(leaveType.default_days),
  };
}

async function getDepartmentsAndLeaveTypes(): Promise<EmployeeManagementSetup | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const [departmentResult, leaveTypeResult] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("leave_types")
      .select("id, code, name, default_days")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (departmentResult.error || leaveTypeResult.error) {
    throw new Error("Employee management setup unavailable");
  }

  return {
    departments: departmentResult.data as RawDepartment[],
    leaveTypes: (leaveTypeResult.data as RawLeaveType[]).map(mapLeaveType),
    balanceYear: Number(currentManilaDate().slice(0, 4)),
    currentDate: currentManilaDate(),
  };
}

export async function getEmployeeManagementSetup(
  userId: string,
): Promise<EmployeeManagementSetup | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const actorResult = await supabase
    .from("app_users")
    .select("id")
    .eq("id", userId)
    .eq("role", "ADMIN")
    .maybeSingle();

  if (actorResult.error || !actorResult.data) return null;
  return getDepartmentsAndLeaveTypes();
}

export async function getManagementEmployeeDirectory(
  userId: string,
  role: UserRole,
): Promise<EmployeeDirectoryData | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const scope = await getManagementScope(userId, role);
  if (!scope) return null;

  const today = currentManilaDate();
  const balanceYear = Number(today.slice(0, 4));
  let employeeQuery = supabase
    .from("employees")
    .select(
      "id, employee_number, first_name, last_name, department_id, position, hire_date, employment_status, departments!inner(id, name), app_users!employees_user_id_fkey(email), leave_balances(leave_type_id, year, allocated_days, used_days, adjustment_days, available_days, updated_at, leave_types!inner(code, name))",
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

  const [employeeResult, currentLeaveResult, setup] = await Promise.all([
    employeeQuery,
    currentLeaveQuery,
    getDepartmentsAndLeaveTypes(),
  ]);

  if (employeeResult.error || currentLeaveResult.error || !setup) {
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
      const appUser = related(employee.app_users);
      const balances = employee.leave_balances
        .filter((balance) => balance.year === balanceYear)
        .map(mapBalance);

      return {
        id: employee.id,
        employeeNumber: employee.employee_number,
        fullName: `${employee.first_name} ${employee.last_name}`,
        email: appUser.email,
        departmentId: employee.department_id,
        departmentName: department.name,
        position: employee.position,
        hireDate: employee.hire_date,
        tenure: formatTenure(employee.hire_date, today),
        employmentStatus: employee.employment_status,
        currentLeaveStatus: onLeave.has(employee.id) ? "ON_LEAVE" : "AVAILABLE",
        vacationBalance:
          balances.find((balance) => balance.code === "VACATION") ?? null,
        sickBalance: balances.find((balance) => balance.code === "SICK") ?? null,
      };
    },
  );
  const departments = scope.departmentId
    ? setup.departments.filter((department) => department.id === scope.departmentId)
    : setup.departments;

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

  const [balanceResult, requestResult, adjustmentResult, leaveTypeResult] =
    await Promise.all([
      supabase
        .from("leave_balances")
        .select(
          "leave_type_id, year, allocated_days, used_days, adjustment_days, available_days, updated_at, leave_types!inner(code, name)",
        )
        .eq("employee_id", employeeId)
        .eq("year", directory.balanceYear),
      supabase
        .from("leave_requests")
        .select(
          "id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, created_at, leave_types!inner(code, name)",
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("leave_balance_adjustments")
        .select(
          "id, year, previous_entitlement, new_entitlement, previous_available, new_available, adjustment, reason, created_at, leave_types!inner(name), app_users!leave_balance_adjustments_updated_by_fkey(name)",
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("leave_types")
        .select("id, code, name, default_days")
        .eq("is_active", true)
        .order("name"),
    ]);

  if (
    balanceResult.error ||
    requestResult.error ||
    adjustmentResult.error ||
    leaveTypeResult.error
  ) {
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
  const adjustments = (
    adjustmentResult.data as unknown as RawAdjustment[]
  ).map((adjustment): LeaveBalanceAdjustment => ({
    id: adjustment.id,
    leaveTypeName: related(adjustment.leave_types).name,
    year: adjustment.year,
    previousEntitlement: numeric(adjustment.previous_entitlement),
    newEntitlement: numeric(adjustment.new_entitlement),
    previousAvailable: numeric(adjustment.previous_available),
    newAvailable: numeric(adjustment.new_available),
    adjustment: numeric(adjustment.adjustment),
    reason: adjustment.reason,
    updatedBy: related(adjustment.app_users).name,
    createdAt: adjustment.created_at,
  }));
  const assignedLeaveTypes = new Set(balances.map((balance) => balance.leaveTypeId));
  const availableLeaveTypes = (leaveTypeResult.data as RawLeaveType[])
    .map(mapLeaveType)
    .filter((leaveType) => !assignedLeaveTypes.has(leaveType.id));

  return {
    ...employee,
    balanceYear: directory.balanceYear,
    balances,
    recentRequests,
    adjustments,
    availableLeaveTypes,
  };
}
