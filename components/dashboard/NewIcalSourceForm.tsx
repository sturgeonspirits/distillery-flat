"use client";

import { useActionState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { createIcalSourceAction } from "@/app/(dashboard)/actions";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

export default function NewIcalSourceForm() {
  const [state, formAction, isPending] = useActionState(
    createIcalSourceAction,
    initialFormActionState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <Card
      title="Add iCal Source"
      description="Store a named iCal feed URL for future one-click syncing"
    >
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-4 md:grid-cols-2"
      >
        {state.error ? (
          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state.ok ? (
          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            iCal source saved.
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Source Name
          </label>
          <input
            name="source_name"
            placeholder="Booking.com"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Feed URL
          </label>
          <input
            name="feed_url"
            type="url"
            placeholder="https://example.com/calendar.ics"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save iCal Source"}
          </button>
        </div>
      </form>
    </Card>
  );
}