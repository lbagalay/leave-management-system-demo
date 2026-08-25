"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { getEmployeeIdentity } from "@/lib/db/employee-leave";
import { calculateWeekdays, parseIsoDate } from "@/lib/leave/dates";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CancelRequestActionState,
  LeaveRequestActionState,
} from "@/types/leave";

const requestSchema = z.object({
  leaveTypeId: z.string().uuid("Select a valid leave type."),
  startDate: z.string().min(1, "Select a start date."),
  endDate: z.string().min(1, "Select an end date."),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters.")
    .max(500, "Reason must be 500 characters or fewer."),
});

const requestIdSchema = z.string().uuid();

export async function submitLeaveRequestAction(
  _previousState: LeaveRequestActionState,
  formData: FormData,
): Promise<LeaveRequestActionState> {
  const user = await requireUser(["EMPLOYEE"]);
  const rawValues = {
    leaveTypeId: String(formData.get("leaveTypeId") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };
  const validated = requestSchema.safeParse(rawValues);

  if (!validated.success) {
    return {
      message: "Please correct the highlighted fields.",
      fieldErrors: validated.error.flatten().fieldErrors,
      values: rawValues,
    };
  }

  const { leaveTypeId, startDate, endDate, reason } = validated.data;
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    return { message: "Enter valid leave dates.", values: rawValues };
  }
  if (end < start) {
    return { message: "End date cannot be before the start date.", values: rawValues };
  }
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return {
      message: "A request must start and end within the same calendar year.",
      values: rawValues,
    };
  }

  const numberOfDays = calculateWeekdays(startDate, endDate);
  if (numberOfDays < 1) {
    return {
      message: "The selected range must include at least one weekday.",
      values: rawValues,
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      message: "Leave requests are temporarily unavailable. Please try again later.",
      values: rawValues,
    };
  }

  try {
    const employee = await getEmployeeIdentity(user.id);
    if (!employee) {
      return { message: "Your active employee profile could not be found.", values: rawValues };
    }

    const year = start.getUTCFullYear();
    const [leaveTypeResult, balanceResult, duplicateResult] = await Promise.all([
      supabase
        .from("leave_types")
        .select("id")
        .eq("id", leaveTypeId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("leave_balances")
        .select("available_days")
        .eq("employee_id", employee.id)
        .eq("leave_type_id", leaveTypeId)
        .eq("year", year)
        .maybeSingle(),
      supabase
        .from("leave_requests")
        .select("id")
        .eq("employee_id", employee.id)
        .eq("leave_type_id", leaveTypeId)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .in("status", ["PENDING", "APPROVED"])
        .maybeSingle(),
    ]);

    if (leaveTypeResult.error || balanceResult.error || duplicateResult.error) {
      return {
        message: "We could not validate this request. Please try again.",
        values: rawValues,
      };
    }
    if (!leaveTypeResult.data) {
      return { message: "Select an active leave type.", values: rawValues };
    }
    if (!balanceResult.data) {
      return {
        message: "No leave balance is allocated for this type and year.",
        values: rawValues,
      };
    }
    if (duplicateResult.data) {
      return {
        message: "An active request already exists for this leave type and date range.",
        values: rawValues,
      };
    }

    const remainingDays = Number(balanceResult.data.available_days);
    if (!Number.isFinite(remainingDays) || numberOfDays > remainingDays) {
      return {
        message: `This request exceeds your available balance of ${remainingDays} days.`,
        values: rawValues,
      };
    }

    const insertResult = await supabase.from("leave_requests").insert({
      employee_id: employee.id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      number_of_days: numberOfDays,
      reason,
      status: "PENDING",
      reviewed_by: null,
      reviewed_at: null,
      reviewer_remarks: null,
    });

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        return {
          message: "An active request already exists for this leave type and date range.",
          values: rawValues,
        };
      }
      if (insertResult.error.code === "23514") {
        return {
          message: "Only active employees can submit new leave requests.",
          values: rawValues,
        };
      }
      return {
        message: "We could not submit your request. Please try again.",
        values: rawValues,
      };
    }
  } catch {
    return {
      message: "We could not submit your request. Please try again.",
      values: rawValues,
    };
  }

  revalidatePath("/employee/dashboard");
  revalidatePath("/employee/leave/requests");
  redirect("/employee/leave/requests?submitted=1");
}

export async function cancelLeaveRequestAction(
  requestId: string,
  _previousState: CancelRequestActionState,
  _formData: FormData,
): Promise<CancelRequestActionState> {
  void _previousState;
  void _formData;
  const user = await requireUser(["EMPLOYEE"]);
  if (!requestIdSchema.safeParse(requestId).success) {
    return { status: "error", message: "This request cannot be cancelled." };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { status: "error", message: "Cancellation is temporarily unavailable." };
  }

  try {
    const employee = await getEmployeeIdentity(user.id);
    if (!employee) {
      return { status: "error", message: "Your active employee profile was not found." };
    }

    const requestResult = await supabase
      .from("leave_requests")
      .select("id")
      .eq("id", requestId)
      .eq("employee_id", employee.id)
      .eq("status", "PENDING")
      .maybeSingle();

    if (requestResult.error) {
      return { status: "error", message: "We could not verify this request." };
    }
    if (!requestResult.data) {
      return { status: "error", message: "Only your own pending request can be cancelled." };
    }

    const updateResult = await supabase
      .from("leave_requests")
      .update({ status: "CANCELLED" })
      .eq("id", requestId)
      .eq("employee_id", employee.id)
      .eq("status", "PENDING")
      .select("id")
      .maybeSingle();

    if (updateResult.error || !updateResult.data) {
      return { status: "error", message: "We could not cancel this request." };
    }
  } catch {
    return { status: "error", message: "We could not cancel this request." };
  }

  revalidatePath("/employee/dashboard");
  revalidatePath("/employee/leave/requests");
  return { status: "success", message: "Request cancelled." };
}
