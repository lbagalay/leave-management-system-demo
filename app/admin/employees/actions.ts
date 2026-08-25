"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeManagementSetup } from "@/lib/db/management-employees";
import { currentManilaDate, parseIsoDate } from "@/lib/leave/dates";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EmploymentStatus } from "@/types/database";
import type {
  BalanceAdjustmentActionState,
  CreateEmployeeActionState,
  EmployeeManagementActionState,
} from "@/types/management";

const employeeIdSchema = z.string().uuid();
const leaveTypeIdSchema = z.string().uuid();
const yearSchema = z.number().int().min(2000).max(2100);
const dateSchema = z
  .string()
  .min(1, "Select a hire date.")
  .refine((value) => Boolean(parseIsoDate(value)), "Enter a valid hire date.")
  .refine(
    (value) => value <= currentManilaDate(),
    "Hire date cannot be in the future.",
  );
const nonnegativeDaysSchema = z
  .string()
  .trim()
  .min(1, "Enter a number of days.")
  .refine((value) => Number.isFinite(Number(value)), "Enter a valid number.")
  .refine((value) => Number(value) >= 0, "Days cannot be negative.")
  .refine(
    (value) => Math.round(Number(value) * 2) === Number(value) * 2,
    "Use whole or half days only.",
  );

const employeeSchema = z.object({
  employeeNumber: z.string().trim().min(2, "Employee ID is required.").max(40),
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  departmentId: z.string().uuid("Select a department."),
  position: z.string().trim().min(2, "Position is required.").max(120),
  hireDate: dateSchema,
  employmentStatus: z.enum(["ACTIVE", "INACTIVE", "RESIGNED"]),
});

const balanceSchema = z.object({
  entitlement: nonnegativeDaysSchema,
  available: nonnegativeDaysSchema,
  reason: z
    .string()
    .trim()
    .min(3, "Add a reason with at least 3 characters.")
    .max(500, "Reason must be 500 characters or fewer."),
});

type CreateEmployeeRpcRow = { outcome: string; created_employee_id: string | null };
type AdjustBalanceRpcRow = { outcome: string; updated_balance_id: string | null };

function creationOutcomeMessage(outcome: string) {
  const messages: Record<string, string> = {
    UNAUTHORIZED: "You are not authorized to add employees.",
    INVALID_INPUT: "Review the employee details and leave balances.",
    DEPARTMENT_NOT_FOUND: "Select an available department.",
    DUPLICATE_EMAIL: "An employee record already uses this email address.",
    DUPLICATE_EMPLOYEE_NUMBER: "An employee record already uses this employee ID.",
    DUPLICATE_IDENTITY: "This employee ID or email is already in use.",
    LEAVE_TYPE_NOT_FOUND: "One of the selected leave types is unavailable.",
  };
  return messages[outcome] ?? "We could not add this employee. Please try again.";
}

function adjustmentOutcomeMessage(outcome: string) {
  const messages: Record<string, string> = {
    UNAUTHORIZED: "You are not authorized to edit leave balances.",
    INVALID_INPUT:
      "Review the entitlement, available balance, and adjustment reason.",
    EMPLOYEE_NOT_FOUND: "This employee record could not be found.",
    LEAVE_TYPE_NOT_FOUND: "This leave type is no longer available.",
  };
  return messages[outcome] ?? "We could not update this leave balance.";
}

