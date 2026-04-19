import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/reservations",
  "/owner-blocks",
  "/calendar",
  "/pricing",
  "/reports",
  "/settings",
  "/operations",
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
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  const isAuthed = Boolean(data?.claims);

  const pathname = request.nextUrl.pathname;
  const needsAuth = isProtectedPath(pathname) || isProtectedApi(pathname);

  if (!isAuthed && needsAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (error) {
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}