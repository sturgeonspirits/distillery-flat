import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveIcalSources } from "@/services/ical-sync-runner";

const UNIT_ID = "cdd0a039-ef0a-44b5-a68d-339866029d42";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret");
  const expected = process.env.ICAL_SYNC_SECRET;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "ICAL_SYNC_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const result = await syncAllActiveIcalSources(UNIT_ID, "scheduled");

  return NextResponse.json({
    ok: true,
    ...result,
  });
}