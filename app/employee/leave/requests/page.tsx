import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "My Requests" };

export default function MyRequestsPage() {
  return (
    <FoundationPlaceholder
      eyebrow="Employee workspace"
      title="My Requests"
      description="Review the status and history of your leave requests."
      icon={ClipboardList}
    />
  );
}
