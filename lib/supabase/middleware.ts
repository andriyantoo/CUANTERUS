import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes — no Supabase call needed
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthCallback = pathname.startsWith("/auth/");

  // For truly public pages, just pass through — zero latency
  if (isPublicRoute || isApiRoute || isAuthCallback) {
    return NextResponse.next({ request });
  }

  // Only create Supabase client for protected routes
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() reads from cookie — fast, no network call
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes — redirect to login if no session
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
