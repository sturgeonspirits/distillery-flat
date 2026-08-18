"use server";

import { redirect } from "next/navigation";
import { isPasswordAuthDisabled } from "@/lib/auth-bypass";
import {
  createSessionForUser,
  deleteSession,
  verifyPasswordCredentials,
} from "@/lib/session-auth";

export type SignInState = {
  error: string | null;
};

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (isPasswordAuthDisabled()) {
    redirect("/dashboard");
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    if (!verifyPasswordCredentials({ email, password })) {
      return { error: "Invalid email or password." };
    }

    await createSessionForUser(email.toLowerCase());
  } catch {
    return { error: "Invalid email or password." };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  if (isPasswordAuthDisabled()) {
    redirect("/dashboard");
  }

  await deleteSession();
  redirect("/login");
}
