"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { updateReservationAction } from "@/app/(dashboard)/actions";
import type { Reservation } from "@/types/reservation";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

type EditReservationFormProps = {
  reservation: Reservation;
};

export default function EditReservationForm({
  reservation,
}: EditReservationFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updateReservationAction,
    initialFormActionState,
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/reservations");
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <Card
      title="Edit Reservation"
      description="Update booking details and re-run pricing and conflict checks"
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={reservation.id} />

        {state.error ? (
          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Guest Name
          </label>
          <input
            name="guest_name"
            required
            defaultValue={reservation.guest_name}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Channel
          </label>
          <select
            name="channel"
            defaultValue={reservation.channel}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            <option value="Manual">Manual</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Vrbo">Vrbo</option>
            <option value="iCal">iCal</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Check In
          </label>
          <input
            type="date"
            name="check_in"
            required
            defaultValue={reservation.check_in}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Check Out
          </label>
          <input
            type="date"
            name="check_out"
            required
            defaultValue={reservation.check_out}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Status
          </label>
          <select
            name="status"
            defaultValue={reservation.status}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            <option value="inquiry">Inquiry</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Guest Count
          </label>
          <input
            type="number"
            name="guest_count"
            min="1"
            defaultValue={reservation.guest_count}
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Nightly Rate
          </label>
          <input
            type="number"
            name="nightly_rate"
            min="0"
            step="0.01"
            defaultValue={reservation.nightly_rate}
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Cleaning Fee
          </label>
          <input
            type="number"
            name="cleaning_fee"
            min="0"
            step="0.01"
            defaultValue={reservation.cleaning_fee}
            required
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
            onClick={() => router.push("/reservations")}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}