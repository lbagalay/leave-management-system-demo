import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Info,
  UserRound,
  WalletCards,
} from "lucide-react";
import { z } from "zod";

import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { RequestReviewActions } from "@/components/leave/request-review-actions";
import { requireUser } from "@/lib/auth/guards";
import { getManagementRequestDetail } from "@/lib/db/management-leave";
import {
  formatLeaveDateRange,
  formatSubmittedDate,
} from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Review Leave Request" };

const requestIdSchema = z.string().uuid();

export default async function ReviewLeaveRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const { id } = await params;
  const query = await searchParams;
  if (!requestIdSchema.safeParse(id).success) notFound();

  let request = null;
  let loadFailed = false;
  try {
    request = await getManagementRequestDetail(user.id, user.role, id);
  } catch {
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="dashboard-page leave-page">
        <Link href="/admin/requests" className="back-link"><ArrowLeft size={15} /> Back to requests</Link>
        <div className="leave-empty-state leave-error-state review-load-error">
          <Info size={28} />
          <h2>Review details are temporarily unavailable</h2>
          <p>We could not load this request safely. Please try again shortly.</p>
        </div>
      </div>
    );
  }

  if (!request) notFound();
  const reviewed = query.reviewed === "APPROVED" || query.reviewed === "REJECTED"
    ? query.reviewed
    : null;

  return (
    <div className="dashboard-page leave-page review-page">
      <Link href="/admin/requests" className="back-link"><ArrowLeft size={15} /> Back to requests</Link>

      <div className="page-heading review-page-heading">
        <div>
          <p className="date-label">Management review</p>
          <h1>{request.employeeName}&apos;s leave request</h1>
          <p>Submitted {formatSubmittedDate(request.createdAt)}</p>
        </div>
        <LeaveStatusBadge status={request.status} />
      </div>

      {reviewed && (
        <div className="success-notice review-success-notice" role="status">
          <CheckCircle2 size={19} />
          <span>
            <strong>Request {reviewed === "APPROVED" ? "approved" : "rejected"}.</strong>{" "}
            {reviewed === "APPROVED"
              ? "The employee balance was updated exactly once."
              : "The employee balance was not changed."}
          </span>
        </div>
      )}

      <div className="review-layout">
        <div className="review-main-column">
          <section className="review-card" aria-labelledby="employee-info-title">
            <div className="review-card-heading">
              <span><UserRound size={19} /></span>
              <div>
                <p className="section-kicker">Employee</p>
                <h2 id="employee-info-title">Employee information</h2>
              </div>
            </div>
            <div className="review-detail-grid">
              <div><span>Name</span><strong>{request.employeeName}</strong></div>
              <div><span>Employee ID</span><strong>{request.employeeNumber}</strong></div>
              <div><span>Department</span><strong>{request.departmentName}</strong></div>
              <div><span>Position</span><strong>{request.position}</strong></div>
            </div>
          </section>

          <section className="review-card" aria-labelledby="request-info-title">
            <div className="review-card-heading">
              <span><CalendarDays size={19} /></span>
              <div>
                <p className="section-kicker">Request</p>
                <h2 id="request-info-title">Leave details</h2>
              </div>
            </div>
            <div className="review-detail-grid">
              <div><span>Leave type</span><strong>{request.leaveTypeName}</strong></div>
              <div><span>Requested dates</span><strong>{formatLeaveDateRange(request.startDate, request.endDate)}</strong></div>
              <div><span>Business days</span><strong>{request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}</strong></div>
              <div><span>Submitted</span><strong>{formatSubmittedDate(request.createdAt)}</strong></div>
            </div>
            <div className="review-reason">
              <span>Employee reason</span>
              <p>{request.reason}</p>
            </div>
            {request.reviewerRemarks && (
              <div className="reviewer-remarks-block">
                <span>Reviewer remarks</span>
                <p>{request.reviewerRemarks}</p>
              </div>
            )}
          </section>

          <section className="review-card" aria-labelledby="history-title">
            <div className="review-card-heading">
              <span><ClipboardList size={19} /></span>
              <div>
                <p className="section-kicker">History</p>
                <h2 id="history-title">Previous leave activity</h2>
              </div>
            </div>
            {request.previousRequests.length === 0 ? (
              <div className="review-history-empty">No previous leave requests for this employee.</div>
            ) : (
              <div className="review-history-list">
                {request.previousRequests.map((previous) => (
                  <article key={previous.id}>
                    <div>
                      <strong>{previous.leaveTypeName}</strong>
                      <span>{formatLeaveDateRange(previous.startDate, previous.endDate)} · {previous.numberOfDays} {previous.numberOfDays === 1 ? "day" : "days"}</span>
                    </div>
                    <LeaveStatusBadge status={previous.status} />
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="review-side-column">
          <section className="balance-review-card">
            <span className="balance-review-icon"><WalletCards size={22} /></span>
            <p className="section-kicker">{request.balanceYear} balance</p>
            <h2>{request.leaveTypeName}</h2>
            <div className="balance-review-values">
              <div><span>{request.status === "APPROVED" ? "Balance before approval" : "Current balance"}</span><strong>{request.balanceBeforeReview ?? "—"} days</strong></div>
              <div><span>Requested</span><strong>− {request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}</strong></div>
              <div className="balance-review-result"><span>{request.status === "REJECTED" ? "If approved" : "After approval"}</span><strong>{request.balanceAfterApproval ?? "—"} days</strong></div>
            </div>
            {request.currentBalance === null && (
              <p className="balance-warning">No matching balance is configured. Approval will be blocked.</p>
            )}
          </section>

          <section className="review-scope-card">
            <BriefcaseBusiness size={18} />
            <div>
              <strong>{user.role === "ADMIN" ? "Administrator review" : "Department review"}</strong>
              <span>{user.role === "ADMIN" ? "Company-wide authority" : `${request.departmentName} scope`}</span>
            </div>
          </section>

          {request.status === "PENDING" ? (
            <RequestReviewActions request={request} />
          ) : (
            <section className="review-complete-panel">
              <LeaveStatusBadge status={request.status} />
              <h2>Review complete</h2>
              <p>This request can no longer be approved or rejected.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
