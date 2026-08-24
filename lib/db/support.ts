import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupportSystemStatus } from "@/types/support";

export async function getSupportSystemStatus(): Promise<SupportSystemStatus> {
  const checkedAt = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date());
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { databaseConnected: false, checkedAt };

  try {
    const result = await supabase
      .from("departments")
      .select("id", { count: "exact", head: true });
    return { databaseConnected: !result.error, checkedAt };
  } catch {
    return { databaseConnected: false, checkedAt };
  }
}
