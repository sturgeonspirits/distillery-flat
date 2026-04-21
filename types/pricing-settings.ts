export type PricingSettings = {
  unit_id: string;
  base_weekday_rate: number;
  base_weekend_rate: number;
  distillery_premium: number;
  eaa_weekly_target: number;
  cleaning_fee: number;
  benchmark_monthly_rent: number;
  created_at?: string;
  updated_at?: string;
};
