import type { LeaveRequestStatus } from "@/types/database";

const STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span className={`leave-status leave-status-${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
