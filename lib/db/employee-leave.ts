import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EmploymentStatus } from "@/types/database";
import type {
  EmployeeLeaveBalance,
  EmployeeLeaveRequest,
  LeaveFormData,
  LeaveTypeOption,
} from "@/types/leave";

type EmployeeIdentity = { id: string };
type RawLeaveType = { id: string; code: string; name: string; description: string };
type RawBalance = {
  leave_type_id: string;
  year: number;
  allocated_days: number | string;
  used_days: number | string;
  available_days: number | string;
  leave_types: { code: string; name: string } | { code: string; name: string }[];
};
type RawRequest = {
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

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function related<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getEmployeeIdentity(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const result = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .eq("employment_status", "ACTIVE")
    .maybeSingle();

  if (result.error) throw new Error("Employee profile unavailable");
  return result.data as EmployeeIdentity | null;
}

async function getEmployeeRecordIdentity(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const result = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) throw new Error("Employee profile unavailable");
  return result.data as EmployeeIdentity | null;
}

export async function getEmployeeEmploymentStatus(
  userId: string,
): Promise<EmploymentStatus | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const result = await supabase
    .from("employees")
    .select("employment_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) throw new Error("Employee profile unavailable");
  return (result.data?.employment_status as EmploymentStatus | undefined) ?? null;
}

export async function getLeaveFormData(
  userId: string,
  year: number,
): Promise<LeaveFormData | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const employee = await getEmployeeIdentity(userId);
  if (!employee) return null;

  const [typesResult, balancesResult] = await Promise.all([
    supabase
      .from("leave_types")
      .select("id, code, name, description")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("leave_balances")
      .select(
        "leave_type_id, year, allocated_days, used_days, available_days, leave_types!inner(code, name)",
      )
      .eq("employee_id", employee.id)
      .eq("year", year),
  ]);

  if (typesResult.error || balancesResult.error) {
    throw new Error("Leave setup unavailable");
  }

  const leaveTypes = (typesResult.data as RawLeaveType[]).map(
    (leaveType): LeaveTypeOption => ({
      id: leaveType.id,
      code: leaveType.code,
      name: leaveType.name,
      description: leaveType.description,
    }),
  );

  const balances = (balancesResult.data as unknown as RawBalance[]).map(
    (balance): EmployeeLeaveBalance => {
      const leaveType = related(balance.leave_types);
      return {
        leaveTypeId: balance.leave_type_id,
        code: leaveType.code,
        name: leaveType.name,
        allocatedDays: numeric(balance.allocated_days),
        usedDays: numeric(balance.used_days),
        remainingDays: numeric(balance.available_days),
        year: balance.year,
      };
    },
  );

  return { leaveTypes, balances, year };
}

export async function getEmployeeLeaveRequests(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const employee = await getEmployeeRecordIdentity(userId);
  if (!employee) return null;

  const result = await supabase
    .from("leave_requests")
    .select(
      "id, start_date, end_date, number_of_days, reason, status, reviewer_remarks, created_at, leave_types!inner(code, name)",
    )
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  if (result.error) throw new Error("Leave requests unavailable");

  return (result.data as unknown as RawRequest[]).map(
    (request): EmployeeLeaveRequest => {
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
    },
  );
}
