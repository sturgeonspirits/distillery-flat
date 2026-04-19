export type PricingRule = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  min_stay: number;
  priority: number;
};