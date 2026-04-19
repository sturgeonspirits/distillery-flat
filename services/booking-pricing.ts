import { getPricingRules } from "@/services/pricing-rules";

type PricingRule = {
  id: string;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  nightly_rate: number | null;
  min_stay: number | null;
  priority: number | null;
};

export type StayPricingResult = {
  rule: PricingRule | null;
  nightly_rate: number;
  min_stay: number;
  nights: number;
};

function assertValidDateRange(check_in: string, check_out: string) {
  if (!check_in || !check_out) {
    throw new Error("Check-in and check-out are required.");
  }

  const start = new Date(`${check_in}T00:00:00Z`);
  const end = new Date(`${check_out}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid check-in or check-out date.");
  }

  if (end <= start) {
    throw new Error("Check-out must be after check-in.");
  }
}

function nightsBetween(check_in: string, check_out: string) {
  const start = new Date(`${check_in}T00:00:00Z`);
  const end = new Date(`${check_out}T00:00:00Z`);
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isDateInRuleRange(day: string, rule: PricingRule) {
  if (!rule.start_date || !rule.end_date) return false;
  return day >= rule.start_date && day <= rule.end_date;
}

function getStayDates(check_in: string, check_out: string) {
  const dates: string[] = [];
  const cursor = new Date(`${check_in}T00:00:00Z`);
  const end = new Date(`${check_out}T00:00:00Z`);

  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function pickHighestPriorityRule(
  rules: PricingRule[],
  day: string,
): PricingRule | null {
  const matches = rules.filter((rule) => isDateInRuleRange(day, rule));

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    const priorityDiff = (b.priority ?? 1) - (a.priority ?? 1);
    if (priorityDiff !== 0) return priorityDiff;

    const rateDiff = (b.nightly_rate ?? 0) - (a.nightly_rate ?? 0);
    if (rateDiff !== 0) return rateDiff;

    return (a.start_date ?? "").localeCompare(b.start_date ?? "");
  });

  return matches[0];
}

export async function getStayPricing(
  check_in: string,
  check_out: string,
): Promise<StayPricingResult> {
  assertValidDateRange(check_in, check_out);

  const rules = (await getPricingRules()) as PricingRule[];
  const nights = nightsBetween(check_in, check_out);
  const stayDates = getStayDates(check_in, check_out);

  const matchedRules = stayDates
    .map((day) => pickHighestPriorityRule(rules, day))
    .filter((rule): rule is PricingRule => !!rule);

  const stayRule =
    matchedRules.sort((a, b) => {
      const priorityDiff = (b.priority ?? 1) - (a.priority ?? 1);
      if (priorityDiff !== 0) return priorityDiff;

      const minStayDiff = (b.min_stay ?? 1) - (a.min_stay ?? 1);
      if (minStayDiff !== 0) return minStayDiff;

      const rateDiff = (b.nightly_rate ?? 0) - (a.nightly_rate ?? 0);
      if (rateDiff !== 0) return rateDiff;

      return (a.start_date ?? "").localeCompare(b.start_date ?? "");
    })[0] ?? null;

  const nightly_rate = stayRule?.nightly_rate ?? 0;
  const min_stay = stayRule?.min_stay ?? 1;

  return {
    rule: stayRule,
    nightly_rate,
    min_stay,
    nights,
  };
}

export async function assertStayMeetsMinimum(
  check_in: string,
  check_out: string,
) {
  const pricing = await getStayPricing(check_in, check_out);

  if (pricing.nights < pricing.min_stay) {
    const ruleName = pricing.rule?.name ? ` for ${pricing.rule.name}` : "";
    throw new Error(
      `Stay does not meet minimum night requirement${ruleName}. Minimum: ${pricing.min_stay}, requested: ${pricing.nights}.`,
    );
  }

  return pricing;
}