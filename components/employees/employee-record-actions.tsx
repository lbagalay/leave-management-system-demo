"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Save,
  UserMinus,
  X,
} from "lucide-react";

import {
  updateEmploymentStatusAction,
  updateHireDateAction,
} from "@/app/admin/employees/actions";
import type { EmploymentStatus } from "@/types/database";
import type { EmployeeManagementActionState } from "@/types/management";

const initialState: EmployeeManagementActionState = {
  status: "idle",
  message: "",
};

export function EmployeeRecordActions({
  employeeId,
  employeeName,
  hireDate,
  employmentStatus,
  currentDate,
}: {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  employmentStatus: EmploymentStatus;
  currentDate: string;
}) {
  const hireDialog = useRef<HTMLDialogElement>(null);
  const statusDialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const hireAction = updateHireDateAction.bind(null, employeeId);
  const targetStatus = employmentStatus === "ACTIVE" ? "RESIGNED" : "ACTIVE";
  const statusAction = updateEmploymentStatusAction.bind(
    null,
    employeeId,
    targetStatus,
  );
  const [hireState, hireFormAction, hirePending] = useActionState(
    hireAction,
    initialState,
  );
  const [statusState, statusFormAction, statusPending] = useActionState(
    statusAction,
    initialState,
  );

  useEffect(() => {
    if (hireState.status === "success") {
      hireDialog.current?.close();
      router.refresh();
    } else if (hireState.status === "error" && !hireDialog.current?.open) {
      hireDialog.current?.showModal();
    }
  }, [hireState, router]);

  useEffect(() => {
    if (statusState.status === "success") {
      statusDialog.current?.close();
      router.refresh();
    } else if (statusState.status === "error" && !statusDialog.current?.open) {
      statusDialog.current?.showModal();
    }
  }, [router, statusState]);

  return (
    <section className="employee-record-actions" aria-labelledby="employee-record-actions-title">
      <div>
        <p className="section-kicker">Admin controls</p>
        <h2 id="employee-record-actions-title">Manage employment record</h2>
        <p>Update the hire date or employment status without changing login identities or history.</p>
      </div>
      <div className="employee-record-action-buttons">
        <button type="button" onClick={() => hireDialog.current?.showModal()}>
          <CalendarDays size={15} /> Edit hire date
        </button>
        <button
          type="button"
          className={targetStatus === "RESIGNED" ? "employee-resign-button" : "employee-reactivate-button"}
          onClick={() => statusDialog.current?.showModal()}
        >
          {targetStatus === "RESIGNED" ? <UserMinus size={15} /> : <RotateCcw size={15} />}
          {targetStatus === "RESIGNED" ? "Mark as resigned" : "Reactivate"}
        </button>
      </div>
      {(hireState.status === "success" || statusState.status === "success") && (
        <div className="employee-action-success" role="status">
          <CheckCircle2 size={16} /> {hireState.status === "success" ? hireState.message : statusState.message}
        </div>
      )}

      <dialog className="review-dialog" ref={hireDialog}>
        <form action={hireFormAction} className="review-dialog-content">
          <button type="button" className="dialog-close-button" aria-label="Close hire date editor" onClick={() => hireDialog.current?.close()}>
            <X size={18} />
          </button>
          <span className="dialog-icon dialog-icon-approve"><CalendarDays size={21} /></span>
          <p className="section-kicker">Employment record</p>
          <h2>Edit hire date</h2>
          <p>Tenure is calculated automatically from the saved hire date.</p>
          <label htmlFor="employee-hire-date">Hire date</label>
          <input id="employee-hire-date" name="hireDate" type="date" max={currentDate} defaultValue={hireDate} required />
          {hireState.status === "error" && (
            <div className="dialog-error" role="alert"><AlertCircle size={16} /> {hireState.message}</div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => hireDialog.current?.close()}>Cancel</button>
            <button type="submit" className="dialog-confirm-approve" disabled={hirePending}>
              {hirePending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              {hirePending ? "Saving…" : "Save hire date"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog className="review-dialog" ref={statusDialog}>
        <form action={statusFormAction} className="review-dialog-content">
          <button type="button" className="dialog-close-button" aria-label="Close status confirmation" onClick={() => statusDialog.current?.close()}>
            <X size={18} />
          </button>
          <span className={`dialog-icon ${targetStatus === "RESIGNED" ? "dialog-icon-reject" : "dialog-icon-approve"}`}>
            {targetStatus === "RESIGNED" ? <UserMinus size={21} /> : <RotateCcw size={21} />}
          </span>
          <p className="section-kicker">Employment status</p>
          <h2>{targetStatus === "RESIGNED" ? "Mark as resigned?" : "Reactivate employee?"}</h2>
          <div className="dialog-request-summary"><strong>{employeeName}</strong></div>
          <p>
            {targetStatus === "RESIGNED"
              ? "The employee will leave the default active list and cannot submit new requests. Their profile, balances, and leave history will remain available."
              : "The employee will return to the active list and can submit leave requests through any existing demo identity linked to this record."}
          </p>
          {statusState.status === "error" && (
            <div className="dialog-error" role="alert"><AlertCircle size={16} /> {statusState.message}</div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => statusDialog.current?.close()}>Cancel</button>
            <button
              type="submit"
              className={targetStatus === "RESIGNED" ? "dialog-confirm-reject" : "dialog-confirm-approve"}
              disabled={statusPending}
            >
              {statusPending ? <LoaderCircle className="spin" size={16} /> : targetStatus === "RESIGNED" ? <UserMinus size={16} /> : <RotateCcw size={16} />}
              {statusPending ? "Updating…" : targetStatus === "RESIGNED" ? "Confirm resignation" : "Reactivate"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
