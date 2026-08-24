import { BadgeCheck, BriefcaseBusiness, Building2, IdCard } from "lucide-react";

import type { DemoUser } from "@/types/auth";

type AccountOverviewProps = {
  user: DemoUser;
};

export function AccountOverview({ user }: AccountOverviewProps) {
  const roleName = user.role === "ADMIN" ? "Administrator" : user.role === "SUPERVISOR" ? "Supervisor" : "Employee";
  const items = [
    {
      label: "Access level",
      value: roleName,
      detail: "Role verified",
      icon: BadgeCheck,
    },
    {
      label: "Department",
      value: user.department ?? "All departments",
      detail: user.role === "ADMIN" ? "Company-wide access" : "Primary assignment",
      icon: Building2,
    },
    {
      label: user.employeeNumber ? "Employee ID" : "Position",
      value: user.employeeNumber ?? user.position,
      detail: user.employeeNumber ? user.position : "System administration",
      icon: user.employeeNumber ? IdCard : BriefcaseBusiness,
    },
  ];

  return (
    <section aria-labelledby="account-overview-title">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Account overview</p>
          <h2 id="account-overview-title">Your workspace details</h2>
        </div>
        <span className="status-pill">
          <span className="status-dot" /> Active
        </span>
      </div>
      <div className="overview-grid">
        {items.map(({ label, value, detail, icon: Icon }) => (
          <article className="overview-card" key={label}>
            <span className="overview-icon">
              <Icon size={20} />
            </span>
            <div>
              <span className="overview-label">{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
