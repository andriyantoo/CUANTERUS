import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only run middleware on protected routes — skip everything else
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/signals/:path*",
    "/market-outlook/:path*",
    "/market-insight/:path*",
    "/analisa/:path*",
    "/indicator/:path*",
    "/forum/:path*",
    "/profile/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
