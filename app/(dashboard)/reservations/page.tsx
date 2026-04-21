import Link from "next/link";
import Card from "@/components/ui/Card";
import NewReservationForm from "@/components/dashboard/NewReservationForm";
import {
  getReservations,
  getBookedNights,
  getReservationRevenue,
} from "@/services/reservations";
import { getPricingRules } from "@/services/pricing-rules";
import { getPricingSnapshot } from "@/services/pricing";
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

  const [reservations, pricingRules, pricing, lockCodes, smartLocks] =
    await Promise.all([
      getReservations(),
      getPricingRules(),
      getPricingSnapshot(),
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
      <NewReservationForm defaultCleaningFee={pricing.cleaningFee} />

      <Card title="Reservations">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/reservations"
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === "all"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            All Reservations
          </Link>

          <Link
            href="/reservations?filter=missing"
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === "missing"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Missing on Source ({missingCount})
          </Link>
        </div>

        {visibleReservations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600">
            {filter === "missing"
              ? "No reservations are currently missing from a source feed."
              : "No reservations yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-3 py-2">Guest</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Reconciliation</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Pricing Rule</th>
                  <th className="px-3 py-2">Lock Access</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Revenue</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {visibleReservations.map((reservation) => {
                  const nights = getBookedNights(reservation);
                  const revenue = getReservationRevenue(reservation);
                  const appliedRuleName = reservation.applied_pricing_rule_id
                    ? pricingRuleNameById.get(reservation.applied_pricing_rule_id) ??
                      "Deleted rule"
                    : "Manual / none";

                  const sourceLabel =
                    reservation.external_channel ||
                    (reservation.channel === "Manual"
                      ? "Manual entry"
                      : "Direct");

                  const reservationLockCodes =
                    lockCodesByReservationId.get(reservation.id) || [];

                  return (
                    <tr key={reservation.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-stone-900">
                          {reservation.guest_name}
                        </div>
                        <div className="text-stone-500">
                          {reservation.guest_count} guest
                          {reservation.guest_count === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        <div>
                          {formatDate(reservation.check_in)} –{" "}
                          {formatDate(reservation.check_out)}
                        </div>
                        <div className="text-stone-500">
                          {nights} night{nights === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        {reservation.channel}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        <div>{sourceLabel}</div>
                        {reservation.external_reservation_id ? (
                          <div className="text-stone-500">
                            Ref: {reservation.external_reservation_id}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getReconciliationBadgeClass(
                            reservation.reconciliation_status,
                          )}`}
                        >
                          {getReconciliationLabel(
                            reservation.reconciliation_status,
                          )}
                        </span>

                        {reservation.source_last_seen_at ? (
                          <div className="mt-1 text-xs text-stone-500">
                            Last seen:{" "}
                            {formatDateTime(reservation.source_last_seen_at)}
                          </div>
                        ) : null}

                        {reservation.source_missing_since ? (
                          <div className="mt-1 text-xs text-stone-500">
                            Missing since:{" "}
                            {formatDateTime(reservation.source_missing_since)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        {reservation.status}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        <div>{appliedRuleName}</div>
                        <div className="text-stone-500">
                          Min stay: {reservation.applied_min_stay ?? "—"}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {reservationLockCodes.length > 0 ? (
                          <div className="space-y-3">
                            {reservationLockCodes.map((lockCode) => (
                              <div
                                key={lockCode.id}
                                className="rounded-xl border border-stone-200 p-3"
                              >
                                <div className="font-medium text-stone-900">
                                  {smartLockNameById.get(lockCode.smart_lock_id) ||
                                    "Smart lock"}
                                </div>

                                <div className="mt-1 font-mono text-sm text-stone-700">
                                  {lockCode.code}
                                </div>

                                <div
                                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getLockStatusBadgeClass(
                                    lockCode.status,
                                  )}`}
                                >
                                  {lockCode.status}
                                </div>

                                <div className="mt-2 text-xs text-stone-500">
                                  <div>
                                    Start: {formatDateTime(lockCode.starts_at)}
                                  </div>
                                  <div>
                                    End: {formatDateTime(lockCode.ends_at)}
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <form action={regenerateLockAccessCodeAction}>
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={lockCode.id}
                                    />
                                    <button
                                      type="submit"
                                      className="text-xs font-medium text-stone-700 underline"
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
                                        className="text-xs font-medium text-red-600 underline"
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
                          <div className="text-stone-500">No lock code</div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-stone-700">
                        <div>
                          {formatCurrency(Number(reservation.nightly_rate))}
                        </div>
                        <div className="text-stone-500">
                          Cleaning:{" "}
                          {formatCurrency(Number(reservation.cleaning_fee))}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-medium text-stone-900">
                        {formatCurrency(revenue)}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <Link
                            href={`/reservations/${reservation.id}/edit`}
                            className="text-sm font-medium text-stone-700 underline"
                          >
                            Edit
                          </Link>

                          {reservation.status !== "cancelled" ? (
                            <form action={cancelReservationAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={reservation.id}
                              />
                              <button
                                type="submit"
                                className="text-sm font-medium text-amber-700 underline"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : null}

                          <form action={deleteReservationAction}>
                            <input
                              type="hidden"
                              name="id"
                              value={reservation.id}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-red-600 underline"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}