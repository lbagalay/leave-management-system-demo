import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "Leave Requests" };

export default function LeaveRequestsPage() {
  return (
    <FoundationPlaceholder
      eyebrow="Management workspace"
      title="Leave Requests"
      description="Review leave requests submitted by authorized employees."
      icon={ClipboardList}
    />
  );
}
