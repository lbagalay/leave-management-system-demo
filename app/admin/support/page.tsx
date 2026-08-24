import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

import { FoundationPlaceholder } from "@/components/dashboard/foundation-placeholder";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <FoundationPlaceholder
      eyebrow="Management workspace"
      title="Support"
      description="Access system support and maintenance information."
      icon={LifeBuoy}
    />
  );
}
