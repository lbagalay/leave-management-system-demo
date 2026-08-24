import type { Metadata } from "next";
import {
  CheckCircle2,
  CircleGauge,
  Headphones,
  LifeBuoy,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { IssueForm } from "@/components/support/issue-form";
import { requireUser } from "@/lib/auth/guards";
import { getSupportSystemStatus } from "@/lib/db/support";

export const metadata: Metadata = { title: "Support & Maintenance" };

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const params = await searchParams;
  const status = await getSupportSystemStatus();
  const operational = status.databaseConnected;

  return (
    <div className="dashboard-page support-page">
      <div className="page-heading support-page-heading">
        <div>
          <p className="date-label">System assistance</p>
          <h1>Support & maintenance</h1>
          <p>Review service coverage and report unexpected system behavior.</p>
        </div>
        <span className={operational ? "system-status-badge system-status-operational" : "system-status-badge system-status-limited"}>
          <span aria-hidden="true" />
          {operational ? "Operational" : "Limited connectivity"}
        </span>
      </div>

      {params.submitted === "1" && (
        <div className="success-notice support-success-notice" role="status">
          <CheckCircle2 size={19} />
          <span><strong>Issue submitted.</strong> A support record was created for follow-up.</span>
        </div>
      )}

      <section className="system-status-panel" aria-labelledby="system-status-title">
        <span className="system-status-icon"><CircleGauge size={25} /></span>
        <div className="system-status-copy">
          <p className="section-kicker">System status</p>
          <h2 id="system-status-title">{operational ? "All demo services are available" : "The database connection needs attention"}</h2>
          <p>
            {operational
              ? "Authentication, employee records, leave workflows, and reporting are responding normally."
              : "Signed demo authentication remains available, but live data actions may be temporarily limited."}
          </p>
        </div>
        <div className="status-checks">
          <span><CheckCircle2 size={15} /> Signed authentication active</span>
          <span className={operational ? "" : "status-check-warning"}>
            {operational ? <CheckCircle2 size={15} /> : <LifeBuoy size={15} />}
            Database {operational ? "connected" : "unavailable"}
          </span>
          <small>Checked at {status.checkedAt}</small>
        </div>
      </section>

      <section className="support-information" aria-labelledby="support-information-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Service coverage</p>
            <h2 id="support-information-title">How support works</h2>
          </div>
          <span className="summary-year">Demo policy</span>
        </div>
        <div className="support-card-grid">
          <article className="support-info-card">
            <span><Headphones size={20} /></span>
            <h3>Technical support</h3>
            <p>Report system errors or unexpected behavior using the form below.</p>
            <small>Issues are reviewed with their category and priority.</small>
          </article>
          <article className="support-info-card">
            <span><ShieldCheck size={20} /></span>
            <h3>Warranty support</h3>
            <p>System-related bugs found during an agreed warranty period can be reviewed and corrected.</p>
            <small>Final coverage and response terms are confirmed before production delivery.</small>
          </article>
          <article className="support-info-card">
            <span><Wrench size={20} /></span>
            <h3>Maintenance</h3>
            <p>Post-warranty maintenance can be arranged through a retainer or per-request agreement.</p>
            <small>Enhancements are assessed separately from corrective support.</small>
          </article>
        </div>
      </section>

      <section className="support-form-card" aria-labelledby="report-issue-title">
        <div className="support-form-heading">
          <span><LifeBuoy size={21} /></span>
          <div>
            <p className="section-kicker">Report an issue</p>
            <h2 id="report-issue-title">Tell us what happened</h2>
            <p>Submit a concise, fictional demo issue for technical follow-up.</p>
          </div>
          <small>Submitting as {user.name}</small>
        </div>
        <IssueForm />
      </section>
    </div>
  );
}
