import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCandles, getHTFTimeframe } from "@/lib/indicator/fetcher";
import { calculateIndicator } from "@/lib/indicator/engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const timeframe = searchParams.get("timeframe") || "1h";

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check active subscription using admin client (bypasses RLS)
    const admin = createAdminClient();
    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Subscription check error:", subError);
      return NextResponse.json({ error: "Subscription check failed" }, { status: 500 });
    }

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
  } catch (error: any) {
    console.error("Indicator API error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to calculate indicator" },
      { status: 500 }
    );
  }
}
