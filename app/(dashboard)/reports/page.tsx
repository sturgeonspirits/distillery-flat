import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getPricingSnapshot } from "@/services/pricing";
import { getUpcomingReservations } from "@/services/reservations";
import { getDashboardMetrics } from "@/services/reports";

export default async function ReportsPage() {
  const reservations = await getUpcomingReservations();
  const pricing = getPricingSnapshot();
  const metrics = getDashboardMetrics(reservations, pricing);

  return (
    <div className="space-y-6">
      <Card
        title="Reports"
        description="Performance tracking against the current long-term rental benchmark"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">Benchmark</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.benchmarkMonthlyRent)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">
              Projected Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(metrics.projectedRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">Booked Nights</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {metrics.bookedNights}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">Difference</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(metrics.benchmarkDifference)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}