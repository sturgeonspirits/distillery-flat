import { createClient } from "@/supabase/server";
import type { PricingRule } from "@/types/pricing-rule";

export async function getPricingRules(): Promise<PricingRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("priority", { ascending: false })
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load pricing rules: ${error.message}`);
  }

  return (data ?? []) as PricingRule[];
}

export async function createPricingRule(input: {
  name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  min_stay: number;
  priority?: number;
}): Promise<PricingRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_rules")
    .insert([
      {
        name: input.name,
        start_date: input.start_date,
        end_date: input.end_date,
        nightly_rate: input.nightly_rate,
        min_stay: input.min_stay,
        priority: input.priority ?? 1,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pricing rule: ${error.message}`);
  }

  return data as PricingRule;
}

export async function deletePricingRule(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pricing_rules")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete pricing rule: ${error.message}`);
  }
}