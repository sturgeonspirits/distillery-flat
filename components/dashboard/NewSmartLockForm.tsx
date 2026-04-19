"use client";

import { useActionState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { createSmartLockAction } from "@/app/(dashboard)/actions";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

export default function NewSmartLockForm() {
  const [state, formAction, isPending] = useActionState(
    createSmartLockAction,
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
      title="Add Smart Lock"
      description="Register a lock for this unit so confirmed reservations can get pending access codes"
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
            Smart lock saved.
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Lock Name
          </label>
          <input
            name="name"
            placeholder="Front Door"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Provider
          </label>
          <select
            name="provider"
            defaultValue="other"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            <option value="remoteLock">RemoteLock</option>
            <option value="schlage">Schlage</option>
            <option value="yale">Yale</option>
            <option value="august">August</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            External Lock ID
          </label>
          <input
            name="external_lock_id"
            placeholder="Optional now, needed later for live provider sync"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Smart Lock"}
          </button>
        </div>
      </form>
    </Card>
  );
}