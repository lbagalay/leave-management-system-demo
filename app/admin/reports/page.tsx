import type { Metadata } from "next";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <FoundationPlaceholder
      eyebrow="Management workspace"
      title="Reports"
      description="View summarized leave activity and usage information."
      icon={ChartNoAxesColumnIncreasing}
    />
  );
}