export async function createEmployeeAction(
  _previousState: CreateEmployeeActionState,
  formData: FormData,
): Promise<CreateEmployeeActionState> {
  void _previousState;
  const user = await requireUser(["ADMIN"]);
  const values: NonNullable<CreateEmployeeActionState["values"]> = {
    employeeNumber: String(formData.get("employeeNumber") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    position: String(formData.get("position") ?? ""),
    hireDate: String(formData.get("hireDate") ?? ""),
    employmentStatus: String(formData.get("employmentStatus") ?? "ACTIVE"),
    balances: {},
  };
  const employeeValidation = employeeSchema.safeParse(values);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Employee creation is temporarily unavailable.",
      values,
    };
  }

  let setup;
  try {
    setup = await getEmployeeManagementSetup(user.id);
  } catch {
    setup = null;
  }
  if (!setup) {
    return {
      status: "error",
      message: "Employee setup could not be loaded safely.",
      values,
    };
  }

  const balanceErrors: string[] = [];
  const balances = setup.leaveTypes.map((leaveType) => {
    const entitlement = String(
      formData.get(`entitlement:${leaveType.id}`) ?? "",
    );
    const available = String(formData.get(`available:${leaveType.id}`) ?? "");
    values.balances[leaveType.id] = { entitlement, available };
    const parsed = z
      .object({ entitlement: nonnegativeDaysSchema, available: nonnegativeDaysSchema })
      .safeParse({ entitlement, available });
    if (!parsed.success) {
      balanceErrors.push(`${leaveType.name}: enter valid whole or half-day values.`);
    }
    return {
      leave_type_id: leaveType.id,
      entitlement: Number(entitlement),
      available: Number(available),
    };
  });

  if (!employeeValidation.success || balanceErrors.length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: {
        ...employeeValidation.error?.flatten().fieldErrors,
        ...(balanceErrors.length ? { balances: balanceErrors } : {}),
      },
      values,
    };
  }

  let createdEmployeeId: string | null = null;
  try {
    const result = await supabase.rpc("create_employee_record", {
      p_actor_id: user.id,
      p_employee_number: employeeValidation.data.employeeNumber,
      p_first_name: employeeValidation.data.firstName,
      p_last_name: employeeValidation.data.lastName,
      p_email: employeeValidation.data.email,
      p_department_id: employeeValidation.data.departmentId,
      p_position: employeeValidation.data.position,
      p_hire_date: employeeValidation.data.hireDate,
      p_employment_status: employeeValidation.data.employmentStatus,
      p_balance_year: setup.balanceYear,
      p_balances: balances,
    });

    if (result.error || !result.data) {
      return {
        status: "error",
        message: "We could not add this employee. Please try again.",
        values,
      };
    }

    const row = (result.data as CreateEmployeeRpcRow[])[0];
    if (!row || row.outcome !== "CREATED" || !row.created_employee_id) {
      const outcome = row?.outcome ?? "UNKNOWN";
      return {
        status: "error",
        message: creationOutcomeMessage(outcome),
        fieldErrors:
          outcome === "DUPLICATE_EMAIL"
            ? { email: ["This email address is already in use."] }
            : outcome === "DUPLICATE_EMPLOYEE_NUMBER"
              ? { employeeNumber: ["This employee ID is already in use."] }
              : undefined,
        values,
      };
    }
    createdEmployeeId = row.created_employee_id;
  } catch {
    return {
      status: "error",
      message: "We could not add this employee. Please try again.",
      values,
    };
  }

  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${createdEmployeeId}?created=1`);
}

export async function adjustLeaveBalanceAction(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  _previousState: BalanceAdjustmentActionState,
  formData: FormData,
): Promise<BalanceAdjustmentActionState> {
  void _previousState;
  const user = await requireUser(["ADMIN"]);
  const values = {
    entitlement: String(formData.get("entitlement") ?? ""),
    available: String(formData.get("available") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };
  const idsValid =
    employeeIdSchema.safeParse(employeeId).success &&
    leaveTypeIdSchema.safeParse(leaveTypeId).success &&
    yearSchema.safeParse(year).success;
  const validation = balanceSchema.safeParse(values);

  if (!idsValid || !validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error?.flatten().fieldErrors,
      values,
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { status: "error", message: "Balance editing is temporarily unavailable.", values };
  }

  try {
    const result = await supabase.rpc("adjust_employee_leave_balance", {
      p_actor_id: user.id,
      p_employee_id: employeeId,
      p_leave_type_id: leaveTypeId,
      p_year: year,
      p_entitlement: Number(validation.data.entitlement),
      p_available: Number(validation.data.available),
      p_reason: validation.data.reason,
    });
    if (result.error || !result.data) {
      return { status: "error", message: "We could not update this leave balance.", values };
    }

    const row = (result.data as AdjustBalanceRpcRow[])[0];
    if (!row || row.outcome !== "UPDATED") {
      return {
        status: "error",
        message: adjustmentOutcomeMessage(row?.outcome ?? "UNKNOWN"),
        values,
      };
    }
  } catch {
    return { status: "error", message: "We could not update this leave balance.", values };
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/employee/dashboard");
  revalidatePath("/employee/leave/new");
  return { status: "success", message: "Leave balance updated." };
}

export async function updateHireDateAction(
  employeeId: string,
  _previousState: EmployeeManagementActionState,
  formData: FormData,
): Promise<EmployeeManagementActionState> {
  void _previousState;
  await requireUser(["ADMIN"]);
  const employeeValidation = employeeIdSchema.safeParse(employeeId);
  const hireDateValidation = dateSchema.safeParse(String(formData.get("hireDate") ?? ""));
  if (!employeeValidation.success || !hireDateValidation.success) {
    return {
      status: "error",
      message: hireDateValidation.error?.issues[0]?.message ?? "Invalid employee record.",
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { status: "error", message: "Hire date editing is unavailable." };

  try {
    const result = await supabase
      .from("employees")
      .update({ hire_date: hireDateValidation.data })
      .eq("id", employeeId)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data) {
      return { status: "error", message: "We could not update this hire date." };
    }
  } catch {
    return { status: "error", message: "We could not update this hire date." };
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);
  return { status: "success", message: "Hire date updated." };
}

export async function updateEmploymentStatusAction(
  employeeId: string,
  targetStatus: Extract<EmploymentStatus, "ACTIVE" | "RESIGNED">,
  _previousState: EmployeeManagementActionState,
  _formData: FormData,
): Promise<EmployeeManagementActionState> {
  void _previousState;
  void _formData;
  await requireUser(["ADMIN"]);
  if (
    !employeeIdSchema.safeParse(employeeId).success ||
    !z.enum(["ACTIVE", "RESIGNED"]).safeParse(targetStatus).success
  ) {
    return { status: "error", message: "This employment status change is invalid." };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { status: "error", message: "Status editing is unavailable." };

  try {
    const result = await supabase
      .from("employees")
      .update({ employment_status: targetStatus })
      .eq("id", employeeId)
      .neq("employment_status", targetStatus)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data) {
      return { status: "error", message: "We could not update this employee status." };
    }
  } catch {
    return { status: "error", message: "We could not update this employee status." };
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/employee/dashboard");
  revalidatePath("/employee/leave/new");
  revalidatePath("/employee/leave/requests");
  return {
    status: "success",
    message:
      targetStatus === "RESIGNED"
        ? "Employee marked as resigned. Historical records were preserved."
        : "Employee reactivated.",
  };
}
