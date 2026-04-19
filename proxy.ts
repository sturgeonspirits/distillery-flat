import type { NextRequest } from "next/server";
import { updateSession } from "@/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/reservations/:path*",
    "/owner-blocks/:path*",
    "/calendar/:path*",
    "/pricing/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/reservation-preview",
  ],
};