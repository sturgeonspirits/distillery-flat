import "server-only";

import { supabaseAdmin } from "@/supabase/admin";

type RateLimitInput = {
  route: string;
  key: string;
  windowSeconds: number;
  limit: number;
};

type RateLimitResult = {
  allowed: boolean;
  count: number;
  retry_after_seconds: number;
};

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }

  const netlifyIp = request.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) {
    return netlifyIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export async function consumeRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_route: input.route,
    p_key: input.key,
    p_window_seconds: input.windowSeconds,
    p_limit: input.limit,
  });

  if (error) {
    throw new Error(`Failed to apply rate limit: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("Rate limit function returned no result.");
  }

  return result as RateLimitResult;
}
