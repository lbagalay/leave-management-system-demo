"use client";

import { useActionState } from "react";
import { AlertCircle, LoaderCircle, UserPlus } from "lucide-react";

import { createEmployeeAction } from "@/app/admin/employees/actions";
import type {
  CreateEmployeeActionState,
  EmployeeManagementSetup,
} from "@/types/management";

const initialState: CreateEmployeeActionState = {
  status: "idle",
  message: "",
};

export function EmployeeCreateForm({ setup }: { setup: EmployeeManagementSetup }) {
  const [state, formAction, pending] = useActionState(
    createEmployeeAction,
    initialState,
  );
  const value = (name: keyof NonNullable<CreateEmployeeActionState["values"]>) =>
    String(state.values?.[name] ?? "");

  return (
    <form action={formAction} className="employee-create-form" noValidate>
      <div className="form-section-heading">
        <span className="form-section-number">1</span>
        <div>
          <h2>Employee profile</h2>
          <p>Create an administrative employee record without provisioning login credentials.</p>
        </div>
      </div>

      <div className="employee-create-grid">
        <FormField label="First name" error={state.fieldErrors?.firstName?.[0]}>
          <input name="firstName" defaultValue={value("firstName")} maxLength={80} required />
        </FormField>
        <FormField label="Last name" error={state.fieldErrors?.lastName?.[0]}>
          <input name="lastName" defaultValue={value("lastName")} maxLength={80} required />
        </FormField>
        <FormField label="Employee ID" error={state.fieldErrors?.employeeNumber?.[0]}>
          <input name="employeeNumber" defaultValue={value("employeeNumber")} maxLength={40} required />
        </FormField>
        <FormField label="Email" error={state.fieldErrors?.email?.[0]}>
          <input name="email" type="email" defaultValue={value("email")} maxLength={254} required />
        </FormField>
        <FormField label="Department" error={state.fieldErrors?.departmentId?.[0]}>
          <select name="departmentId" defaultValue={value("departmentId")} required>
            <option value="">Select a department</option>
            {setup.departments.map((department) => (
              <option value={department.id} key={department.id}>{department.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Position" error={state.fieldErrors?.position?.[0]}>
          <input name="position" defaultValue={value("position")} maxLength={120} required />
        </FormField>
        <FormField label="Hire date" error={state.fieldErrors?.hireDate?.[0]}>
          <input
            name="hireDate"
            type="date"
            max={setup.currentDate}
            defaultValue={value("hireDate")}
            required
          />
        </FormField>
        <FormField label="Employment status" error={state.fieldErrors?.employmentStatus?.[0]}>
          <select name="employmentStatus" defaultValue={value("employmentStatus") || "ACTIVE"} required>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </FormField>
      </div>

      <div className="form-section-heading employee-balance-form-heading">
        <span className="form-section-number">2</span>
        <div>
          <h2>{setup.balanceYear} leave balances</h2>
          <p>Set the initial entitlement and available balance for each active leave type.</p>
        </div>
      </div>

      <div className="employee-initial-balances">
        {setup.leaveTypes.map((leaveType) => {
          const saved = state.values?.balances[leaveType.id];
          return (
            <fieldset key={leaveType.id}>
              <legend>{leaveType.name}</legend>
              <label>
                <span>Entitlement</span>
                <input
                  name={`entitlement:${leaveType.id}`}
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue={saved?.entitlement ?? leaveType.defaultDays}
                  required
                />
              </label>
              <label>
                <span>Available</span>
                <input
                  name={`available:${leaveType.id}`}
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue={saved?.available ?? leaveType.defaultDays}
                  required
                />
              </label>
            </fieldset>
          );
        })}
      </div>
      {state.fieldErrors?.balances && (
        <div className="field-error employee-balance-errors">
          {state.fieldErrors.balances.map((error) => <span key={error}>{error}</span>)}
        </div>
      )}

      {state.status === "error" && (
        <div className="leave-form-message" role="alert">
          <AlertCircle size={18} /> <span>{state.message}</span>
        </div>
      )}

      <div className="leave-form-footer">
        <p>The record can be managed in admin. No demo login identity will be added.</p>
        <button type="submit" className="primary-button leave-submit-button" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={17} /> : <UserPlus size={17} />}
          {pending ? "Adding employee…" : "Add employee"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
