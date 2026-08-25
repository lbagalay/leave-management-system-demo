import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, UserPlus } from "lucide-react";

import { EmployeeCreateForm } from "@/components/employees/employee-create-form";
import { requireUser } from "@/lib/auth/guards";
import { getEmployeeManagementSetup } from "@/lib/db/management-employees";

export const metadata: Metadata = { title: "Add Employee" };

export default async function AddEmployeePage() {
  const user = await requireUser(["ADMIN"]);
  let setup = null;
  try {
    setup = await getEmployeeManagementSetup(user.id);
  } catch {
    setup = null;
  }

  return (
    <div className="dashboard-page leave-page employee-create-page">
      <Link href="/admin/employees" className="back-link">
        <ArrowLeft size={15} /> Back to employees
      </Link>
      <div className="page-heading">
        <div>
          <p className="date-label">Employee administration</p>
          <h1>Add employee</h1>
          <p>Create a profile, employment record, and initial leave balances.</p>
        </div>
        <span className="role-badge"><UserPlus size={14} /> Record only</span>
      </div>

      {!setup ? (
        <div className="leave-empty-state leave-error-state">
          <Info size={28} />
          <h2>Employee setup is temporarily unavailable</h2>
          <p>Departments and leave types could not be loaded safely.</p>
        </div>
      ) : (
        <div className="leave-form-card employee-create-card">
          <EmployeeCreateForm setup={setup} />
        </div>
      )}
    </div>
  );
}
