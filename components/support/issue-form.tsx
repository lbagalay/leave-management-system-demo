"use client";

import { useActionState } from "react";
import { AlertCircle, LoaderCircle, Send } from "lucide-react";

import { submitSupportTicketAction } from "@/app/admin/support/actions";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type SupportTicketActionState,
} from "@/types/support";

const initialState: SupportTicketActionState = {
  status: "idle",
  message: "",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export function IssueForm() {
  const [state, formAction, pending] = useActionState(
    submitSupportTicketAction,
    initialState,
  );

  return (
    <form action={formAction} className="support-issue-form" noValidate>
      <div className="support-form-grid">
        <label className="support-field support-field-wide">
          <span>Issue title</span>
          <input
            name="title"
            type="text"
            maxLength={100}
            defaultValue={state.values?.title ?? ""}
            placeholder="Brief summary of the issue"
            aria-invalid={Boolean(state.fieldErrors?.title)}
            required
          />
          {state.fieldErrors?.title && <small role="alert">{state.fieldErrors.title[0]}</small>}
        </label>

        <label className="support-field">
          <span>Category</span>
          <select
            name="category"
            defaultValue={state.values?.category ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.category)}
            required
          >
            <option value="">Select category</option>
            {SUPPORT_CATEGORIES.map((category) => (
              <option value={category} key={category}>{category}</option>
            ))}
          </select>
          {state.fieldErrors?.category && <small role="alert">{state.fieldErrors.category[0]}</small>}
        </label>

        <label className="support-field">
          <span>Priority</span>
          <select
            name="priority"
            defaultValue={state.values?.priority ?? "MEDIUM"}
            aria-invalid={Boolean(state.fieldErrors?.priority)}
            required
          >
            {SUPPORT_PRIORITIES.map((priority) => (
              <option value={priority} key={priority}>{PRIORITY_LABELS[priority]}</option>
            ))}
          </select>
          {state.fieldErrors?.priority && <small role="alert">{state.fieldErrors.priority[0]}</small>}
        </label>

        <label className="support-field support-field-wide">
          <span>Description</span>
          <textarea
            name="description"
            rows={6}
            maxLength={1000}
            defaultValue={state.values?.description ?? ""}
            placeholder="Describe what happened, what you expected, and any steps that may help reproduce it."
            aria-invalid={Boolean(state.fieldErrors?.description)}
            required
          />
          <em>Do not include passwords, access keys, or sensitive employee information.</em>
          {state.fieldErrors?.description && <small role="alert">{state.fieldErrors.description[0]}</small>}
        </label>
      </div>

      {state.status === "error" && (
        <div className="support-form-error" role="alert">
          <AlertCircle size={17} />
          <span>{state.message}</span>
        </div>
      )}

      <div className="support-form-footer">
        <p>A support record will be created for follow-up in this demo environment.</p>
        <button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
          {pending ? "Submitting issue…" : "Submit issue"}
        </button>
      </div>
    </form>
  );
}
