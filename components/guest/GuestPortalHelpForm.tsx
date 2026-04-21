"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitGuestPortalHelpRequestAction } from "@/app/guest/[token]/actions";

const initialState = {
  ok: false,
  error: null as string | null,
};

type GuestPortalHelpFormProps = {
  token: string;
  guestNameDefault: string;
};

export default function GuestPortalHelpForm({
  token,
  guestNameDefault,
}: GuestPortalHelpFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitGuestPortalHelpRequestAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="access_token" value={token} />

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-stone-900">Need help?</h2>
        <p className="mt-1 text-sm text-stone-600">
          Send a message and your host will see it in the operations dashboard.
        </p>
      </div>

      {state.error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.ok ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Message received. Someone will follow up soon.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="guest_name"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Your name
          </label>
          <input
            id="guest_name"
            name="guest_name"
            defaultValue={guestNameDefault}
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="guest_email"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Email
          </label>
          <input
            id="guest_email"
            name="guest_email"
            type="email"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="guest_phone"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Phone
          </label>
          <input
            id="guest_phone"
            name="guest_phone"
            type="tel"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="message"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
            placeholder="Ask a question, share your arrival time, or tell us what you need."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
