import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
