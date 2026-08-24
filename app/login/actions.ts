"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  DEMO_PASSWORD,
  dashboardPathForRole,
  findDemoUserByEmail,
} from "@/lib/auth/demo-users";
import { createSession } from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  const user = findDemoUserByEmail(parsed.data.email);
  if (!user || parsed.data.password !== DEMO_PASSWORD) {
    return { error: "The email or password is incorrect." };
  }

  await createSession(user.id);
  redirect(dashboardPathForRole(user.role));
}
