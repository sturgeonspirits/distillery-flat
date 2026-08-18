import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertRentalUnitId, getDefaultUnitId } from "@/lib/units";
import { getAvailabilityConflicts } from "@/services/availability";
import { getStayPricing } from "@/services/booking-pricing";

const UNIT_ID = getDefaultUnitId();

export async function GET(request: NextRequest) {
  await requireUser();

  const check_in = request.nextUrl.searchParams.get("check_in") || "";
  const check_out = request.nextUrl.searchParams.get("check_out") || "";
  const unit_id = assertRentalUnitId(
    request.nextUrl.searchParams.get("unit_id") || UNIT_ID,
  );

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
      getStayPricing(check_in, check_out, unit_id),
      getAvailabilityConflicts({
        unit_id,
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
