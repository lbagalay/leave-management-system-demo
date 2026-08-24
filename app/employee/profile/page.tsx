import type { Metadata } from "next";
import { UserRound } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <FoundationPlaceholder
      eyebrow="Employee workspace"
      title="Profile"
      description="View your employee information and account details."
      icon={UserRound}
    />
  );
}
