"use client";

import { useActionState, useEffect, useRef } from "react";
import { upsertGuestPortalContentAction } from "@/app/(dashboard)/actions";

const initialState = {
  ok: false,
  error: null as string | null,
};

export default function NewGuestPortalSectionForm() {
  const [state, formAction, isPending] = useActionState(
    upsertGuestPortalContentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.ok ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Guest portal section saved.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="section_key"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Section key
          </label>
          <input
            id="section_key"
            name="section_key"
            required
            placeholder="welcome"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-stone-500">
            Reuse the same key later to update an existing section.
          </p>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Welcome to your stay"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="sort_order"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Sort order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min="0"
            step="1"
            defaultValue={100}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="h-4 w-4"
            />
            Section is active
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="body"
          className="mb-1 block text-sm font-medium text-stone-900"
        >
          Body
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          placeholder="Add the text guests should see in this section."
          className="w-full rounded-xl border border-stone-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-stone-500">
          Use blank lines to separate paragraphs.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Section"}
        </button>
      </div>
    </form>
  );
}
