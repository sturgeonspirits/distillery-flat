import Card from "@/components/ui/Card";
import BasePricingSettingsForm from "@/components/dashboard/BasePricingSettingsForm";
import NewPricingRuleForm from "@/components/dashboard/NewPricingRuleForm";
import { deletePricingRuleAction } from "@/app/(dashboard)/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getPricingSnapshot,
  getAverageBaseNightlyRate,
  getNightsNeededToBeatBenchmark,
} from "@/services/pricing";
import { getPricingRules } from "@/services/pricing-rules";

export default async function PricingPage() {
  const [pricing, rules] = await Promise.all([
    getPricingSnapshot(),
    getPricingRules(),
  ]);

  const avgBaseRate = getAverageBaseNightlyRate(pricing);
  const nightsNeeded = getNightsNeededToBeatBenchmark(
    pricing.benchmarkMonthlyRent,
    avgBaseRate,
  );

  const sortedRules = [...rules].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  return (
    <div className="space-y-6">
      <Card
        title="Base Pricing Settings"
        description="These values now live in the database and can be changed here without editing backend code."
      >
        <BasePricingSettingsForm pricing={pricing} />
      </Card>

      <Card
        title="Pricing Summary"
        description="Current base rates and benchmark math"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">Base Weekday Rate</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.baseWeekdayRate)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">Base Weekend Rate</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.baseWeekendRate)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">Distillery Premium</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.distilleryPremium)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">Cleaning Fee</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.cleaningFee)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">Monthly Benchmark</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(pricing.benchmarkMonthlyRent)}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-900">
              Average Base Nightly Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {formatCurrency(avgBaseRate)}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              About {nightsNeeded} nights/month to beat the current benchmark
            </p>
          </div>
        </div>
      </Card>

      <NewPricingRuleForm />

      <Card
        title="Active Pricing Rules"
        description="Higher priority rules override lower priority rules"
      >
        {sortedRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
            No pricing rules yet. Add your first seasonal or event-based rule above.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-900">{rule.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {formatDate(rule.start_date)} – {formatDate(rule.end_date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-stone-900">
                      {formatCurrency(Number(rule.nightly_rate))}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Min {rule.min_stay} nights · Priority {rule.priority}
                    </p>

                    <form action={deletePricingRuleAction} className="mt-3">
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}