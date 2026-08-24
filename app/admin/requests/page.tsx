import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Info } from "lucide-react";

import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getManagementLeaveRequests } from "@/lib/db/management-leave";
import { formatLeaveDate, formatSubmittedDate } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Leave Requests" };

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type ManagementFilter = (typeof FILTERS)[number];

function managementFilter(value: string | undefined): ManagementFilter {
  const normalized = value?.toUpperCase();
  return FILTERS.includes(normalized as ManagementFilter)
    ? (normalized as ManagementFilter)
    : "ALL";
}

export default async function LeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const params = await searchParams;
  const activeFilter = managementFilter(params.status);
  let requests = null;

  try {
    requests = await getManagementLeaveRequests(user.id, user.role);
  } catch {
    requests = null;
  }

  const filteredRequests =
    requests?.filter(
      (request) => activeFilter === "ALL" || request.status === activeFilter,
    ) ?? [];

  return (
    <div className="dashboard-page leave-page management-requests-page">
      <div className="page-heading">
        <div>
          <p className="date-label">Management workspace</p>
          <h1>Leave requests</h1>
          <p>
            {user.role === "SUPERVISOR"
              ? "Review requests submitted by employees in your department."
              : "Review employee leave requests across the company."}
          </p>
        </div>
        <span className="role-badge">{user.role === "ADMIN" ? "Company-wide" : "Operations team"}</span>
      </div>

      <div className="request-list-card">
        <div className="request-list-toolbar">
          <div>
            <p className="section-kicker">Review queue</p>
            <h2>{filteredRequests.length} matching requests</h2>
          </div>
          <nav className="request-filters" aria-label="Filter management requests">
            {FILTERS.map((filter) => (
              <Link
                key={filter}
                href={filter === "ALL" ? "/admin/requests" : `/admin/requests?status=${filter}`}
                className={filter === activeFilter ? "request-filter request-filter-active" : "request-filter"}
              >
                {filter.charAt(0) + filter.slice(1).toLowerCase()}
              </Link>
            ))}
          </nav>
        </div>

        {!requests ? (
          <div className="leave-empty-state leave-error-state">
            <Info size={27} />
            <h2>Requests are temporarily unavailable</h2>
            <p>We could not load the management review queue. Please try again shortly.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="leave-empty-state">
            <ClipboardList size={29} />
            <h2>No {activeFilter === "ALL" ? "leave" : activeFilter.toLowerCase()} requests</h2>
            <p>There are no requests matching this management filter.</p>
          </div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table management-request-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave type</th>
                  <th>Start date</th>
                  <th>End date</th>
                  <th>Days</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Employee" className="management-employee-cell">
                      <strong>{request.employeeName}</strong>
                      <small>{request.employeeNumber}</small>
                    </td>
                    <td data-label="Department">{request.departmentName}</td>
                    <td data-label="Leave type"><strong>{request.leaveTypeName}</strong></td>
                    <td data-label="Start date">{formatLeaveDate(request.startDate)}</td>
                    <td data-label="End date">{formatLeaveDate(request.endDate)}</td>
                    <td data-label="Days">{request.numberOfDays}</td>
                    <td data-label="Submitted" className="submitted-date-cell">
                      {formatSubmittedDate(request.createdAt)}
                    </td>
                    <td data-label="Status"><LeaveStatusBadge status={request.status} /></td>
                    <td data-label="Action">
                      <Link href={`/admin/requests/${request.id}`} className="review-link">
                        {request.status === "PENDING" ? "Review" : "View"} <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
