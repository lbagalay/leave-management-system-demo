import type { Metadata } from "next";
import { UsersRound } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <FoundationPlaceholder
      eyebrow="Management workspace"
      title="Employees"
      description="View employees and their leave account information."
      icon={UsersRound}
    />
  );
}
