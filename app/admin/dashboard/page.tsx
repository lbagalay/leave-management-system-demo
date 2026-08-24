import type { Metadata } from "next";
import {
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AccountOverview } from "@/components/dashboard/account-overview";
import { DatabaseNotice } from "@/components/dashboard/database-notice";
import { requireUser } from "@/lib/auth/guards";
import { getAdminDashboardData } from "@/lib/db/dashboard-data";

export const metadata: Metadata = { title: "Management Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const dashboardResult = await getAdminDashboardData();
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
            <span className="metric-footnote">Prepared for the approval phase</span>
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

      <AccountOverview user={user} />
    </div>
  );
}
