"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelative } from "@/lib/utils";
import { PRODUCT_NAMES, SIGNAL_STATUS_LABELS } from "@/lib/constants";
import type { Signal } from "@/lib/types";
import { TrendingUp, TrendingDown, ExternalLink, BarChart2 } from "lucide-react";

const STATUS_COLORS: Record<string, "lime" | "blue" | "amber" | "red" | "gray"> = {
  active: "lime",
  tp1_hit: "blue",
  tp2_hit: "blue",
  tp3_hit: "amber",
  sl_hit: "red",
  closed: "gray",
  cancelled: "gray",
};

// Popular pairs for quick TradingView access
const QUICK_CHARTS = [
  { symbol: "BTCUSDT", label: "BTC/USDT", exchange: "BINANCE" },
  { symbol: "ETHUSDT", label: "ETH/USDT", exchange: "BINANCE" },
  { symbol: "SOLUSDT", label: "SOL/USDT", exchange: "BINANCE" },
  { symbol: "EURUSD", label: "EUR/USD", exchange: "FX" },
  { symbol: "GBPUSD", label: "GBP/USD", exchange: "FX" },
  { symbol: "XAUUSD", label: "XAU/USD", exchange: "OANDA" },
];

export default function AnalisaPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("BINANCE:BTCUSDT");

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("signals")
        .select("*, product:products(*)")
        .eq("is_published", true)
        .not("chart_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      setSignals((data ?? []) as Signal[]);
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Analisa</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Live chart TradingView dan analisa sinyal dari mentor.
        </p>
      </div>

      {/* Quick Chart Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_CHARTS.map((chart) => (
          <button
            key={chart.symbol}
            onClick={() => setActiveChart(`${chart.exchange}:${chart.symbol}`)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              activeChart === `${chart.exchange}:${chart.symbol}`
                ? "bg-[#96FC03]/10 text-[#96FC03]"
                : "text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]"
            }`}
          >
            {chart.label}
          </button>
        ))}
      </div>

      {/* TradingView Chart Embed */}
      <Card className="p-0 overflow-hidden">
        <div className="h-[300px] sm:h-[450px] md:h-[600px]">
          <iframe
            key={activeChart}
            src={`https://s.tradingview.com/widgetembed/?symbol=${activeChart}&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=131318&studies=[]&theme=dark&style=1&timezone=Asia%2FJakarta&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=id&utm_source=cuanterus`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </Card>

      {/* Signals with Chart Links */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-[#96FC03]" />
          Analisa Sinyal
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[#8B949E]">Belum ada analisa sinyal dengan chart.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <Card key={signal.id} hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Direction + Pair */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        signal.direction === "long"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {signal.direction === "long" ? (
                        <TrendingUp size={20} />
                      ) : (
                        <TrendingDown size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F0F0F5]">{signal.pair}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={signal.direction === "long" ? "lime" : "red"}
                          className="text-[10px]"
                        >
                          {signal.direction.toUpperCase()}
                        </Badge>
                        <Badge variant={STATUS_COLORS[signal.status]} className="text-[10px]">
                          {SIGNAL_STATUS_LABELS[signal.status]}
                        </Badge>
                        <Badge variant="gray" className="text-[10px]">
                          {PRODUCT_NAMES[signal.product?.slug ?? ""] ?? ""}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[#8B949E]">Entry:</span>{" "}
                      <span className="text-[#F0F0F5] font-mono">{signal.entry_price ?? "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#8B949E]">SL:</span>{" "}
                      <span className="text-red-400 font-mono">{signal.stop_loss ?? "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#8B949E]">TP1:</span>{" "}
                      <span className="text-green-400 font-mono">{signal.take_profit_1 ?? "-"}</span>
                    </div>
                  </div>

                  {/* Chart Link */}
                  {signal.chart_url && (
                    <a
                      href={signal.chart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#96FC03] hover:underline flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                      Lihat Chart
                    </a>
                  )}

                  {/* Date */}
                  <span className="text-xs text-[#8B949E] flex-shrink-0">
                    {formatRelative(signal.created_at)}
                  </span>
                </div>

                {signal.notes && (
                  <p className="text-xs text-[#8B949E] mt-3 pt-3 border-t border-[#222229]">
                    {signal.notes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
