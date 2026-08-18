import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
  type AppUser,
} from "@/lib/session-token";

export type { AppUser };

const LOCAL_AUTH_DISABLED_USER: AppUser = {
  id: "admin",
  email: "local@distilleryflats.local",
};

function isPasswordAuthDisabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DISABLE_PASSWORD_AUTH?.trim().toLowerCase() === "true"
  );
}

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.APP_ADMIN_EMAIL?.trim() ||
    ""
  );
}

function getAdminPassword() {
  return (
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.APP_ADMIN_PASSWORD?.trim() ||
    ""
  );
}

function constantTimeEquals(a: string, b: string) {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();

  return timingSafeEqual(aHash, bHash);
}

export async function getCurrentSessionUser() {
  if (isPasswordAuthDisabled()) {
    return {
      ...LOCAL_AUTH_DISABLED_USER,
      email: getAdminEmail() || LOCAL_AUTH_DISABLED_USER.email,
    };
  }

  const cookieStore = await cookies();

  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function createSessionForUser(email: string) {
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = await createSessionToken({
    sub: "admin",
    email,
    exp: expiresAtSeconds,
    nonce: randomBytes(16).toString("hex"),
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function verifyPasswordCredentials(input: {
  email: string;
  password: string;
}) {
  if (isPasswordAuthDisabled()) {
    return true;
  }

  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();

  if (!adminEmail || !adminPassword) {
    throw new Error("Missing ADMIN_EMAIL and ADMIN_PASSWORD.");
  }

  return (
    constantTimeEquals(input.email.trim().toLowerCase(), adminEmail.toLowerCase()) &&
    constantTimeEquals(input.password, adminPassword)
  );
}
