"use client";

import { PageError } from "@/components/ui/page-error";

export default function EmployeeError({ reset }: { reset: () => void }) {
  return <PageError reset={reset} />;
}
