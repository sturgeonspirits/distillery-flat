"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { createSmartLockAction } from "@/app/(dashboard)/actions";
import { getDefaultUnitId, RENTAL_UNITS } from "@/lib/units";
import { SMART_LOCK_PROVIDER_OPTIONS } from "@/lib/smart-locks";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

export default function NewSmartLockForm() {
  const [accessScope, setAccessScope] = useState("unit");
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
      description="Register lock hardware for an apartment door or shared entry"
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
            Access Scope
          </label>
          <select
            name="access_scope"
            value={accessScope}
            onChange={(event) => setAccessScope(event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            <option value="unit">Apartment door</option>
            <option value="shared">Shared exterior door</option>
          </select>
        </div>

        {accessScope === "shared" ? (
          <input type="hidden" name="unit_id" value={getDefaultUnitId()} />
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Rental Space
            </label>
            <select
              name="unit_id"
              defaultValue={getDefaultUnitId()}
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            >
              {RENTAL_UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.level}, {unit.bedrooms}BR)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Lock Name
          </label>
          <input
            name="name"
            placeholder={
              accessScope === "shared"
                ? "Shared Exterior Door"
                : "Angel's Share Apartment Door"
            }
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
            defaultValue="schlage_engage"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            {SMART_LOCK_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
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
