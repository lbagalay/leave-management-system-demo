import type { Metadata } from "next";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  IdCard,
  LockKeyhole,
  Mail,
  UserRound,
  WalletCards,
} from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getLeaveFormData } from "@/lib/db/employee-leave";
import { currentManilaDate } from "@/lib/leave/dates";

export const metadata: Metadata = { title: "Employee Profile" };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export default async function ProfilePage() {
  const user = await requireUser(["EMPLOYEE"]);
  const year = Number(currentManilaDate().slice(0, 4));
  let leaveData = null;

  try {
    leaveData = await getLeaveFormData(user.id, year);
  } catch {
    leaveData = null;
  }

  return (
    <div className="dashboard-page employee-profile-page">
      <div className="page-heading">
        <div>
          <p className="date-label">Employee workspace</p>
          <h1>My profile</h1>
          <p>Review your employee account and current leave allocation.</p>
        </div>
        <span className="role-badge"><BadgeCheck size={14} /> Active account</span>
      </div>

      <section className="profile-identity-card" aria-labelledby="profile-identity-title">
        <span className="profile-avatar">{initials(user.name)}</span>
        <div className="profile-identity-copy">
          <p className="section-kicker">Employee account</p>
          <h2 id="profile-identity-title">{user.name}</h2>
          <span>{user.position}</span>
        </div>
        <div className="profile-access-status">
          <BadgeCheck size={18} />
          <span><strong>Access verified</strong><small>Employee permissions active</small></span>
        </div>
      </section>

      <section className="profile-details-card" aria-labelledby="profile-details-title">
        <div className="directory-heading">
          <div>
            <p className="section-kicker">Account information</p>
            <h2 id="profile-details-title">Employment details</h2>
          </div>
          <UserRound size={20} />
        </div>
        <div className="profile-detail-grid">
          <div><span><IdCard size={16} /> Employee ID</span><strong>{user.employeeNumber ?? "Not assigned"}</strong></div>
          <div><span><Mail size={16} /> Work email</span><strong>{user.email}</strong></div>
          <div><span><Building2 size={16} /> Department</span><strong>{user.department ?? "Not assigned"}</strong></div>
          <div><span><BriefcaseBusiness size={16} /> Position</span><strong>{user.position}</strong></div>
          <div><span><BadgeCheck size={16} /> Employment status</span><strong className="profile-active-value">Active</strong></div>
          <div><span><LockKeyhole size={16} /> Access role</span><strong>Employee</strong></div>
        </div>
      </section>

      <section className="profile-balance-section" aria-labelledby="profile-balances-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Leave account</p>
            <h2 id="profile-balances-title">{year} leave balances</h2>
          </div>
          <span className="summary-year">Live allocation</span>
        </div>

        {!leaveData ? (
          <div className="profile-balance-unavailable" role="status">
            <WalletCards size={21} />
            <div>
              <strong>Leave balances are temporarily unavailable</strong>
              <span>Your account information remains available. Please try again shortly.</span>
            </div>
          </div>
        ) : leaveData.balances.length === 0 ? (
          <div className="profile-balance-unavailable">
            <WalletCards size={21} />
            <div>
              <strong>No leave balances assigned</strong>
              <span>Contact Human Resources if you believe an allocation is missing.</span>
            </div>
          </div>
        ) : (
          <div className="profile-balance-grid">
            {leaveData.balances.map((balance) => (
              <article key={balance.leaveTypeId}>
                <span className="profile-balance-icon"><WalletCards size={19} /></span>
                <div>
                  <span>{balance.name}</span>
                  <strong>{balance.remainingDays} <small>/ {balance.allocatedDays} days</small></strong>
                </div>
                <small>{balance.usedDays} days used</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="profile-production-note">
        <LockKeyhole size={17} />
        <div>
          <strong>Profile changes</strong>
          <span>Employee record updates will be handled by authorized HR administrators in the production system.</span>
        </div>
      </div>
    </div>
  );
}
