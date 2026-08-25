import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { LeaveFormData } from "@/types/leave";

import { LeaveRequestForm } from "./leave-request-form";

vi.mock("@/app/employee/leave/actions", () => ({
  submitLeaveRequestAction: async () => ({ message: "" }),
}));

const data: LeaveFormData = {
  year: 2026,
  leaveTypes: [
    {
      id: "40000000-0000-0000-0000-000000000001",
      code: "VACATION",
      name: "Vacation Leave",
      description: "Planned time away",
    },
    {
      id: "40000000-0000-0000-0000-000000000002",
      code: "SICK",
      name: "Sick Leave",
      description: "Health-related leave",
    },
    {
      id: "40000000-0000-0000-0000-000000000003",
      code: "EMERGENCY",
      name: "Emergency Leave",
      description: "Unexpected urgent leave",
    },
  ],
  balances: [
    {
      leaveTypeId: "40000000-0000-0000-0000-000000000001",
      code: "VACATION",
      name: "Vacation Leave",
      allocatedDays: 10,
      usedDays: 3,
      remainingDays: 7,
      year: 2026,
    },
    {
      leaveTypeId: "40000000-0000-0000-0000-000000000002",
      code: "SICK",
      name: "Sick Leave",
      allocatedDays: 0,
      usedDays: 0,
      remainingDays: 0,
      year: 2026,
    },
  ],
};

describe("leave request type selection", () => {
  it("renders only leave types with an assigned current-year balance", () => {
    const markup = renderToStaticMarkup(<LeaveRequestForm data={data} />);

    expect(markup).toContain(">Vacation Leave</option>");
    expect(markup).toContain(">Sick Leave</option>");
    expect(markup).not.toContain("Emergency Leave");
  });
});
