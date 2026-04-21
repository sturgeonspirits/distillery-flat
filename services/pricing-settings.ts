import { MOCK_PRICING } from "@/lib/mock-data";
import { createClient } from "@/supabase/server";
import type { PricingSettings } from "@/types/pricing-settings";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

function defaultPricingSettings(): PricingSettings {
  return {
    unit_id: UNIT_ID,
    base_weekday_rate: MOCK_PRICING.baseWeekdayRate,
    base_weekend_rate: MOCK_PRICING.baseWeekendRate,
    distillery_premium: MOCK_PRICING.distilleryPremium,
    eaa_weekly_target: MOCK_PRICING.eaaWeeklyTarget,
    cleaning_fee: MOCK_PRICING.cleaningFee,
    benchmark_monthly_rent: MOCK_PRICING.benchmarkMonthlyRent,
  };
}

function mapPricingSettingsRow(row: Record<string, unknown>): PricingSettings {
  return {
    unit_id: String(row.unit_id),
    base_weekday_rate: Number(row.base_weekday_rate ?? 0),
    base_weekend_rate: Number(row.base_weekend_rate ?? 0),
    distillery_premium: Number(row.distillery_premium ?? 0),
    eaa_weekly_target: Number(row.eaa_weekly_target ?? 0),
    cleaning_fee: Number(row.cleaning_fee ?? 0),
    benchmark_monthly_rent: Number(row.benchmark_monthly_rent ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_settings")
    .select("*")
    .eq("unit_id", UNIT_ID)
    .maybeSingle();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "42P01") {
      return defaultPricingSettings();
    }

    throw new Error(`Failed to load pricing settings: ${error.message}`);
  }

  if (!data) {
    return defaultPricingSettings();
  }

  return mapPricingSettingsRow(data as Record<string, unknown>);
}

export async function upsertPricingSettings(input: {
  base_weekday_rate: number;
  base_weekend_rate: number;
  distillery_premium: number;
  eaa_weekly_target: number;
  cleaning_fee: number;
  benchmark_monthly_rent: number;
}): Promise<PricingSettings> {
  const supabase = await createClient();

  const payload = {
    unit_id: UNIT_ID,
    base_weekday_rate: input.base_weekday_rate,
    base_weekend_rate: input.base_weekend_rate,
    distillery_premium: input.distillery_premium,
    eaa_weekly_target: input.eaa_weekly_target,
    cleaning_fee: input.cleaning_fee,
    benchmark_monthly_rent: input.benchmark_monthly_rent,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("pricing_settings")
    .upsert(payload, { onConflict: "unit_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save pricing settings: ${error.message}`);
  }

  return mapPricingSettingsRow(data as Record<string, unknown>);
}
