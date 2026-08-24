import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Download,
  FileChartColumnIncreasing,
  Info,
  XCircle,
} from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getManagementReport,
  parseReportRange,
} from "@/lib/db/management-reports";
import { REPORT_RANGES, type ReportRange } from "@/types/management";

export const metadata: Metadata = { title: "Leave Reports" };

const RANGE_LABELS: Record<ReportRange, string> = {
  THIS_MONTH: "This Month",
  LAST_MONTH: "Last Month",
  THIS_YEAR: "This Year",
};

const REQUEST_CARD_LABELS: Record<ReportRange, string> = {
  THIS_MONTH: "Leave Requests This Month",
  LAST_MONTH: "Leave Requests Last Month",
  THIS_YEAR: "Leave Requests This Year",
};

function days(value: number) {
  return `${value} ${value === 1 ? "day" : "days"}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const params = await searchParams;
  const range = parseReportRange(params.range);
  let report = null;

  try {
    report = await getManagementReport(user.id, user.role, range);
  } catch {
    report = null;
  }

  return (
    <div className="dashboard-page management-reports-page">
      <div className="page-heading reports-page-heading">
        <div>
          <p className="date-label">Management reports</p>
          <h1>Leave activity</h1>
          <p>
            {user.role === "SUPERVISOR"
              ? "Review approved usage and request activity for your department."
              : "Review leave usage and request activity across the company."}
          </p>
        </div>
        {report && (
          <a className="report-export-button" href={`/admin/reports/export?range=${range}`}>
            <Download size={16} /> Export CSV
          </a>
        )}
      </div>

      <nav className="report-range-filters" aria-label="Report date range">
        {REPORT_RANGES.map((option) => (
          <Link
            key={option}
            href={`/admin/reports?range=${option}`}
            className={option === range ? "report-range-active" : ""}
          >
            {RANGE_LABELS[option]}
          </Link>
        ))}
      </nav>

      {!report ? (
        <div className="leave-empty-state leave-error-state reports-load-error">
          <Info size={28} />
          <h2>Reports are temporarily unavailable</h2>
          <p>We could not calculate report data safely. Please try again shortly.</p>
        </div>
      ) : (
        <>
          <div className="report-period-label">
            <CalendarDays size={16} />
            <span>Reporting period</span>
            <strong>{report.period.label}</strong>
            <small>{user.role === "ADMIN" ? "All departments" : `${user.department ?? "Department"} only`}</small>
          </div>

          <section className="summary-section" aria-labelledby="report-summary-title">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Report overview</p>
                <h2 id="report-summary-title">Request outcomes</h2>
              </div>
              <span className="summary-year">Live data</span>
            </div>
            <div className="dashboard-metric-grid admin-metric-grid report-metric-grid">
              <article className="metric-card request-metric-card">
                <span className="metric-icon"><FileChartColumnIncreasing size={20} /></span>
                <span className="metric-label">{REQUEST_CARD_LABELS[range]}</span>
                <strong className="metric-value">{report.requestsThisPeriod}</strong>
                <span className="metric-footnote">Submitted in this period</span>
              </article>
              <article className="metric-card request-metric-card">
                <span className="metric-icon metric-icon-success"><CheckCircle2 size={20} /></span>
                <span className="metric-label">Approved Requests</span>
                <strong className="metric-value">{report.approvedRequests}</strong>
                <span className="metric-footnote">Approved submissions</span>
              </article>
              <article className="metric-card request-metric-card">
                <span className="metric-icon metric-icon-warm"><XCircle size={20} /></span>
                <span className="metric-label">Rejected Requests</span>
                <strong className="metric-value">{report.rejectedRequests}</strong>
                <span className="metric-footnote">Rejected submissions</span>
              </article>
              <article className="metric-card request-metric-card">
                <span className="metric-icon"><ChartNoAxesColumnIncreasing size={20} /></span>
                <span className="metric-label">Approved Leave Days Used</span>
                <strong className="metric-value">{report.approvedLeaveDaysUsed}</strong>
                <span className="metric-footnote">Across approved requests</span>
              </article>
            </div>
          </section>

          <section className="report-table-card" aria-labelledby="employee-usage-title">
            <div className="directory-heading">
              <div>
                <p className="section-kicker">Employee usage</p>
                <h2 id="employee-usage-title">Leave usage by employee</h2>
              </div>
              <span>{report.employeeUsage.length} employees</span>
            </div>
            <div className="request-table-wrap">
              <table className="request-table report-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Vacation Used</th>
                    <th>Sick Used</th>
                    <th>Total Days Used</th>
                  </tr>
                </thead>
                <tbody>
                  {report.employeeUsage.map((employee) => (
                    <tr key={employee.employeeId}>
                      <td data-label="Employee" className="management-employee-cell">
                        <strong>{employee.employeeName}</strong>
                        <small>{employee.employeeNumber}</small>
                      </td>
                      <td data-label="Department">{employee.departmentName}</td>
                      <td data-label="Vacation Used">{days(employee.vacationUsed)}</td>
                      <td data-label="Sick Used">{days(employee.sickUsed)}</td>
                      <td data-label="Total Days Used"><strong>{days(employee.totalDaysUsed)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-table-card" aria-labelledby="department-usage-title">
            <div className="directory-heading">
              <div>
                <p className="section-kicker">Department usage</p>
                <h2 id="department-usage-title">Leave usage by department</h2>
              </div>
              <span>{report.departmentUsage.length} {report.departmentUsage.length === 1 ? "department" : "departments"}</span>
            </div>
            <div className="request-table-wrap">
              <table className="request-table report-table department-report-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Requests</th>
                    <th>Approved Days Used</th>
                  </tr>
                </thead>
                <tbody>
                  {report.departmentUsage.map((department) => (
                    <tr key={department.departmentId}>
                      <td data-label="Department"><strong>{department.departmentName}</strong></td>
                      <td data-label="Total Requests">{department.totalRequests}</td>
                      <td data-label="Approved Days Used"><strong>{days(department.approvedDaysUsed)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
