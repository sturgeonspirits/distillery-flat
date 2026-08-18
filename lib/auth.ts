import { redirect } from "next/navigation";
import { getPasswordBypassUser, isPasswordAuthDisabled } from "@/lib/auth-bypass";
import { getCurrentSessionUser } from "@/lib/session-auth";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser() {
  if (isPasswordAuthDisabled()) {
    return getPasswordBypassUser();
  }

  return getCurrentSessionUser();
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function requirePageUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
