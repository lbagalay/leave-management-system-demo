import { redirect } from "next/navigation";

import { dashboardPathForRole } from "@/lib/auth/demo-users";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? dashboardPathForRole(user.role) : "/login");
}
