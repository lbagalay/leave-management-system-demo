"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Check, LoaderCircle, X, XCircle } from "lucide-react";

import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
} from "@/app/admin/requests/actions";
import { formatLeaveDateRange } from "@/lib/leave/dates";
import type { ManagementRequestDetail, ReviewRequestActionState } from "@/types/leave";

const initialReviewState: ReviewRequestActionState = {
  status: "idle",
  message: "",
};

export function RequestReviewActions({ request }: { request: ManagementRequestDetail }) {
  const approveDialog = useRef<HTMLDialogElement>(null);
  const rejectDialog = useRef<HTMLDialogElement>(null);
  const approveAction = approveLeaveRequestAction.bind(null, request.id);
  const rejectAction = rejectLeaveRequestAction.bind(null, request.id);
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialReviewState,
  );
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    initialReviewState,
  );

  useEffect(() => {
    if (approveState.status === "error" && !approveDialog.current?.open) {
      approveDialog.current?.showModal();
    }
  }, [approveState]);

  useEffect(() => {
    if (rejectState.status === "error" && !rejectDialog.current?.open) {
      rejectDialog.current?.showModal();
    }
  }, [rejectState]);

  return (
    <div className="review-actions-panel">
      <div>
        <p className="section-kicker">Decision</p>
        <h2>Review this request</h2>
        <p>Confirm the request details and current balance before taking action.</p>
      </div>
      <div className="review-action-buttons">
        <button
          type="button"
          className="reject-action-button"
          onClick={() => rejectDialog.current?.showModal()}
        >
          <XCircle size={17} /> Reject request
        </button>
        <button
          type="button"
          className="approve-action-button"
          onClick={() => approveDialog.current?.showModal()}
        >
          <Check size={17} /> Approve request
        </button>
      </div>

      <dialog className="review-dialog" ref={approveDialog}>
        <form action={approveFormAction} className="review-dialog-content">
          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close approval confirmation"
            onClick={() => approveDialog.current?.close()}
          >
            <X size={18} />
          </button>
          <span className="dialog-icon dialog-icon-approve"><Check size={23} /></span>
          <p className="section-kicker">Approval confirmation</p>
          <h2>Approve leave request?</h2>
          <div className="dialog-request-summary">
            <strong>{request.employeeName}</strong>
            <span>{request.leaveTypeName}</span>
            <span>{formatLeaveDateRange(request.startDate, request.endDate)} · {request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}</span>
          </div>
          <p>
            This will reduce the employee&apos;s {request.leaveTypeName} balance from{" "}
            <strong>{request.balanceBeforeReview ?? "—"} days</strong> to{" "}
            <strong>{request.balanceAfterApproval ?? "—"} days</strong>.
          </p>
          {approveState.status === "error" && (
            <div className="dialog-error" role="alert">
              <AlertCircle size={16} /> {approveState.message}
            </div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => approveDialog.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="dialog-confirm-approve" disabled={approvePending}>
              {approvePending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog className="review-dialog" ref={rejectDialog}>
        <form action={rejectFormAction} className="review-dialog-content">
          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close rejection confirmation"
            onClick={() => rejectDialog.current?.close()}
          >
            <X size={18} />
          </button>
          <span className="dialog-icon dialog-icon-reject"><XCircle size={23} /></span>
          <p className="section-kicker">Rejection confirmation</p>
          <h2>Reject leave request?</h2>
          <div className="dialog-request-summary">
            <strong>{request.employeeName}</strong>
            <span>{request.leaveTypeName}</span>
            <span>{formatLeaveDateRange(request.startDate, request.endDate)} · {request.numberOfDays} {request.numberOfDays === 1 ? "day" : "days"}</span>
          </div>
          <label htmlFor="reviewer-remarks">Reason / remarks</label>
          <textarea
            id="reviewer-remarks"
            name="remarks"
            rows={4}
            maxLength={500}
            placeholder="Explain why this request cannot be approved"
            aria-invalid={Boolean(rejectState.fieldErrors?.remarks)}
            required
          />
          {rejectState.fieldErrors?.remarks && (
            <span className="dialog-field-error">{rejectState.fieldErrors.remarks[0]}</span>
          )}
          <p>The employee&apos;s leave balance will not change.</p>
          {rejectState.status === "error" && (
            <div className="dialog-error" role="alert">
              <AlertCircle size={16} /> {rejectState.message}
            </div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => rejectDialog.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="dialog-confirm-reject" disabled={rejectPending}>
              {rejectPending ? <LoaderCircle className="spin" size={16} /> : <XCircle size={16} />}
              {rejectPending ? "Rejecting…" : "Reject request"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
