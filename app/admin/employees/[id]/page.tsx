import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardList,
  Info,
  UserRound,
  WalletCards,
} from "lucide-react";
import { z } from "zod";

import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getManagementEmployeeDetail } from "@/lib/db/management-employees";
import { formatLeaveDateRange, formatSubmittedDate } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Employee Details" };

const employeeIdSchema = z.string().uuid();

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const { id } = await params;
  if (!employeeIdSchema.safeParse(id).success) notFound();

  let employee = null;
  let loadFailed = false;
  try {
    employee = await getManagementEmployeeDetail(user.id, user.role, id);
  } catch {
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="dashboard-page employee-detail-page">
        <Link href="/admin/employees" className="back-link"><ArrowLeft size={15} /> Back to employees</Link>
        <div className="leave-empty-state leave-error-state review-load-error">
          <Info size={28} />
          <h2>Employee details are temporarily unavailable</h2>
          <p>We could not load this employee safely. Please try again shortly.</p>
        </div>
      </div>
    );
  }

  if (!employee) notFound();

  return (
    <div className="dashboard-page employee-detail-page">
      <Link href="/admin/employees" className="back-link"><ArrowLeft size={15} /> Back to employees</Link>

      <div className="page-heading employee-detail-heading">
        <div>
          <p className="date-label">Employee profile</p>
          <h1>{employee.fullName}</h1>
          <p>{employee.employeeNumber} · {employee.departmentName}</p>
        </div>
        <span className={`employment-status employment-status-${employee.employmentStatus.toLowerCase()}`}>
          <span aria-hidden="true" />
          {employee.employmentStatus === "ACTIVE" ? "Active employee" : "Inactive employee"}
        </span>
      </div>

      <section className="employee-profile-card" aria-labelledby="employee-profile-title">
        <div className="review-card-heading">
          <span><UserRound size={19} /></span>
          <div>
            <p className="section-kicker">Basic information</p>
            <h2 id="employee-profile-title">Employment details</h2>
          </div>
        </div>
        <div className="employee-profile-grid">
          <div><span>Employee ID</span><strong>{employee.employeeNumber}</strong></div>
          <div><span>Full name</span><strong>{employee.fullName}</strong></div>
          <div><span>Department</span><strong>{employee.departmentName}</strong></div>
          <div><span>Position</span><strong>{employee.position}</strong></div>
          <div><span>Employment status</span><strong>{employee.employmentStatus === "ACTIVE" ? "Active" : "Inactive"}</strong></div>
          <div>
            <span>Current leave status</span>
            <strong className={employee.currentLeaveStatus === "ON_LEAVE" ? "current-leave-on" : "current-leave-available"}>
              {employee.currentLeaveStatus === "ON_LEAVE" ? "Currently on leave" : "Available"}
            </strong>
          </div>
        </div>
      </section>

      <section className="employee-balance-section" aria-labelledby="employee-balances-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Leave account</p>
            <h2 id="employee-balances-title">Leave balances</h2>
          </div>
          <span className="summary-year">{employee.balances[0]?.year ?? new Date().getFullYear()}</span>
        </div>

        {employee.balances.length === 0 ? (
          <div className="compact-empty-state employee-balance-empty">
            <WalletCards size={22} />
            <span>No leave balances are assigned to this employee.</span>
          </div>
        ) : (
          <div className="employee-balance-grid">
            {employee.balances.map((balance) => {
              const availablePercent = balance.allocatedDays > 0
                ? Math.max(0, Math.min(100, (balance.remainingDays / balance.allocatedDays) * 100))
                : 0;
              return (
                <article className="employee-balance-card" key={balance.leaveTypeId}>
                  <span className="employee-balance-icon"><WalletCards size={19} /></span>
                  <div>
                    <span>{balance.name}</span>
                    <strong>{balance.remainingDays} <small>/ {balance.allocatedDays} days</small></strong>
                  </div>
                  <div className="employee-balance-progress" aria-label={`${Math.round(availablePercent)} percent available`}>
                    <span style={{ width: `${availablePercent}%` }} />
                  </div>
                  <small>{balance.usedDays} days used · {Math.round(availablePercent)}% available</small>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="employee-history-card" aria-labelledby="employee-history-title">
        <div className="directory-heading">
          <div>
            <p className="section-kicker">Recent activity</p>
            <h2 id="employee-history-title">Recent leave requests</h2>
          </div>
          <ClipboardList size={20} />
        </div>

        {employee.recentRequests.length === 0 ? (
          <div className="leave-empty-state employee-history-empty">
            <CalendarCheck2 size={27} />
            <h2>No leave history</h2>
            <p>This employee has not submitted a leave request.</p>
          </div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table employee-history-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employee.recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Leave Type"><strong>{request.leaveTypeName}</strong></td>
                    <td data-label="Dates">{formatLeaveDateRange(request.startDate, request.endDate)}</td>
                    <td data-label="Days">{request.numberOfDays}</td>
                    <td data-label="Reason" className="employee-history-reason">{request.reason}</td>
                    <td data-label="Submitted">{formatSubmittedDate(request.createdAt)}</td>
                    <td data-label="Status"><LeaveStatusBadge status={request.status} /></td>
                    <td data-label="Action">
                      <Link href={`/admin/requests/${request.id}`} className="review-link">
                        View request
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="employee-detail-scope">
        <BriefcaseBusiness size={17} />
        <span>{user.role === "ADMIN" ? "Company-wide employee access" : `${employee.departmentName} department access`}</span>
      </div>
    </div>
  );
}
