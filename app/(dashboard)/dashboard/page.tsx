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

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly Rent Benchmark"
          value={formatCurrency(pricing.benchmarkMonthlyRent)}
          helper="Current month-to-month baseline"
        />
        <StatCard
          label="Booked Nights"
          value={String(metrics.bookedNights)}
          helper={`About ${metrics.nightsNeeded} nights needed to beat benchmark at base rates`}
        />
        <StatCard
          label="Projected Revenue"
          value={formatCurrency(metrics.projectedRevenue)}
          helper="Live Supabase reservation data"
        />
        <StatCard
          label="Benchmark Difference"
          value={formatCurrency(metrics.benchmarkDifference)}
          helper="Projected revenue minus $1,300 monthly benchmark"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card
          title="Property Overview"
          description="Current operating setup for the live booking system"
        >
          <div className="space-y-3 text-sm text-stone-700">
            <p>
              <span className="font-medium text-stone-900">Listing concept:</span>{" "}
              Stay at Sturgeon Spirits | 3BR Distillery Flat + Tasting
            </p>
            <p>
              <span className="font-medium text-stone-900">Property:</span>{" "}
              {PROPERTY_NAME}
            </p>
            <p>
              <span className="font-medium text-stone-900">Current scope:</span>{" "}
              One live unit with reservations, owner blocks, pricing, iCal sync,
              lock-code workflow, reconciliation review, and turnover tracking
            </p>
            <p>
              <span className="font-medium text-stone-900">Data source:</span>{" "}
              Supabase reservations and operations tables
            </p>
          </div>
        </Card>

        <Card
          title="Operations"
          description="Daily arrivals, departures, turnover, and exceptions"
        >
          <div className="space-y-4 text-sm text-stone-700">
            <p>
              Use the operations view as the day-of-work screen for arrivals,
              departures, turnover status, turnover notes, owner blocks, missing
              imports, and lock-code exceptions.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/operations"
                className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Open Operations
              </Link>

              <Link
                href="/calendar"
                className="inline-flex items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900"
              >
                Open Calendar
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="What needs to happen next"
          description="Best next improvements now that operations is live"
        >
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>
                Validate the live operations flow end-to-end with real arrivals,
                departures, turnover status changes, and reconciliation reviews
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>
                Add edit and deactivate controls for iCal sources so feed issues
                can be managed without deleting source history
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>
                Improve imported reservation handling to better distinguish real
                bookings versus blocked dates when feed data allows
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>
                Only after the local workflow is stable, connect a real smart
                lock provider instead of local-only lock code records
              </span>
            </li>
          </ul>
        </Card>

        <Card
          title="Current priorities"
          description="What this dashboard now supports operationally"
        >
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>Reservation create, edit, cancel, and delete workflows</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>Owner block management and calendar visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>iCal import sync with missing-on-source review workflow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-stone-900" />
              <span>Turnover checklist status and notes on the operations page</span>
            </li>
          </ul>
        </Card>
      </section>

      <ReservationTable reservations={reservations} />
    </div>
  );
}