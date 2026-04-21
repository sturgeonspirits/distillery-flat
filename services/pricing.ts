import type { PricingSnapshot } from "@/types/pricing";
import type { PricingRule } from "@/types/pricing-rule";
import { getPricingSettings } from "@/services/pricing-settings";

export async function getPricingSnapshot(): Promise<PricingSnapshot> {
  const settings = await getPricingSettings();

  return {
    baseWeekdayRate: settings.base_weekday_rate,
    baseWeekendRate: settings.base_weekend_rate,
    distilleryPremium: settings.distillery_premium,
    eaaWeeklyTarget: settings.eaa_weekly_target,
    cleaningFee: settings.cleaning_fee,
    benchmarkMonthlyRent: settings.benchmark_monthly_rent,
  };
}

export function getAverageBaseNightlyRate(pricing: PricingSnapshot): number {
  return Math.round(
    (pricing.baseWeekdayRate * 5 + pricing.baseWeekendRate * 2) / 7,
  );
}

export function getNightsNeededToBeatBenchmark(
  targetMonthlyRent: number,
  averageNightlyRate: number,
): number {
  return Math.ceil(targetMonthlyRent / averageNightlyRate);
}

export function getDefaultNightlyRateForDate(
  date: string,
  pricing: PricingSnapshot,
): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const isWeekendNight = day === 5 || day === 6;

  return isWeekendNight
    ? pricing.baseWeekendRate
    : pricing.baseWeekdayRate;
}

export function getNightlyRateForDate(
  date: string,
  rules: PricingRule[],
  fallbackRate: number,
): number {
  const matchingRule = rules.find((rule) => {
    return date >= rule.start_date && date <= rule.end_date;
  });

  return matchingRule ? Number(matchingRule.nightly_rate) : fallbackRate;
}

export function getMinStayForDate(
  date: string,
  rules: PricingRule[],
  fallbackMinStay = 1,
): number {
  const matchingRule = rules.find((rule) => {
    return date >= rule.start_date && date <= rule.end_date;
  });

  return matchingRule ? Number(matchingRule.min_stay) : fallbackMinStay;
}
