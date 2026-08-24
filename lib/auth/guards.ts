import "server-only";

import { redirect } from "next/navigation";

import { dashboardPathForRole } from "@/lib/auth/demo-users";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";

export async function requireUser(allowedRoles: readonly UserRole[]) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!allowedRoles.includes(user.role)) redirect(dashboardPathForRole(user.role));

  return user;
}
