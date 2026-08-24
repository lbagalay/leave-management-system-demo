import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { findDemoUserById } from "@/lib/auth/demo-users";
import type { SessionData } from "@/types/auth";

const SESSION_COOKIE = "lms_demo_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const DEVELOPMENT_SECRET = "lms-phase-one-local-demo-session-key-2026";

function getSigningSecret() {
  return process.env.DEMO_SESSION_SECRET || DEVELOPMENT_SECRET;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodeSession(session: SessionData) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): SessionData | null {
  const [payload, providedSignature, ...rest] = value.split(".");

  if (!payload || !providedSignature || rest.length > 0) return null;

  const expectedSignature = sign(payload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionData>;

    if (
      parsed.version !== 1 ||
      typeof parsed.userId !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    const user = findDemoUserById(parsed.userId);
    if (!user || user.role !== parsed.role) return null;

    return parsed as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const user = findDemoUserById(userId);
  if (!user) throw new Error("Cannot create a session for an unknown demo user.");

  const session: SessionData = {
    version: 1,
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const session = decodeSession(value);
  return session ? findDemoUserById(session.userId) ?? null : null;
}
