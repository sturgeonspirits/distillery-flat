import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUnitId } from "@/lib/env";
import { consumeRateLimit, getRequestIp } from "@/services/rate-limit";
import { syncAllActiveIcalSources } from "@/services/ical-sync-runner";

function constantTimeEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret") || "";
  const expected = process.env.ICAL_SYNC_SECRET || "";

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "ICAL_SYNC_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (!constantTimeEquals(secret, expected)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const rateLimit = await consumeRateLimit({
    route: "internal-sync-ical",
    key: getRequestIp(request),
    windowSeconds: 60,
    limit: 6,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many sync attempts. Try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retry_after_seconds),
        },
      },
    );
  }

  const result = await syncAllActiveIcalSources(getUnitId(), "scheduled");

  return NextResponse.json({ ok: true, ...result });
}
