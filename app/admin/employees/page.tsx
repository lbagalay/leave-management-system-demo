import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, UserRoundSearch } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getManagementEmployeeDirectory } from "@/lib/db/management-employees";
import type { EmploymentStatus } from "@/types/database";

export const metadata: Metadata = { title: "Employees" };

const EMPLOYMENT_FILTERS = ["ALL", "ACTIVE", "INACTIVE"] as const;
type EmploymentFilter = (typeof EMPLOYMENT_FILTERS)[number];

function employmentFilter(value: string | undefined): EmploymentFilter {
  const normalized = value?.toUpperCase();
  return EMPLOYMENT_FILTERS.includes(normalized as EmploymentFilter)
    ? (normalized as EmploymentFilter)
    : "ALL";
}

function balanceLabel(value: number | null) {
  return value === null ? "Not assigned" : `${value} days`;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; status?: string }>;
}) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const params = await searchParams;
  const search = params.q?.trim().slice(0, 80) ?? "";
  const selectedStatus = employmentFilter(params.status);
  let directory = null;

  try {
    directory = await getManagementEmployeeDirectory(user.id, user.role);
  } catch {
    directory = null;
  }

  const selectedDepartment = directory?.departments.some(
    (department) => department.id === params.department,
  )
    ? params.department ?? "ALL"
    : "ALL";
  const normalizedSearch = search.toLocaleLowerCase("en-PH");
  const employees =
    directory?.employees.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          employee.employeeNumber,
          employee.fullName,
          employee.departmentName,
          employee.position,
        ].some((value) =>
          value.toLocaleLowerCase("en-PH").includes(normalizedSearch),
        );
      const matchesDepartment =
        selectedDepartment === "ALL" ||
        employee.departmentId === selectedDepartment;
      const matchesStatus =
        selectedStatus === "ALL" ||
        employee.employmentStatus === (selectedStatus as EmploymentStatus);
      return matchesSearch && matchesDepartment && matchesStatus;
    }) ?? [];

  return (
    <div className="dashboard-page management-directory-page">
      <div className="page-heading">
        <div>
          <p className="date-label">Management workspace</p>
          <h1>Employees</h1>
          <p>
            {user.role === "SUPERVISOR"
              ? "View employee profiles and balances for your department."
              : "View employee profiles and leave balances across the company."}
          </p>
        </div>
        <span className="role-badge">
          {user.role === "ADMIN" ? "Company-wide" : `${user.department ?? "Department"} team`}
        </span>
      </div>

      <section className="employee-directory-card" aria-labelledby="employee-directory-title">
        <div className="directory-heading">
          <div>
            <p className="section-kicker">Employee directory</p>
            <h2 id="employee-directory-title">
              {directory
                ? `${employees.length} matching ${employees.length === 1 ? "employee" : "employees"}`
                : "Employee records"}
            </h2>
          </div>
          {directory && <span>{directory.balanceYear} balances</span>}
        </div>

        <form className="directory-filters" method="get">
          <label className="directory-search-field">
            <span>Search</span>
            <span className="directory-input-wrap">
              <Search size={16} />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, ID, department, or position"
              />
            </span>
          </label>
          <label>
            <span>Department</span>
            <select name="department" defaultValue={selectedDepartment}>
              <option value="ALL">All departments</option>
              {directory?.departments.map((department) => (
                <option value={department.id} key={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={selectedStatus}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <div className="directory-filter-actions">
            <button type="submit"><SlidersHorizontal size={15} /> Apply filters</button>
            <Link href="/admin/employees">Reset</Link>
          </div>
        </form>

        {!directory ? (
          <div className="leave-empty-state leave-error-state">
            <UserRoundSearch size={28} />
            <h2>Employee records are temporarily unavailable</h2>
            <p>We could not load employee data safely. Please try again shortly.</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="leave-empty-state">
            <UserRoundSearch size={28} />
            <h2>No employees match these filters</h2>
            <p>Clear a filter or try a different search term.</p>
          </div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table employee-directory-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Vacation Balance</th>
                  <th>Sick Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td data-label="Employee ID"><strong>{employee.employeeNumber}</strong></td>
                    <td data-label="Name" className="management-employee-cell">
                      <strong>{employee.fullName}</strong>
                      <small>{employee.currentLeaveStatus === "ON_LEAVE" ? "Currently on leave" : "Available"}</small>
                    </td>
                    <td data-label="Department">{employee.departmentName}</td>
                    <td data-label="Position">{employee.position}</td>
                    <td data-label="Vacation Balance" className="directory-balance-cell">
                      <strong>{balanceLabel(employee.vacationBalance?.remainingDays ?? null)}</strong>
                      {employee.vacationBalance && <small>{employee.vacationBalance.usedDays} used</small>}
                    </td>
                    <td data-label="Sick Balance" className="directory-balance-cell">
                      <strong>{balanceLabel(employee.sickBalance?.remainingDays ?? null)}</strong>
                      {employee.sickBalance && <small>{employee.sickBalance.usedDays} used</small>}
                    </td>
                    <td data-label="Status">
                      <span className={`employment-status employment-status-${employee.employmentStatus.toLowerCase()}`}>
                        <span aria-hidden="true" />
                        {employee.employmentStatus === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td data-label="Action">
                      <Link href={`/admin/employees/${employee.id}`} className="review-link">
                        View <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
