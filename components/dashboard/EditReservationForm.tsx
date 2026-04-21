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
  defaultCleaningFee: number;
};

export default function EditReservationForm({
  reservation,
  defaultCleaningFee,
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

  const cleaningFeeDefault =
    Number(reservation.cleaning_fee) > 0
      ? Number(reservation.cleaning_fee)
      : defaultCleaningFee;

  return (
    <Card
      title="Edit Reservation"
      description="Update reservation details and pricing."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={reservation.id} />

        {state.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="guest_name"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Guest Name
            </label>
            <input
              id="guest_name"
              name="guest_name"
              defaultValue={reservation.guest_name}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="channel"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Channel
            </label>
            <select
              id="channel"
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
            <label
              htmlFor="check_in"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Check In
            </label>
            <input
              id="check_in"
              name="check_in"
              type="date"
              defaultValue={reservation.check_in}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="check_out"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Check Out
            </label>
            <input
              id="check_out"
              name="check_out"
              type="date"
              defaultValue={reservation.check_out}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Status
            </label>
            <select
              id="status"
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
            <label
              htmlFor="guest_count"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Guest Count
            </label>
            <input
              id="guest_count"
              name="guest_count"
              type="number"
              min="1"
              step="1"
              defaultValue={reservation.guest_count}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="nightly_rate"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Nightly Rate
            </label>
            <input
              id="nightly_rate"
              name="nightly_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={Number(reservation.nightly_rate)}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="cleaning_fee"
              className="mb-1 block text-sm font-medium text-stone-900"
            >
              Cleaning Fee
            </label>
            <input
              id="cleaning_fee"
              name="cleaning_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={cleaningFeeDefault}
              className="w-full rounded-xl border border-stone-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-stone-500">
              Defaults to the reservation’s current value, or the latest base
              pricing cleaning fee if no value is set.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
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