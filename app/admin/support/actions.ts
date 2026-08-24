"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type SupportTicketActionState,
} from "@/types/support";

const supportTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Issue title must be at least 3 characters.")
    .max(100, "Issue title must be 100 characters or fewer."),
  category: z.enum(SUPPORT_CATEGORIES, {
    errorMap: () => ({ message: "Select a valid issue category." }),
  }),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(1000, "Description must be 1,000 characters or fewer."),
  priority: z.enum(SUPPORT_PRIORITIES, {
    errorMap: () => ({ message: "Select a valid priority." }),
  }),
});

export async function submitSupportTicketAction(
  _previousState: SupportTicketActionState,
  formData: FormData,
): Promise<SupportTicketActionState> {
  void _previousState;
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const values = {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    priority: String(formData.get("priority") ?? ""),
  };
  const validated = supportTicketSchema.safeParse(values);

  if (!validated.success) {
    return {
      status: "error",
      message: "Please correct the highlighted support request fields.",
      fieldErrors: validated.error.flatten().fieldErrors,
      values,
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Issue reporting is temporarily unavailable. Please try again later.",
      values,
    };
  }

  try {
    const result = await supabase.from("support_tickets").insert({
      submitted_by: user.id,
      title: validated.data.title,
      category: validated.data.category,
      description: validated.data.description,
      priority: validated.data.priority,
      status: "OPEN",
    });

    if (result.error) {
      return {
        status: "error",
        message: "We could not submit this issue. Please try again.",
        values,
      };
    }
  } catch {
    return {
      status: "error",
      message: "We could not submit this issue. Please try again.",
      values,
    };
  }

  revalidatePath("/admin/support");
  redirect("/admin/support?submitted=1");
}
