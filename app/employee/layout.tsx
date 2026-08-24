import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["EMPLOYEE"]);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
