import { MOCK_PRICING } from "@/lib/mock-data";
import type { PricingSnapshot } from "@/types/pricing";
import type { PricingRule } from "@/types/pricing-rule";

export function getPricingSnapshot(): PricingSnapshot {
  return MOCK_PRICING;
}

export function getAverageBaseNightlyRate(pricing: PricingSnapshot): number {
  return Math.round((pricing.baseWeekdayRate * 5 + pricing.baseWeekendRate * 2) / 7);
}

export function getNightsNeededToBeatBenchmark(
  targetMonthlyRent: number,
  averageNightlyRate: number,
): number {
  return Math.ceil(targetMonthlyRent / averageNightlyRate);
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