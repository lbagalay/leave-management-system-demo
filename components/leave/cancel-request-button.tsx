"use client";

import { useActionState } from "react";
import { LoaderCircle, XCircle } from "lucide-react";

import { cancelLeaveRequestAction } from "@/app/employee/leave/actions";
import type { CancelRequestActionState } from "@/types/leave";

const initialCancelRequestState: CancelRequestActionState = {
  status: "idle",
  message: "",
};

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const action = cancelLeaveRequestAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(
    action,
    initialCancelRequestState,
  );

  if (state.status === "success") {
    return <span className="cancel-success">Request cancelled</span>;
  }

  return (
    <form action={formAction} className="cancel-request-form">
      <button className="cancel-request-button" type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="spin" size={14} /> : <XCircle size={14} />}
        {pending ? "Cancelling…" : "Cancel request"}
      </button>
      {state.status === "error" && <span role="alert">{state.message}</span>}
    </form>
  );
}
