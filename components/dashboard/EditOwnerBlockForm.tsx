"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { updateOwnerBlockAction } from "@/app/(dashboard)/actions";
import type { OwnerBlock } from "@/types/owner-block";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

type EditOwnerBlockFormProps = {
  ownerBlock: OwnerBlock;
};

export default function EditOwnerBlockForm({
  ownerBlock,
}: EditOwnerBlockFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updateOwnerBlockAction,
    initialFormActionState,
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/calendar");
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <Card
      title="Edit Owner Block"
      description="Update unavailable dates for owner use, maintenance, or other internal holds"
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={ownerBlock.id} />

        {state.error ? (
          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Title
          </label>
          <input
            name="title"
            required
            defaultValue={ownerBlock.title}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Reason
          </label>
          <input
            name="reason"
            defaultValue={ownerBlock.reason || ""}
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
            defaultValue={ownerBlock.start_date}
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
            defaultValue={ownerBlock.end_date}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}