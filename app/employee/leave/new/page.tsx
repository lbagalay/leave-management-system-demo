import type { Metadata } from "next";
import { CalendarPlus, Info, UserMinus } from "lucide-react";

import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { requireUser } from "@/lib/auth/guards";
import {
  getEmployeeEmploymentStatus,
  getLeaveFormData,
} from "@/lib/db/employee-leave";
import { currentManilaDate } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "File Leave" };

export default async function FileLeavePage() {
  const user = await requireUser(["EMPLOYEE"]);
  const year = Number(currentManilaDate().slice(0, 4));
  let data = null;
  let employmentStatus = null;

  try {
    employmentStatus = await getEmployeeEmploymentStatus(user.id);
    if (employmentStatus === "ACTIVE") {
      data = await getLeaveFormData(user.id, year);
    }
  } catch {
    data = null;
    employmentStatus = null;
  }

  if (employmentStatus === "RESIGNED" || employmentStatus === "INACTIVE") {
    return <LeaveSubmissionBlocked status={employmentStatus} />;
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

function LeaveSubmissionBlocked({ status }: { status: "RESIGNED" | "INACTIVE" }) {
  return (
    <div className="dashboard-page leave-page">
      <div className="page-heading">
        <div>
          <p className="date-label">Employee workspace</p>
          <h1>File a leave request</h1>
          <p>Leave requests are available to active employees.</p>
        </div>
      </div>
      <div className="leave-empty-state leave-error-state">
        <UserMinus size={28} />
        <h2>{status === "RESIGNED" ? "Employee record is resigned" : "Employee record is inactive"}</h2>
        <p>Only active employees can submit new leave requests. Your existing leave history remains preserved.</p>
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
