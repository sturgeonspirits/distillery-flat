import { updatePricingSettingsAction } from "@/app/(dashboard)/actions";
import type { PricingSnapshot } from "@/types/pricing";

type Props = {
  pricing: PricingSnapshot;
};

export default function BasePricingSettingsForm({ pricing }: Props) {
  return (
    <form action={updatePricingSettingsAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="base_weekday_rate"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Base weekday rate
          </label>
          <input
            id="base_weekday_rate"
            name="base_weekday_rate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.baseWeekdayRate}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="base_weekend_rate"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Base weekend rate
          </label>
          <input
            id="base_weekend_rate"
            name="base_weekend_rate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.baseWeekendRate}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="distillery_premium"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Distillery premium
          </label>
          <input
            id="distillery_premium"
            name="distillery_premium"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.distilleryPremium}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="eaa_weekly_target"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            EAA weekly target
          </label>
          <input
            id="eaa_weekly_target"
            name="eaa_weekly_target"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.eaaWeeklyTarget}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="cleaning_fee"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Cleaning fee
          </label>
          <input
            id="cleaning_fee"
            name="cleaning_fee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.cleaningFee}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="benchmark_monthly_rent"
            className="mb-1 block text-sm font-medium text-stone-900"
          >
            Monthly benchmark
          </label>
          <input
            id="benchmark_monthly_rent"
            name="benchmark_monthly_rent"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pricing.benchmarkMonthlyRent}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Save base pricing
        </button>
      </div>
    </form>
  );
}
