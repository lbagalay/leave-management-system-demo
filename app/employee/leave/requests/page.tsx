import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, ClipboardList, Info } from "lucide-react";

import { CancelRequestButton } from "@/components/leave/cancel-request-button";
import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getEmployeeLeaveRequests } from "@/lib/db/employee-leave";
import { formatLeaveDateRange, formatSubmittedDate } from "@/lib/leave/dates";
import type { LeaveRequestStatus } from "@/types/database";

export const metadata: Metadata = { title: "My Requests" };

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type RequestFilter = (typeof FILTERS)[number];

function requestFilter(value: string | undefined): RequestFilter {
  const normalized = value?.toUpperCase();
  return FILTERS.includes(normalized as RequestFilter)
    ? (normalized as RequestFilter)
    : "ALL";
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; submitted?: string }>;
}) {
  const user = await requireUser(["EMPLOYEE"]);
  const params = await searchParams;
  const activeFilter = requestFilter(params.status);

  let requests;
  try {
    requests = await getEmployeeLeaveRequests(user.id);
  } catch {
    requests = null;
  }

  const filteredRequests =
    requests?.filter(
      (request) => activeFilter === "ALL" || request.status === activeFilter,
    ) ?? [];

  return (
    <div className="dashboard-page leave-page">
      <div className="page-heading leave-page-heading">
        <div>
          <p className="date-label">Employee workspace</p>
          <h1>My leave requests</h1>
          <p>Track every request and cancel your own pending submissions.</p>
        </div>
        <Link href="/employee/leave/new" className="page-action-link">
          <CalendarPlus size={16} /> File leave
        </Link>
      </div>

      {params.submitted === "1" && (
        <div className="success-notice" role="status">
          <CheckCircle2 size={19} />
          <span><strong>Request submitted.</strong> It is now pending management review.</span>
        </div>
      )}

      <div className="request-list-card">
        <div className="request-list-toolbar">
          <div>
            <p className="section-kicker">Request history</p>
            <h2>{requests?.length ?? 0} total requests</h2>
          </div>
          <nav className="request-filters" aria-label="Filter leave requests">
            {FILTERS.map((filter) => (
              <Link
                key={filter}
                href={filter === "ALL" ? "/employee/leave/requests" : `/employee/leave/requests?status=${filter}`}
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
            <p>We could not load your request history. Please try again shortly.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="leave-empty-state">
            <ClipboardList size={29} />
            <h2>No {activeFilter === "ALL" ? "leave" : activeFilter.toLowerCase()} requests</h2>
            <p>
              {activeFilter === "ALL"
                ? "Your submitted leave requests will appear here."
                : "There are no requests matching this status."}
            </p>
          </div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Leave type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Leave type"><strong>{request.leaveTypeName}</strong></td>
                    <td data-label="Dates">{formatLeaveDateRange(request.startDate, request.endDate)}</td>
                    <td data-label="Days">{request.numberOfDays}</td>
                    <td data-label="Reason" className="request-reason-cell">
                      <span>{request.reason}</span>
                      {request.status === "REJECTED" && request.reviewerRemarks && (
                        <small><strong>Reviewer:</strong> {request.reviewerRemarks}</small>
                      )}
                    </td>
                    <td data-label="Submitted" className="submitted-date-cell">
                      {formatSubmittedDate(request.createdAt)}
                    </td>
                    <td data-label="Status"><LeaveStatusBadge status={request.status as LeaveRequestStatus} /></td>
                    <td data-label="Action">
                      {request.status === "PENDING" ? (
                        <CancelRequestButton requestId={request.id} />
                      ) : (
                        <span className="no-action">—</span>
                      )}
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
