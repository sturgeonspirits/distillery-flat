import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getPricingSnapshot } from "@/services/pricing";
import { getUpcomingReservations } from "@/services/reservations";
import { getDashboardMetrics } from "@/services/reports";

export default async function ReportsPage() {
  const reservations = await getUpcomingReservations();
  const pricing = await getPricingSnapshot();
  const metrics = getDashboardMetrics(reservations, pricing);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Benchmark">
          <p className="text-2xl font-semibold">
            {formatCurrency(pricing.benchmarkMonthlyRent)}
          </p>
        </Card>

        <Card title="Projected Revenue">
          <p className="text-2xl font-semibold">
            {formatCurrency(metrics.projectedRevenue)}
          </p>
        </Card>

        <Card title="Booked Nights">
          <p className="text-2xl font-semibold">{metrics.bookedNights}</p>
        </Card>

        <Card title="Difference">
          <p className="text-2xl font-semibold">
            {formatCurrency(metrics.benchmarkDifference)}
          </p>
        </Card>
      </div>
    </div>
  );
}