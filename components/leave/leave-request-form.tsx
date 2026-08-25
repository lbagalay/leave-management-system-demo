"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, LoaderCircle } from "lucide-react";

import { submitLeaveRequestAction } from "@/app/employee/leave/actions";
import { calculateWeekdays } from "@/lib/leave/dates";
import type { LeaveFormData, LeaveRequestActionState } from "@/types/leave";

const initialLeaveRequestState: LeaveRequestActionState = { message: "" };

export function LeaveRequestForm({ data }: { data: LeaveFormData }) {
  const [state, formAction, pending] = useActionState(
    submitLeaveRequestAction,
    initialLeaveRequestState,
  );
  const [leaveTypeId, setLeaveTypeId] = useState(state.values?.leaveTypeId ?? "");
  const [startDate, setStartDate] = useState(state.values?.startDate ?? "");
  const [endDate, setEndDate] = useState(state.values?.endDate ?? "");
  const numberOfDays = useMemo(
    () => calculateWeekdays(startDate, endDate),
    [startDate, endDate],
  );
  const selectedBalance = data.balances.find(
    (balance) => balance.leaveTypeId === leaveTypeId,
  );
  const estimatedBalance = selectedBalance
    ? Math.max(0, selectedBalance.remainingDays - numberOfDays)
    : null;

  return (
    <form action={formAction} className="leave-form" noValidate>
      <div className="form-section-heading">
        <span className="form-section-number">1</span>
        <div>
          <h2>Leave details</h2>
          <p>Select the leave category and requested dates.</p>
        </div>
      </div>

      <div className="leave-form-grid">
        <div className="form-field form-field-wide">
          <label htmlFor="leaveTypeId">Leave type</label>
          <select
            id="leaveTypeId"
            name="leaveTypeId"
            value={leaveTypeId}
            onChange={(event) => setLeaveTypeId(event.target.value)}
            aria-describedby="leave-type-help leaveTypeId-error"
            aria-invalid={Boolean(state.fieldErrors?.leaveTypeId)}
            required
          >
            <option value="">Select a leave type</option>
            {data.leaveTypes
              .filter((leaveType) =>
                data.balances.some(
                  (balance) => balance.leaveTypeId === leaveType.id,
                ),
              )
              .map((leaveType) => (
                <option value={leaveType.id} key={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
          </select>
          <small id="leave-type-help">
            Only leave types with an assigned {data.year} balance are shown.
          </small>
          {state.fieldErrors?.leaveTypeId && (
            <span className="field-error" id="leaveTypeId-error">
              {state.fieldErrors.leaveTypeId[0]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.startDate)}
            required
          />
          {state.fieldErrors?.startDate && (
            <span className="field-error">{state.fieldErrors.startDate[0]}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.endDate)}
            required
          />
          {state.fieldErrors?.endDate && (
            <span className="field-error">{state.fieldErrors.endDate[0]}</span>
          )}
        </div>
      </div>

      <div className="leave-calculation" aria-live="polite">
        <span className="calculation-icon"><CalendarDays size={19} /></span>
        <div>
          <small>Business days requested</small>
          <strong>{numberOfDays} {numberOfDays === 1 ? "day" : "days"}</strong>
        </div>
        <p>Weekends are excluded automatically. Final validation happens when you submit.</p>
      </div>

      <div className="balance-preview">
        <div>
          <span>Current balance</span>
          <strong>{selectedBalance ? `${selectedBalance.remainingDays} days` : "Not allocated"}</strong>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
        <div>
          <span>After approval</span>
          <strong>{estimatedBalance === null ? "—" : `${estimatedBalance} days`}</strong>
        </div>
        <small>Submitting does not deduct your balance. Deduction happens only after approval.</small>
      </div>

      <div className="form-section-heading form-section-heading-reason">
        <span className="form-section-number">2</span>
        <div>
          <h2>Reason for leave</h2>
          <p>Give your supervisor enough context to review the request.</p>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          name="reason"
          rows={5}
          maxLength={500}
          defaultValue={state.values?.reason ?? ""}
          placeholder="Briefly explain the purpose of your leave request"
          aria-invalid={Boolean(state.fieldErrors?.reason)}
          required
        />
        <small>Minimum 5 characters; maximum 500.</small>
        {state.fieldErrors?.reason && (
          <span className="field-error">{state.fieldErrors.reason[0]}</span>
        )}
      </div>

      {state.message && (
        <div className="leave-form-message" role="alert">
          <AlertCircle size={18} />
          <span>{state.message}</span>
        </div>
      )}

      <div className="leave-form-footer">
        <p>Requests are submitted with Pending status for management review.</p>
        <button className="primary-button leave-submit-button" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={17} /> : <CalendarDays size={17} />}
          {pending ? "Submitting request…" : "Submit leave request"}
        </button>
      </div>
    </form>
  );
}
