import type { Metadata } from "next";
import { CalendarPlus, Info } from "lucide-react";

import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { requireUser } from "@/lib/auth/guards";
import { getLeaveFormData } from "@/lib/db/employee-leave";
import { currentManilaDate } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "File Leave" };

export default async function FileLeavePage() {
  const user = await requireUser(["EMPLOYEE"]);
  const year = Number(currentManilaDate().slice(0, 4));
  let data = null;

  try {
    data = await getLeaveFormData(user.id, year);
  } catch {
    data = null;
  }

  if (!data) {
    return <LeaveSetupUnavailable />;
  }

  return (
    <div className="dashboard-page leave-page">
      <div className="page-heading leave-page-heading">
        <div>
          <p className="date-label">Employee workspace</p>
          <h1>File a leave request</h1>
          <p>Submit a request for review. Weekends are excluded from the day count.</p>
        </div>
        <span className="role-badge"><CalendarPlus size={14} /> New request</span>
      </div>

      <div className="leave-form-card">
        <LeaveRequestForm data={data} />
      </div>
    </div>
  );
}

function LeaveSetupUnavailable() {
  return (
    <div className="dashboard-page leave-page">
      <div className="page-heading">
        <div>
          <p className="date-label">Employee workspace</p>
          <h1>File a leave request</h1>
          <p>Create and submit a new leave request.</p>
        </div>
      </div>
      <div className="leave-empty-state leave-error-state">
        <Info size={28} />
        <h2>Leave setup is temporarily unavailable</h2>
        <p>We could not load your leave types and balances. Please try again shortly.</p>
      </div>
    </div>
  );
}
