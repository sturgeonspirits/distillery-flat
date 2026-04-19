import Link from "next/link";
import ReservationTable from "@/components/dashboard/ReservationTable";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import { PROPERTY_NAME } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getPricingSnapshot } from "@/services/pricing";
import { getUpcomingReservations } from "@/services/reservations";
import { getDashboardMetrics } from "@/services/reports";

export default async function DashboardPage() {
  const reservations = await getUpcomingReservations();
  const pricing = getPricingSnapshot();
  const metrics = getDashboardMetrics(reservations, pricing);

  const benchmarkHelper =
    metrics.benchmarkDifference >= 0
      ? `${formatCurrency(metrics.benchmarkDifference)} above monthly benchmark`
      : `${formatCurrency(Math.abs(metrics.benchmarkDifference))} below monthly benchmark`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Live operating view for the distillery flat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/operations"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            Open Operations
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
          >
            Open Calendar
          </Link>
          <Link
            href="/reservations"
            className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900"
          >
            Manage Reservations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Projected revenue"
          value={formatCurrency(metrics.projectedRevenue)}
          helper={benchmarkHelper}
        />
        <StatCard
          label="Booked nights"
          value={String(metrics.bookedNights)}
          helper="Confirmed and active reservation nights"
        />
        <StatCard
          label="Average nightly rate"
          value={formatCurrency(metrics.avgNightlyRate)}
          helper="From current pricing baseline"
        />
        <StatCard
          label="Nights to beat benchmark"
          value={String(metrics.nightsNeeded)}
          helper="At the current average base rate"
        />
        <StatCard
          label="Upcoming reservations"
          value={String(reservations.length)}
          helper="All future reservations in the system"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Property overview">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-900">Listing concept</dt>
              <dd className="mt-1 text-zinc-600">
                Stay at Sturgeon Spirits | 3BR Distillery Flat + Tasting
              </dd>
            </div>

            <div>
              <dt className="font-medium text-zinc-900">Property</dt>
              <dd className="mt-1 text-zinc-600">{PROPERTY_NAME}</dd>
            </div>

            <div>
              <dt className="font-medium text-zinc-900">Current scope</dt>
              <dd className="mt-1 text-zinc-600">
                One live unit with reservations, owner blocks, pricing, iCal
                sync, lock-code workflow, reconciliation review, turnover
                tracking, staff calendar feed, and protected internal routes.
              </dd>
            </div>

            <div>
              <dt className="font-medium text-zinc-900">Primary data source</dt>
              <dd className="mt-1 text-zinc-600">
                Supabase reservations and operations tables.
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Current status">
          <ul className="space-y-3 text-sm text-zinc-700">
            <li>
              Auth-gated dashboard, reservations, pricing, reports, and settings
              are live.
            </li>
            <li>
              Database overlap protection is in place, and overlapping
              reservation attempts are rejected.
            </li>
            <li>
              Staff calendar ICS feed and protected internal iCal sync endpoint
              are working.
            </li>
            <li>
              Operations view is now the day-of-work screen for arrivals,
              departures, turnover status, turnover notes, owner blocks, missing
              imports, and lock-code exceptions.
            </li>
          </ul>
        </Card>

        <Card title="Current next steps">
          <ul className="space-y-3 text-sm text-zinc-700">
            <li>
              Add the first real active iCal source and confirm imported
              reservation behavior with live feed data.
            </li>
            <li>
              Confirm the scheduled sync path in Netlify after the real feed is
              connected.
            </li>
            <li>
              Rotate exposed secrets and tokens, then verify the updated values
              in Netlify production.
            </li>
            <li>
              Run one final live smoke test across login, dashboard,
              reservations, owner blocks, preview, settings, and operations.
            </li>
            <li>
              After the local workflow is stable, decide whether to add iCal
              source edit/deactivate controls and real smart-lock integration.
            </li>
          </ul>
        </Card>
      </div>

      <ReservationTable reservations={reservations} />
    </div>
  );
}