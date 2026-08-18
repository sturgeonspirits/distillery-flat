import { NextResponse, type NextRequest } from "next/server";
import { isPasswordAuthDisabled } from "@/lib/auth-bypass";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/reservations",
  "/owner-blocks",
  "/calendar",
  "/pricing",
  "/reports",
  "/settings",
  "/operations",
  "/guest-portal",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(pathname: string) {
  return pathname === "/api/reservation-preview";
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPasswordAuthDisabled()) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const response = NextResponse.next({ request });
    response.headers.set("Cache-Control", "private, no-store");

    return response;
  }

  const user = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const needsAuth = isProtectedPath(pathname) || isProtectedApi(pathname);

  if (!user && needsAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}
