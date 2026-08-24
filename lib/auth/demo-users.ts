import type { DemoUser } from "@/types/auth";

export const DEMO_PASSWORD = "Demo123!";

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    email: "employee@demo.com",
    name: "Juan Dela Cruz",
    firstName: "Juan",
    role: "EMPLOYEE",
    department: "Operations",
    position: "Operations Associate",
    employeeNumber: "EMP-001",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    email: "supervisor@demo.com",
    name: "Andrea Lim",
    firstName: "Andrea",
    role: "SUPERVISOR",
    department: "Operations",
    position: "Operations Supervisor",
    employeeNumber: "EMP-004",
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    email: "admin@demo.com",
    name: "Admin User",
    firstName: "Admin",
    role: "ADMIN",
    department: "Administration",
    position: "System Administrator",
    employeeNumber: null,
  },
] as const;

export function findDemoUserByEmail(email: string) {
  return DEMO_USERS.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

export function findDemoUserById(id: string) {
  return DEMO_USERS.find((user) => user.id === id);
}

export function dashboardPathForRole(role: DemoUser["role"]) {
  return role === "EMPLOYEE" ? "/employee/dashboard" : "/admin/dashboard";
}
