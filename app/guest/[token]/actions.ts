"use server";

import { revalidatePath } from "next/cache";
import { createGuestPortalMessageRequestByToken } from "@/services/guest-portal";

type FormActionState = {
  ok: boolean;
  error: string | null;
};

export async function submitGuestPortalHelpRequestAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    const access_token = String(formData.get("access_token") || "");
    const guest_name = String(formData.get("guest_name") || "").trim();
    const guest_email = String(formData.get("guest_email") || "").trim();
    const guest_phone = String(formData.get("guest_phone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!access_token) {
      return { ok: false, error: "This portal link is missing its access token." };
    }

    if (!guest_name) {
      return { ok: false, error: "Your name is required." };
    }

    if (!message) {
      return { ok: false, error: "Please enter a message." };
    }

    await createGuestPortalMessageRequestByToken({
      access_token,
      guest_name,
      guest_email: guest_email || null,
      guest_phone: guest_phone || null,
      message,
    });

    revalidatePath(`/guest/${access_token}`);

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not submit your message.",
    };
  }
}
