import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AccountOverview } from "@/components/dashboard/account-overview";
import { DatabaseNotice } from "@/components/dashboard/database-notice";
import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getAdminDashboardData } from "@/lib/db/dashboard-data";
import { formatLeaveDateRange } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Management Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const dashboardResult = await getAdminDashboardData(user.id, user.role);
  const summary = dashboardResult.data;
  const isAdmin = user.role === "ADMIN";
  const dateLabel = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="date-label">{dateLabel}</p>
          <h1>Good day, {user.firstName}.</h1>
          <p>Your management workspace is ready.</p>
        </div>
        <span className="role-badge">{isAdmin ? "Administrator" : "Supervisor"} workspace</span>
      </div>

      {dashboardResult.databaseUnavailable && <DatabaseNotice />}

      <section className="welcome-panel welcome-panel-management">
        <div className="welcome-icon"><ShieldCheck size={28} /></div>
        <div className="welcome-copy">
          <p className="section-kicker">Management access</p>
          <h2>{isAdmin ? "Company-wide administration" : "Operations team supervision"}</h2>
          <p>
            {isAdmin
              ? "Your account is authorized to access the management area across all departments."
              : "Your account is authorized to access the management area for the Operations team."}
          </p>
        </div>
        <div className="verified-block">
          <CheckCircle2 size={21} />
          <span><strong>Access verified</strong><small>{isAdmin ? "Admin" : "Supervisor"} permissions applied</small></span>
        </div>
      </section>

      <section className="summary-section" aria-labelledby="management-overview-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Management overview</p>
            <h2 id="management-overview-title">Current leave activity</h2>
          </div>
          <span className="summary-year">Demo company</span>
        </div>

        <div className="dashboard-metric-grid admin-metric-grid">
          <article className="metric-card request-metric-card">
            <span className="metric-icon metric-icon-warm"><ClipboardList size={20} /></span>
            <span className="metric-label">Pending Approvals</span>
            <strong className="metric-value">{summary.pendingApprovals}</strong>
            <span className="metric-footnote">Awaiting management review</span>
          </article>
          <article className="metric-card request-metric-card">
            <span className="metric-icon"><CalendarOff size={20} /></span>
            <span className="metric-label">Employees on Leave</span>
            <strong className="metric-value">{summary.employeesOnLeave}</strong>
            <span className="metric-footnote">Approved leave today</span>
          </article>
          <article className="metric-card request-metric-card">
            <span className="metric-icon metric-icon-success"><UsersRound size={20} /></span>
            <span className="metric-label">Total Employees</span>
            <strong className="metric-value">{summary.totalEmployees}</strong>
            <span className="metric-footnote">Active seeded employees</span>
          </article>
          <article className="metric-card request-metric-card">
            <span className="metric-icon"><CalendarClock size={20} /></span>
            <span className="metric-label">Requests This Month</span>
            <strong className="metric-value">{summary.requestsThisMonth}</strong>
            <span className="metric-footnote">Across all request statuses</span>
          </article>
        </div>
      </section>

      <section className="management-pending-section" aria-labelledby="pending-requests-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Action required</p>
            <h2 id="pending-requests-title">Pending leave requests</h2>
          </div>
          <Link href="/admin/requests?status=PENDING" className="section-link">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="management-pending-card">
          {summary.pendingRequests.length === 0 ? (
            <div className="compact-empty-state">
              <ClipboardList size={22} />
              <span>No pending leave requests in your scope.</span>
            </div>
          ) : (
            summary.pendingRequests.map((request) => (
              <article className="management-pending-row" key={request.id}>
                <span className="recent-request-icon"><ClipboardList size={18} /></span>
                <div className="management-request-person">
                  <strong>{request.employeeName}</strong>
                  <span>{request.departmentName} · {request.employeeNumber}</span>
                </div>
                <div className="management-request-leave">
                  <strong>{request.leaveTypeName}</strong>
                  <span>{formatLeaveDateRange(request.startDate, request.endDate)} · {request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}</span>
                </div>
                <LeaveStatusBadge status={request.status} />
                <Link href={`/admin/requests/${request.id}`} className="review-link">
                  Review <ArrowRight size={14} />
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      <AccountOverview user={user} />
    </div>
  );
}
