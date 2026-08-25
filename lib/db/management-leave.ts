import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";
import type {
  EmployeeLeaveRequest,
  ManagementLeaveRequest,
  ManagementRequestDetail,
  ManagementScope,
} from "@/types/leave";

type RawManager = {
  role: UserRole;
  department_id: string | null;
};

type RawManagementRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  number_of_days: number | string;
  reason: string;
  status: ManagementLeaveRequest["status"];
  reviewer_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
  employees:
    | {
        id: string;
        employee_number: string;
        first_name: string;
        last_name: string;
        department_id: string;
        position: string;
        departments: { name: string } | { name: string }[];
      }
    | {
        id: string;
        employee_number: string;
        first_name: string;
        last_name: string;
        department_id: string;
        position: string;
        departments: { name: string } | { name: string }[];
      }[];
  leave_types:
    | { id: string; code: string; name: string }
    | { id: string; code: string; name: string }[];
};

type RawPreviousRequest = {
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

function related<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapManagementRequest(request: RawManagementRequest): ManagementLeaveRequest {
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
    position: employee.position,
    leaveTypeId: request.leave_type_id,
    leaveTypeName: leaveType.name,
    leaveTypeCode: leaveType.code,
    startDate: request.start_date,
    endDate: request.end_date,
    numberOfDays: numeric(request.number_of_days),
    reason: request.reason,
    status: request.status,
    reviewerRemarks: request.reviewer_remarks,
    reviewedAt: request.reviewed_at,
    createdAt: request.created_at,
  };
}

export async function getManagementScope(
  userId: string,
  sessionRole: UserRole,
): Promise<ManagementScope | null> {
  if (sessionRole !== "ADMIN" && sessionRole !== "SUPERVISOR") return null;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const result = await supabase
    .from("app_users")
    .select("role, department_id")
    .eq("id", userId)
    .maybeSingle();

  if (result.error || !result.data) return null;
  const manager = result.data as RawManager;
  if (manager.role !== sessionRole) return null;
  if (manager.role !== "ADMIN" && manager.role !== "SUPERVISOR") return null;
  if (manager.role === "SUPERVISOR" && !manager.department_id) return null;

  return {
    role: manager.role,
    departmentId: manager.role === "SUPERVISOR" ? manager.department_id : null,
  };
}

export async function getManagementLeaveRequests(
  userId: string,
  role: UserRole,
): Promise<ManagementLeaveRequest[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const scope = await getManagementScope(userId, role);
  if (!scope) return null;

  let query = supabase
    .from("leave_requests")
    .select(
      "id, employee_id, leave_type_id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, reviewed_at, created_at, employees!inner(id, employee_number, first_name, last_name, department_id, position, departments!inner(name)), leave_types!inner(id, code, name)",
    )
    .order("created_at", { ascending: false });

  if (scope.departmentId) {
    query = query.eq("employees.department_id", scope.departmentId);
  }

  const result = await query;
  if (result.error) throw new Error("Management requests unavailable");

  return (result.data as unknown as RawManagementRequest[]).map(mapManagementRequest);
}

export async function getManagementRequestDetail(
  userId: string,
  role: UserRole,
  requestId: string,
): Promise<ManagementRequestDetail | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const scope = await getManagementScope(userId, role);
  if (!scope) return null;

  let requestQuery = supabase
    .from("leave_requests")
    .select(
      "id, employee_id, leave_type_id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, reviewed_at, created_at, employees!inner(id, employee_number, first_name, last_name, department_id, position, departments!inner(name)), leave_types!inner(id, code, name)",
    )
    .eq("id", requestId);

  if (scope.departmentId) {
    requestQuery = requestQuery.eq("employees.department_id", scope.departmentId);
  }

  const requestResult = await requestQuery.maybeSingle();
  if (requestResult.error || !requestResult.data) return null;

  const request = mapManagementRequest(
    requestResult.data as unknown as RawManagementRequest,
  );
  const balanceYear = Number(request.startDate.slice(0, 4));

  const [balanceResult, previousResult] = await Promise.all([
    supabase
      .from("leave_balances")
      .select("available_days")
      .eq("employee_id", request.employeeId)
      .eq("leave_type_id", request.leaveTypeId)
      .eq("year", balanceYear)
      .maybeSingle(),
    supabase
      .from("leave_requests")
      .select(
        "id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, created_at, leave_types!inner(code, name)",
      )
      .eq("employee_id", request.employeeId)
      .neq("id", request.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (balanceResult.error || previousResult.error) {
    throw new Error("Request review data unavailable");
  }

  const currentBalance = balanceResult.data
    ? Number(balanceResult.data.available_days)
    : null;
  const previousRequests = (previousResult.data as unknown as RawPreviousRequest[]).map(
    (previous): EmployeeLeaveRequest => {
      const leaveType = related(previous.leave_types);
      return {
        id: previous.id,
        leaveTypeName: leaveType.name,
        leaveTypeCode: leaveType.code,
        startDate: previous.start_date,
        endDate: previous.end_date,
        numberOfDays: numeric(previous.number_of_days),
        reason: previous.reason,
        status: previous.status,
        reviewerRemarks: previous.reviewer_remarks,
        createdAt: previous.created_at,
      };
    },
  );

  const balanceBeforeReview =
    currentBalance === null
      ? null
      : request.status === "APPROVED"
        ? currentBalance + request.numberOfDays
        : currentBalance;
  const balanceAfterApproval =
    currentBalance === null
      ? null
      : request.status === "APPROVED"
        ? currentBalance
        : currentBalance - request.numberOfDays;

  return {
    ...request,
    balanceYear,
    currentBalance,
    balanceBeforeReview,
    balanceAfterApproval,
    previousRequests,
  };
}
