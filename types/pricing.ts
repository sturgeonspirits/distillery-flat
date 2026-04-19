export type RateRule = {
  id: string;
  name: string;
  amount: number;
  type: "base" | "weekend" | "event" | "manual_override";
};

export type PricingSnapshot = {
  baseWeekdayRate: number;
  baseWeekendRate: number;
  distilleryPremium: number;
  eaaWeeklyTarget: number;
  cleaningFee: number;
  benchmarkMonthlyRent: number;
};