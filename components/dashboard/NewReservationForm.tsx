"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { createReservationAction } from "@/app/(dashboard)/actions";

const initialFormActionState = {
  ok: false,
  error: null as string | null,
};

type ReservationPreviewData = {
  ok: true;
  rule_name: string | null;
  nightly_rate: number;
  min_stay: number;
  nights: number;
  meets_min_stay: boolean;
  is_available: boolean;
  conflicts: Array<{
    type: "reservation" | "owner_block";
    id: string;
    label: string;
    start_date: string;
    end_date: string;
  }>;
};

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ReservationPreviewData };

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewReservationForm() {
  const [state, formAction, isPending] = useActionState(
    createReservationAction,
    initialFormActionState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCheckIn("");
      setCheckOut("");
      setPreview({ status: "idle" });
    }
  }, [state.ok]);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPreview({ status: "idle" });
      return;
    }

    const controller = new AbortController();

    async function loadPreview() {
      setPreview({ status: "loading" });

      try {
        const response = await fetch(
          `/api/reservation-preview?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Could not load reservation preview.");
        }

        setPreview({
          status: "ready",
          data,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load reservation preview.",
        });
      }
    }

    loadPreview();

    return () => controller.abort();
  }, [checkIn, checkOut]);

  const previewBlocksSubmit =
    preview.status === "ready" &&
    (!preview.data.is_available ||
      !preview.data.meets_min_stay ||
      preview.data.nightly_rate <= 0);

  return (
    <Card
      title="Add Reservation"
      description="Manual entry for direct bookings, referrals, or placeholder reservations"
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
            Reservation created.
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Guest Name
          </label>
          <input
            name="guest_name"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Channel
          </label>
          <select
            name="channel"
            defaultValue="Manual"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          >
            <option value="Manual">Manual</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Vrbo">Vrbo</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Check In
          </label>
          <input
            type="date"
            name="check_in"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            required
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
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          {preview.status === "loading" ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Checking pricing and availability…
            </div>
          ) : null}

          {preview.status === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {preview.message}
            </div>
          ) : null}

          {preview.status === "ready" ? (
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-900 px-2 py-1 text-xs font-medium text-white">
                  {preview.data.nights} night{preview.data.nights === 1 ? "" : "s"}
                </span>

                {preview.data.rule_name ? (
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                    {preview.data.rule_name}
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-200 px-2 py-1 text-xs font-medium text-stone-700">
                    No pricing rule
                  </span>
                )}

                {preview.data.is_available ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Available
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Date conflict
                  </span>
                )}

                {preview.data.meets_min_stay ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Meets minimum stay
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Below minimum stay
                  </span>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    Nightly rate
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {preview.data.nightly_rate > 0
                      ? formatMoney(preview.data.nightly_rate)
                      : "No rate"}
                  </p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    Minimum stay
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {preview.data.min_stay} night
                    {preview.data.min_stay === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    Room revenue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {preview.data.nightly_rate > 0
                      ? formatMoney(
                          preview.data.nightly_rate * preview.data.nights,
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {!preview.data.is_available ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                  <p className="font-medium">These dates are blocked:</p>
                  <ul className="mt-2 space-y-1">
                    {preview.data.conflicts.map((conflict) => (
                      <li key={conflict.id}>
                        {conflict.type === "reservation"
                          ? "Reservation"
                          : "Owner block"}
                        : {conflict.label} (
                        {formatShortDate(conflict.start_date)} –{" "}
                        {formatShortDate(conflict.end_date)})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!preview.data.meets_min_stay ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                  This stay is too short. Minimum required:{" "}
                  {preview.data.min_stay} night
                  {preview.data.min_stay === 1 ? "" : "s"}.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Status
          </label>
          <select
            name="status"
            defaultValue="confirmed"
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
            defaultValue="2"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Nightly Rate Override
          </label>
          <input
            type="number"
            name="nightly_rate"
            min="0"
            step="0.01"
            defaultValue="0"
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-stone-500">
            Leave at 0 to use the active pricing rule automatically.
          </p>
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
            defaultValue="140"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending || previewBlocksSubmit}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Reservation"}
          </button>
        </div>
      </form>
    </Card>
  );
}