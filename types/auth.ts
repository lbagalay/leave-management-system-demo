export const USER_ROLES = ["EMPLOYEE", "SUPERVISOR", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type DemoUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  role: UserRole;
  department: string | null;
  position: string;
  employeeNumber: string | null;
};

export type SessionData = {
  version: 1;
  userId: string;
  role: UserRole;
  expiresAt: number;
};
