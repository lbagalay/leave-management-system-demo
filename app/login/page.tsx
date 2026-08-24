import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand-mark";
import { dashboardPathForRole } from "@/lib/auth/demo-users";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPathForRole(user.role));

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="login-intro-inner">
          <BrandMark inverted />
          <div className="login-intro-copy">
            <p className="intro-kicker">Simple. Clear. Accountable.</p>
            <h2>Leave management that keeps everyone aligned.</h2>
            <p>
              One secure workspace for employees, supervisors, and administrators to manage leave with confidence.
            </p>
          </div>
          <div className="trust-list" aria-label="System benefits">
            <span><CheckCircle2 size={18} /> Clear role-based access</span>
            <span><ShieldCheck size={18} /> Protected employee information</span>
            <span><LockKeyhole size={18} /> Secure session management</span>
          </div>
          <p className="login-intro-footer">Internal system · Authorized access only</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-mobile-brand"><BrandMark /></div>
        <LoginForm />
        <p className="login-copyright">© 2026 Demo Company. Prototype environment.</p>
      </section>
    </main>
  );
}
