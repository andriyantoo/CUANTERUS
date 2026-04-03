import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCandles, getHTFTimeframe } from "@/lib/indicator/fetcher";
import { calculateIndicator } from "@/lib/indicator/engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/indicator?symbol=BTCUSDT&timeframe=1h
 *
 * Returns plot points ONLY — zero calculation logic exposed.
 * Requires authenticated user with active subscription.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const timeframe = searchParams.get("timeframe") || "1h";

    // Auth check
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: "No active subscription" }, { status: 403 });
    }

    // Fetch candles
    const [candles, htfCandles] = await Promise.all([
      fetchCandles(symbol, timeframe, 500),
      fetchCandles(symbol, getHTFTimeframe(timeframe), 200),
    ]);

    // Run indicator engine (ALL logic server-side)
    const plots = calculateIndicator(candles, htfCandles);

    // Return candles (for chart rendering) + plots (overlay data)
    return NextResponse.json({
      candles: candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
      plots,
    });
  } catch (error) {
    console.error("Indicator API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate indicator" },
      { status: 500 }
    );
  }
}
