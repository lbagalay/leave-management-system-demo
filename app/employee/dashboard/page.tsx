import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  HeartPulse,
  Palmtree,
} from "lucide-react";

import { AccountOverview } from "@/components/dashboard/account-overview";
import { DatabaseNotice } from "@/components/dashboard/database-notice";
import { LeaveStatusBadge } from "@/components/leave/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getEmployeeDashboardData } from "@/lib/db/dashboard-data";
import { formatLeaveDateRange } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Employee Dashboard" };

export default async function EmployeeDashboardPage() {
  const user = await requireUser(["EMPLOYEE"]);
  const dashboardResult = await getEmployeeDashboardData(user.id);
  const {
    balances,
    pendingRequests,
    approvedRequests,
    upcomingLeave,
    recentRequests,
  } = dashboardResult.data;
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
          <p>Your employee leave workspace is ready.</p>
        </div>
        <span className="role-badge">Employee workspace</span>
      </div>

      {dashboardResult.databaseUnavailable && <DatabaseNotice />}

      <section className="welcome-panel">
        <div className="welcome-icon"><CalendarCheck2 size={28} /></div>
        <div className="welcome-copy">
          <p className="section-kicker">Leave Management System</p>
          <h2>Welcome to your employee portal</h2>
          <p>Your secure account is active and connected to your Operations profile.</p>
        </div>
        <div className="verified-block">
          <CheckCircle2 size={21} />
          <span><strong>Access verified</strong><small>Employee permissions applied</small></span>
        </div>
      </section>

      <section className="summary-section" aria-labelledby="leave-overview-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Leave overview</p>
            <h2 id="leave-overview-title">Balances and requests</h2>
          </div>
          <span className="summary-year">2026 balances</span>
        </div>

        <div className="dashboard-metric-grid employee-metric-grid employee-phase-two-metrics">
          {balances.map((balance) => {
            const Icon = balance.code === "VACATION" ? Palmtree : HeartPulse;
            const percentage = balance.allocatedDays > 0
              ? Math.round((balance.remainingDays / balance.allocatedDays) * 100)
              : 0;
            const trackPercentage = Math.max(0, Math.min(100, percentage));

            return (
              <article className="metric-card balance-card" key={balance.code}>
                <div className="metric-card-topline">
                  <span className="metric-icon"><Icon size={20} /></span>
                  <span className="metric-caption">{percentage}% available</span>
                </div>
                <span className="metric-label">{balance.name}</span>
                <strong className="metric-value">
                  {balance.remainingDays} <small>/ {balance.allocatedDays} days</small>
                </strong>
                <div className="balance-track" aria-hidden="true">
                  <span style={{ width: `${trackPercentage}%` }} />
                </div>
                <span className="metric-footnote">{balance.usedDays} days used</span>
              </article>
            );
          })}

          <article className="metric-card request-metric-card">
            <span className="metric-icon metric-icon-warm"><Clock3 size={20} /></span>
            <span className="metric-label">Pending Requests</span>
            <strong className="metric-value">{pendingRequests}</strong>
            <span className="metric-footnote">Awaiting management review</span>
          </article>

          <article className="metric-card request-metric-card">
            <span className="metric-icon metric-icon-success"><CircleCheckBig size={20} /></span>
            <span className="metric-label">Approved Requests</span>
            <strong className="metric-value">{approvedRequests}</strong>
            <span className="metric-footnote">Approved in the demo data</span>
          </article>

          <article className="metric-card request-metric-card">
            <span className="metric-icon"><CalendarClock size={20} /></span>
            <span className="metric-label">Upcoming Leave</span>
            <strong className="metric-value">{upcomingLeave}</strong>
            <span className="metric-footnote">Approved future requests</span>
          </article>
        </div>
      </section>

      <section className="recent-requests-section" aria-labelledby="recent-requests-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Latest activity</p>
            <h2 id="recent-requests-title">Recent leave requests</h2>
          </div>
          <Link href="/employee/leave/requests" className="section-link">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="recent-requests-card">
          {recentRequests.length === 0 ? (
            <div className="compact-empty-state">
              <CalendarCheck2 size={22} />
              <span>No leave requests yet.</span>
              <Link href="/employee/leave/new">File your first request</Link>
            </div>
          ) : (
            recentRequests.map((request) => (
              <article className="recent-request-row" key={request.id}>
                <span className="recent-request-icon"><CalendarCheck2 size={18} /></span>
                <div className="recent-request-main">
                  <strong>{request.leaveTypeName}</strong>
                  <span>{formatLeaveDateRange(request.startDate, request.endDate)}</span>
                </div>
                <span className="recent-request-days">
                  {request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}
                </span>
                <LeaveStatusBadge status={request.status} />
              </article>
            ))
          )}
        </div>
      </section>

      <AccountOverview user={user} />
    </div>
  );
}
