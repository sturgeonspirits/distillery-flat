import Link from "next/link";
import Card from "@/components/ui/Card";
import NewReservationForm from "@/components/dashboard/NewReservationForm";
import {
  getReservations,
  getBookedNights,
  getReservationRevenue,
} from "@/services/reservations";
import { getPricingRules } from "@/services/pricing-rules";
import { getLockAccessCodes } from "@/services/lock-access-codes";
import { getSmartLocks } from "@/services/locks";
import {
  cancelReservationAction,
  deleteReservationAction,
  regenerateLockAccessCodeAction,
  revokeLockAccessCodeAction,
} from "@/app/(dashboard)/actions";
import { formatCurrency, formatDate } from "@/lib/format";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

type ReservationsPageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLockStatusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "revoked":
      return "bg-red-100 text-red-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "expired":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getReconciliationBadgeClass(status: string | null) {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-700";
    case "missing_on_source":
      return "bg-red-100 text-red-700";
    case "manual_override":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getReconciliationLabel(status: string | null) {
  switch (status) {
    case "ok":
      return "In source";
    case "missing_on_source":
      return "Missing on source";
    case "manual_override":
      return "Manual override";
    default:
      return "—";
  }
}

export default async function ReservationsPage({
  searchParams,
}: ReservationsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filter = resolvedSearchParams.filter === "missing" ? "missing" : "all";

  const [reservations, pricingRules, lockCodes, smartLocks] = await Promise.all([
    getReservations(),
    getPricingRules(),
    getLockAccessCodes(),
    getSmartLocks(UNIT_ID),
  ]);

  const pricingRuleNameById = new Map(
    pricingRules.map((rule) => [rule.id, rule.name || "Unnamed rule"]),
  );

  const smartLockNameById = new Map(
    smartLocks.map((lock) => [lock.id, lock.name]),
  );

  const lockCodesByReservationId = new Map<
    string,
    Array<(typeof lockCodes)[number]>
  >();

  for (const lockCode of lockCodes) {
    if (!lockCode.reservation_id) continue;

    const existing = lockCodesByReservationId.get(lockCode.reservation_id) || [];
    existing.push(lockCode);
    lockCodesByReservationId.set(lockCode.reservation_id, existing);
  }

  const missingCount = reservations.filter(
    (reservation) => reservation.reconciliation_status === "missing_on_source",
  ).length;

  const visibleReservations =
    filter === "missing"
      ? reservations.filter(
          (reservation) =>
            reservation.reconciliation_status === "missing_on_source",
        )
      : reservations;

  return (
    <div className="space-y-6">
      <NewReservationForm />

      <Card
        title="Reservations"
        description="All direct, imported, and manual bookings"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/reservations"
            className={[
              "rounded-lg border px-3 py-1.5 text-sm",
              filter === "all"
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            All Reservations
          </Link>

          <Link
            href="/reservations?filter=missing"
            className={[
              "rounded-lg border px-3 py-1.5 text-sm",
              filter === "missing"
                ? "border-red-700 bg-red-700 text-white"
                : "border-red-200 text-red-700 hover:bg-red-50",
            ].join(" ")}
          >
            Missing on Source ({missingCount})
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Reconciliation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pricing Rule</th>
                <th className="px-4 py-3 font-medium">Lock Access</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200">
              {visibleReservations.map((reservation) => {
                const nights = getBookedNights(reservation);
                const revenue = getReservationRevenue(reservation);

                const appliedRuleName = reservation.applied_pricing_rule_id
                  ? pricingRuleNameById.get(reservation.applied_pricing_rule_id) ??
                    "Deleted rule"
                  : "Manual / none";

                const sourceLabel =
                  reservation.external_channel ||
                  (reservation.channel === "Manual" ? "Manual entry" : "Direct");

                const reservationLockCodes =
                  lockCodesByReservationId.get(reservation.id) || [];

                return (
                  <tr key={reservation.id} className="align-top">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-stone-900">
                          {reservation.guest_name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {reservation.guest_count} guest
                          {reservation.guest_count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <div>
                        <p>
                          {formatDate(reservation.check_in)} –{" "}
                          {formatDate(reservation.check_out)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {nights} night{nights === 1 ? "" : "s"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">
                        {reservation.channel}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <div>
                        <p>{sourceLabel}</p>
                        {reservation.external_reservation_id ? (
                          <p className="mt-1 text-xs text-stone-500">
                            Ref: {reservation.external_reservation_id}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <div>
                        <span
                          className={[
                            "rounded-full px-2 py-1 text-xs font-medium",
                            getReconciliationBadgeClass(
                              reservation.reconciliation_status,
                            ),
                          ].join(" ")}
                        >
                          {getReconciliationLabel(
                            reservation.reconciliation_status,
                          )}
                        </span>

                        {reservation.source_last_seen_at ? (
                          <p className="mt-1 text-xs text-stone-500">
                            Last seen:{" "}
                            {formatDateTime(reservation.source_last_seen_at)}
                          </p>
                        ) : null}

                        {reservation.source_missing_since ? (
                          <p className="mt-1 text-xs text-red-600">
                            Missing since:{" "}
                            {formatDateTime(reservation.source_missing_since)}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">
                        {reservation.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <div>
                        <p>{appliedRuleName}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          Min stay: {reservation.applied_min_stay ?? "—"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      {reservationLockCodes.length > 0 ? (
                        <div className="space-y-2">
                          {reservationLockCodes.map((lockCode) => (
                            <div
                              key={lockCode.id}
                              className="rounded-lg border border-stone-200 bg-stone-50 p-2"
                            >
                              <p className="text-xs font-medium text-stone-900">
                                {smartLockNameById.get(lockCode.smart_lock_id) ||
                                  "Smart lock"}
                              </p>
                              <p className="mt-1 font-mono text-sm text-stone-900">
                                {lockCode.code}
                              </p>
                              <p className="mt-1">
                                <span
                                  className={[
                                    "rounded-full px-2 py-1 text-[10px] font-medium",
                                    getLockStatusBadgeClass(lockCode.status),
                                  ].join(" ")}
                                >
                                  {lockCode.status}
                                </span>
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                Start: {formatDateTime(lockCode.starts_at)}
                              </p>
                              <p className="text-xs text-stone-500">
                                End: {formatDateTime(lockCode.ends_at)}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <form action={regenerateLockAccessCodeAction}>
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={lockCode.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
                                  >
                                    Regenerate
                                  </button>
                                </form>

                                {lockCode.status !== "revoked" ? (
                                  <form action={revokeLockAccessCodeAction}>
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={lockCode.id}
                                    />
                                    <button
                                      type="submit"
                                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                                    >
                                      Revoke
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">No lock code</p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-stone-700">
                      <div>
                        <p>{formatCurrency(Number(reservation.nightly_rate))}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          Cleaning:{" "}
                          {formatCurrency(Number(reservation.cleaning_fee))}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium text-stone-900">
                      {formatCurrency(revenue)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/reservations/${reservation.id}/edit`}
                          className="rounded-lg border border-stone-300 px-3 py-1.5 text-center text-xs font-medium text-stone-700 hover:bg-stone-50"
                        >
                          Edit
                        </Link>

                        {reservation.status !== "cancelled" ? (
                          <form action={cancelReservationAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : null}

                        <form action={deleteReservationAction}>
                          <input type="hidden" name="id" value={reservation.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {visibleReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-stone-500"
                  >
                    {filter === "missing"
                      ? "No reservations are currently missing from a source feed."
                      : "No reservations yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}