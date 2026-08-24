export const SUPPORT_CATEGORIES = [
  "Login",
  "Leave Request",
  "Approval",
  "Employee Records",
  "Reports",
  "Other",
] as const;

export const SUPPORT_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type SupportTicketActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Partial<
    Record<"title" | "category" | "description" | "priority", string[]>
  >;
  values?: {
    title: string;
    category: string;
    description: string;
    priority: string;
  };
};

export type SupportSystemStatus = {
  databaseConnected: boolean;
  checkedAt: string;
};
