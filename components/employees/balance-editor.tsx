"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle, Pencil, Plus, Save, X } from "lucide-react";

import { adjustLeaveBalanceAction } from "@/app/admin/employees/actions";
import type {
  BalanceAdjustmentActionState,
  ManagementEmployeeBalance,
  ManagementLeaveType,
} from "@/types/management";

const initialState: BalanceAdjustmentActionState = {
  status: "idle",
  message: "",
};

export function BalanceEditor({
  employeeId,
  year,
  leaveType,
  balance,
}: {
  employeeId: string;
  year: number;
  leaveType: Pick<ManagementLeaveType, "id" | "name" | "defaultDays">;
  balance?: ManagementEmployeeBalance;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const action = adjustLeaveBalanceAction.bind(
    null,
    employeeId,
    leaveType.id,
    year,
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      dialog.current?.close();
      router.refresh();
    } else if (state.status === "error" && !dialog.current?.open) {
      dialog.current?.showModal();
    }
  }, [router, state]);

  const entitlement = state.values?.entitlement ?? String(balance?.allocatedDays ?? 0);
  const available = state.values?.available ?? String(balance?.remainingDays ?? 0);

  return (
    <>
      <button
        type="button"
        className={balance ? "balance-edit-button" : "balance-add-button"}
        onClick={() => dialog.current?.showModal()}
      >
        {balance ? <Pencil size={13} /> : <Plus size={14} />}
        {balance ? "Edit balance" : `Add ${leaveType.name}`}
      </button>

      <dialog className="review-dialog" ref={dialog}>
        <form action={formAction} className="review-dialog-content balance-edit-dialog">
          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close balance editor"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </button>
          <span className="dialog-icon dialog-icon-approve"><Pencil size={21} /></span>
          <p className="section-kicker">{year} leave balance</p>
          <h2>{balance ? "Edit" : "Add"} {leaveType.name}</h2>
          {balance && (
            <div className="dialog-request-summary">
              <strong>{balance.usedDays} days used</strong>
              <span>Used leave remains unchanged by this adjustment.</span>
            </div>
          )}

          <div className="balance-edit-grid">
            <label>
              <span>Entitlement</span>
              <input
                name="entitlement"
                type="number"
                min={balance?.usedDays ?? 0}
                step="0.5"
                defaultValue={entitlement}
                aria-invalid={Boolean(state.fieldErrors?.entitlement)}
                required
              />
              {state.fieldErrors?.entitlement && (
                <span className="dialog-field-error">{state.fieldErrors.entitlement[0]}</span>
              )}
            </label>
            <label>
              <span>Available now</span>
              <input
                name="available"
                type="number"
                min="0"
                step="0.5"
                defaultValue={available}
                aria-invalid={Boolean(state.fieldErrors?.available)}
                required
              />
              {state.fieldErrors?.available && (
                <span className="dialog-field-error">{state.fieldErrors.available[0]}</span>
              )}
            </label>
          </div>
          <label htmlFor={`balance-reason-${leaveType.id}`}>Adjustment reason</label>
          <textarea
            id={`balance-reason-${leaveType.id}`}
            name="reason"
            rows={4}
            maxLength={500}
            defaultValue={state.values?.reason ?? ""}
            placeholder="Explain why this balance is changing"
            aria-invalid={Boolean(state.fieldErrors?.reason)}
            required
          />
          {state.fieldErrors?.reason && (
            <span className="dialog-field-error">{state.fieldErrors.reason[0]}</span>
          )}
          <p>Saving records the old and new values in adjustment history.</p>
          {state.status === "error" && (
            <div className="dialog-error" role="alert">
              <AlertCircle size={16} /> {state.message}
            </div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
            <button type="submit" className="dialog-confirm-approve" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              {pending ? "Saving…" : "Save balance"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
