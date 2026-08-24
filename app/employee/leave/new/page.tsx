import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "File Leave" };

export default function FileLeavePage() {
  return (
    <FoundationPlaceholder
      eyebrow="Employee workspace"
      title="File Leave"
      description="Create and submit a new leave request."
      icon={CalendarPlus}
    />
  );
}
