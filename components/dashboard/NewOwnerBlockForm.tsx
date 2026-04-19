"use client";

import { useActionState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { createOwnerBlockAction } from "@/app/(dashboard)/actions";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

export default function NewOwnerBlockForm() {
  const [state, formAction, isPending] = useActionState(
    createOwnerBlockAction,
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
      title="Add Owner Block"
      description="Reserve dates for owner use, maintenance, or unavailable periods"
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
            Owner block created.
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Title
          </label>
          <input
            name="title"
            defaultValue="Owner Use"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Reason
          </label>
          <input
            name="reason"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Start Date
          </label>
          <input
            type="date"
            name="start_date"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            End Date
          </label>
          <input
            type="date"
            name="end_date"
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
            {isPending ? "Saving..." : "Save Owner Block"}
          </button>
        </div>
      </form>
    </Card>
  );
}