"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { getManagementScope } from "@/lib/db/management-leave";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReviewRequestActionState } from "@/types/leave";

const requestIdSchema = z.string().uuid();
const rejectionSchema = z.object({
  remarks: z
    .string()
    .trim()
    .min(5, "Add at least 5 characters explaining the rejection.")
    .max(500, "Remarks must be 500 characters or fewer."),
});

type ReviewDecision = "APPROVED" | "REJECTED";
type ReviewRpcRow = {
  outcome: string;
  previous_balance: number | string | null;
  new_balance: number | string | null;
};

function outcomeMessage(outcome: string) {
  const messages: Record<string, string> = {
    NOT_FOUND: "This leave request could not be found.",
    UNAUTHORIZED: "You are not authorized to review this employee's request.",
    STALE_REQUEST: "This request is no longer pending. Refresh to see its latest status.",
    INVALID_DECISION: "The requested review action is invalid.",
    INVALID_REMARKS: "Rejection remarks must contain at least 5 characters.",
    INVALID_REQUEST: "This request contains invalid leave dates or a day count mismatch.",
    BALANCE_NOT_FOUND: "No matching leave balance is available for this employee.",
    INSUFFICIENT_BALANCE: "The employee no longer has enough leave balance for approval.",
  };

  return messages[outcome] ?? "We could not complete this review. Please try again.";
}

async function reviewRequest(
  requestId: string,
  decision: ReviewDecision,
  remarks: string | null,
): Promise<ReviewRequestActionState> {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  if (!requestIdSchema.safeParse(requestId).success) {
    return { status: "error", message: "This leave request is invalid." };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { status: "error", message: "Request review is temporarily unavailable." };
  }

  try {
    const scope = await getManagementScope(user.id, user.role);
    if (!scope) {
      return { status: "error", message: "Your management access could not be verified." };
    }

    const result = await supabase.rpc("review_leave_request", {
      p_request_id: requestId,
      p_reviewer_id: user.id,
      p_decision: decision,
      p_remarks: remarks,
    });

    if (result.error || !result.data) {
      return { status: "error", message: "We could not complete this review. Please try again." };
    }

    const row = (result.data as ReviewRpcRow[])[0];
    if (!row || row.outcome !== decision) {
      return {
        status: "error",
        message: outcomeMessage(row?.outcome ?? "UNKNOWN"),
      };
    }
  } catch {
    return { status: "error", message: "We could not complete this review. Please try again." };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/employee/dashboard");
  revalidatePath("/employee/leave/requests");
  redirect(`/admin/requests/${requestId}?reviewed=${decision}`);
}

export async function approveLeaveRequestAction(
  requestId: string,
  _previousState: ReviewRequestActionState,
  _formData: FormData,
): Promise<ReviewRequestActionState> {
  void _previousState;
  void _formData;
  return reviewRequest(requestId, "APPROVED", null);
}

export async function rejectLeaveRequestAction(
  requestId: string,
  _previousState: ReviewRequestActionState,
  formData: FormData,
): Promise<ReviewRequestActionState> {
  void _previousState;
  const parsed = rejectionSchema.safeParse({ remarks: formData.get("remarks") });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Add clear reviewer remarks before rejecting this request.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  return reviewRequest(requestId, "REJECTED", parsed.data.remarks);
}
