import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const BRAND_PREFIX = "/brand";
const CREATOR_PREFIX = "/creator";
const DASHBOARD_PREFIX = "/dashboard";
const DEFAULT_LOGIN = "/login";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isBrandRoute = pathname.startsWith(BRAND_PREFIX);
  const isCreatorRoute = pathname.startsWith(CREATOR_PREFIX);
  const isDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX);

  if (!isBrandRoute && !isCreatorRoute && !isDashboardRoute) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN, request.url));
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.role) {
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  if (isBrandRoute && profile.role !== "brand") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isCreatorRoute && profile.role !== "creator") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/brand/:path*", "/creator/:path*"],
};
