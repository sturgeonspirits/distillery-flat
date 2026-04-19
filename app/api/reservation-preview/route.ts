import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAvailabilityConflicts } from "@/services/availability";
import { getStayPricing } from "@/services/booking-pricing";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

export async function GET(request: NextRequest) {
  await requireUser();

  const check_in = request.nextUrl.searchParams.get("check_in") || "";
  const check_out = request.nextUrl.searchParams.get("check_out") || "";

  if (!check_in || !check_out) {
    return NextResponse.json(
      {
        ok: false,
        error: "Check-in and check-out are required.",
      },
      { status: 400 },
    );
  }

  try {
    const [pricing, conflicts] = await Promise.all([
      getStayPricing(check_in, check_out),
      getAvailabilityConflicts({
        unit_id: UNIT_ID,
        start_date: check_in,
        end_date: check_out,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      rule_name: pricing.rule?.name ?? null,
      nightly_rate: pricing.nightly_rate,
      min_stay: pricing.min_stay,
      nights: pricing.nights,
      meets_min_stay: pricing.nights >= pricing.min_stay,
      is_available: conflicts.length === 0,
      conflicts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not generate reservation preview.",
      },
      { status: 400 },
    );
  }
}