import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  History,
  Info,
  UserRound,
  WalletCards,
} from "lucide-react";
import { z } from "zod";

import { BalanceEditor } from "@/components/employees/balance-editor";
import { EmployeeRecordActions } from "@/components/employees/employee-record-actions";
import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getManagementEmployeeDetail } from "@/lib/db/management-employees";
import {
  formatLeaveDate,
  formatLeaveDateRange,
  formatSubmittedDate,
  currentManilaDate,
} from "@/lib/leave/dates";
import type { EmploymentStatus } from "@/types/database";

export const metadata: Metadata = { title: "Employee Details" };

const employeeIdSchema = z.string().uuid();

function employmentLabel(status: EmploymentStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function signedDays(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
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
  const balanceYear = employee.balanceYear;

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
          {employmentLabel(employee.employmentStatus)} employee
        </span>
      </div>

      {query.created === "1" && (
        <div className="success-notice" role="status">
          <CheckCircle2 size={19} />
          <span><strong>Employee record created.</strong> No login credentials were provisioned.</span>
        </div>
      )}

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
          <div><span>Email</span><strong>{employee.email}</strong></div>
          <div><span>Department</span><strong>{employee.departmentName}</strong></div>
          <div><span>Position</span><strong>{employee.position}</strong></div>
          <div><span>Hire date</span><strong>{formatLeaveDate(employee.hireDate)}</strong></div>
          <div><span>Tenure</span><strong>{employee.tenure}</strong></div>
          <div><span>Employment status</span><strong>{employmentLabel(employee.employmentStatus)}</strong></div>
          <div>
            <span>Current leave status</span>
            <strong className={employee.currentLeaveStatus === "ON_LEAVE" ? "current-leave-on" : "current-leave-available"}>
              {employee.currentLeaveStatus === "ON_LEAVE" ? "Currently on leave" : "Available"}
            </strong>
          </div>
        </div>
      </section>

      {user.role === "ADMIN" && (
        <EmployeeRecordActions
          employeeId={employee.id}
          employeeName={employee.fullName}
          hireDate={employee.hireDate}
          employmentStatus={employee.employmentStatus}
          currentDate={currentManilaDate()}
        />
      )}

      <section className="employee-balance-section" aria-labelledby="employee-balances-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Leave account</p>
            <h2 id="employee-balances-title">Leave balances</h2>
          </div>
          <span className="summary-year">{balanceYear}</span>
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
                    <strong>{balance.remainingDays} <small>days available</small></strong>
                  </div>
                  <div className="employee-balance-progress" aria-label={`${Math.round(availablePercent)} percent of entitlement available`}>
                    <span style={{ width: `${availablePercent}%` }} />
                  </div>
                  <dl className="employee-balance-breakdown">
                    <div><dt>Entitled</dt><dd>{balance.allocatedDays}</dd></div>
                    <div><dt>Used</dt><dd>{balance.usedDays}</dd></div>
                    <div><dt>Adjusted</dt><dd>{signedDays(balance.adjustmentDays)}</dd></div>
                  </dl>
                  <small>Updated {formatSubmittedDate(balance.updatedAt)}</small>
                  {user.role === "ADMIN" && (
                    <BalanceEditor
                      employeeId={employee.id}
                      year={balance.year}
                      leaveType={{ id: balance.leaveTypeId, name: balance.name, defaultDays: balance.allocatedDays }}
                      balance={balance}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}

        {user.role === "ADMIN" && employee.availableLeaveTypes.length > 0 && (
          <div className="employee-add-balances">
            <span>Add another current-year balance:</span>
            {employee.availableLeaveTypes.map((leaveType) => (
              <BalanceEditor
                key={leaveType.id}
                employeeId={employee.id}
                year={balanceYear}
                leaveType={leaveType}
              />
            ))}
          </div>
        )}
      </section>

      <section className="employee-history-card" aria-labelledby="employee-adjustment-title">
        <div className="directory-heading">
          <div>
            <p className="section-kicker">Balance activity</p>
            <h2 id="employee-adjustment-title">Adjustment history</h2>
          </div>
          <History size={20} />
        </div>
        {employee.adjustments.length === 0 ? (
          <div className="leave-empty-state employee-history-empty">
            <History size={27} />
            <h2>No manual adjustments</h2>
            <p>Changes made through balance editing will appear here.</p>
          </div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table employee-adjustment-table">
              <thead>
                <tr>
                  <th>Date</th><th>Leave Type</th><th>Entitlement</th><th>Available</th><th>Difference</th><th>Reason</th><th>Updated By</th>
                </tr>
              </thead>
              <tbody>
                {employee.adjustments.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td data-label="Date">{formatSubmittedDate(adjustment.createdAt)}</td>
                    <td data-label="Leave Type"><strong>{adjustment.leaveTypeName}</strong><small>{adjustment.year}</small></td>
                    <td data-label="Entitlement">{adjustment.previousEntitlement} → {adjustment.newEntitlement}</td>
                    <td data-label="Available">{adjustment.previousAvailable} → {adjustment.newAvailable}</td>
                    <td data-label="Difference"><strong>{signedDays(adjustment.adjustment)} days</strong></td>
                    <td data-label="Reason" className="employee-history-reason">{adjustment.reason}</td>
                    <td data-label="Updated By">{adjustment.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="employee-history-card" aria-labelledby="employee-history-title">
        <div className="directory-heading">
          <div>
            <p className="section-kicker">Leave activity</p>
            <h2 id="employee-history-title">Leave request history</h2>
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
                  <th>Leave Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Submitted</th><th>Status</th><th>Action</th>
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
                    <td data-label="Action"><Link href={`/admin/requests/${request.id}`} className="review-link">View request</Link></td>
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
