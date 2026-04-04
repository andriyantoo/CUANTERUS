"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Lock, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import type { PlotItem } from "@/lib/indicator/engine";

const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT" },
  { value: "ETHUSDT", label: "ETH/USDT" },
  { value: "SOLUSDT", label: "SOL/USDT" },
  { value: "BNBUSDT", label: "BNB/USDT" },
  { value: "XRPUSDT", label: "XRP/USDT" },
  { value: "DOGEUSDT", label: "DOGE/USDT" },
];

const TIMEFRAMES = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface InfoData {
  trend: string;
  msBias: string;
  htfBias: string;
  divergent: boolean;
  fibActive: boolean;
  volMode: string;
  rr?: string;
  rrMax?: string;
}

export default function IndicatorPage() {
  const { subscription } = useUser();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<InfoData | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const hasAccess = !!subscription;

  const loadChart = useCallback(async () => {
    if (!hasAccess || !chartRef.current) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/indicator?symbol=${symbol}&timeframe=${timeframe}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load");
      }

      const { candles, plots } = await res.json() as {
        candles: CandleData[];
        plots: PlotItem[];
      };

      // Dynamic import lightweight-charts (client only)
      const { createChart, ColorType, LineStyle, CandlestickSeries, LineSeries } = await import("lightweight-charts");

      // Clear previous chart
      if (chartInstance.current) {
        chartInstance.current.remove();
      }

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 500,
        layout: {
          background: { type: ColorType.Solid, color: "#0A0A0F" },
          textColor: "#8B949E",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "#222229" },
          horzLines: { color: "#222229" },
        },
        crosshair: {
          vertLine: { color: "#96FC03", labelBackgroundColor: "#96FC03" },
          horzLine: { color: "#96FC03", labelBackgroundColor: "#96FC03" },
        },
        timeScale: {
          borderColor: "#222229",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "#222229",
        },
      });

      chartInstance.current = chart;

      // Candlestick series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#089981",
        downColor: "#F23645",
        borderUpColor: "#089981",
        borderDownColor: "#F23645",
        wickUpColor: "#089981",
        wickDownColor: "#F23645",
      });

      candleSeries.setData(candles as any);

      // Process plots — render markers and lines
      const markers: any[] = [];

      for (const plot of plots) {
        if (plot.type === "label") {
          markers.push({
            time: plot.time,
            position: plot.position === "above" ? "aboveBar" : "belowBar",
            color: plot.color,
            shape: plot.position === "above" ? "arrowDown" : "arrowUp",
            text: plot.text,
            size: plot.size === "tiny" ? 0.5 : plot.size === "small" ? 1 : 1.5,
          });
        }

        if (plot.type === "line") {
          const lineStyle = plot.style === "dashed"
            ? LineStyle.Dashed
            : plot.style === "dotted"
            ? LineStyle.Dotted
            : LineStyle.Solid;

          const lineSeries = chart.addSeries(LineSeries, {
            color: plot.color,
            lineWidth: plot.width as 1 | 2 | 3 | 4,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });

          // Create line from two points
          const data = [];
          if (plot.time1 && plot.price1) data.push({ time: plot.time1 as any, value: plot.price1 });
          if (plot.time2 && plot.price2) data.push({ time: plot.time2 as any, value: plot.price2 });

          // Extend right: add point at last candle time
          if (plot.extend === "right" && candles.length > 0) {
            data.push({ time: candles[candles.length - 1].time as any, value: plot.price2 });
          }

          if (data.length >= 2) {
            lineSeries.setData(data);
          }
        }

        if (plot.type === "info") {
          setInfo(plot as unknown as InfoData);
        }
      }

      // Sort markers by time and set
      markers.sort((a, b) => a.time - b.time);
      if (markers.length > 0) {
        candleSeries.setMarkers(markers);
      }

      chart.timeScale().fitContent();

      // Resize handler
      const resizeObserver = new ResizeObserver(() => {
        if (chartRef.current) {
          chart.applyOptions({ width: chartRef.current.clientWidth });
        }
      });
      resizeObserver.observe(chartRef.current);

      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } catch (err: any) {
      setError(err.message || "Failed to load indicator");
    }

    setLoading(false);
  }, [symbol, timeframe, hasAccess]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!hasAccess) return;
    const interval = setInterval(loadChart, 60000);
    return () => clearInterval(interval);
  }, [loadChart, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">CUANTERUS Golden Trap</h1>
        <Card className="text-center py-16">
          <Lock size={48} className="mx-auto text-[#222229] mb-4" />
          <h2 className="text-xl font-bold text-[#F0F0F5] mb-2">Indikator Eksklusif</h2>
          <p className="text-sm text-[#8B949E] max-w-md mx-auto mb-6">
            Akses indikator CUANTERUS Golden Trap dengan subscription aktif. Semua kalkulasi berjalan di server — formula sepenuhnya tersembunyi.
          </p>
          <a href="/#pricing">
            <Button>Pilih Paket</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            CUANTERUS Golden Trap
            <Badge variant="lime" className="text-[10px]">LIVE</Badge>
          </h1>
          {lastUpdate && (
            <p className="text-xs text-[#8B949E] mt-1">Last update: {lastUpdate}</p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={loadChart} loading={loading}>
          <RefreshCw size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Symbol + Timeframe selectors */}
      <div className="flex flex-wrap gap-2">
        {SYMBOLS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSymbol(s.value)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              symbol === s.value
                ? "bg-[#96FC03]/10 text-[#96FC03]"
                : "text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px bg-[#222229] mx-1" />
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              timeframe === tf.value
                ? "bg-[#96FC03]/10 text-[#96FC03]"
                : "text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Info Panel */}
      {info && (
        <div className="flex flex-wrap gap-2">
          <Badge variant={info.trend === "bullish" ? "lime" : info.trend === "bearish" ? "red" : "gray"}>
            {info.trend === "bullish" ? <><TrendingUp size={12} className="mr-1" />GT Bull</> :
             info.trend === "bearish" ? <><TrendingDown size={12} className="mr-1" />GT Bear</> : "GT —"}
          </Badge>
          <Badge variant={info.msBias === "bullish" ? "lime" : info.msBias === "bearish" ? "red" : "gray"}>
            {info.msBias === "bullish" ? "MS Bull" : info.msBias === "bearish" ? "MS Bear" : "MS —"}
          </Badge>
          <Badge variant={info.htfBias === "bullish" ? "lime" : info.htfBias === "bearish" ? "red" : "gray"}>
            {info.htfBias === "bullish" ? "HTF Bull" : info.htfBias === "bearish" ? "HTF Bear" : "HTF —"}
          </Badge>
          {info.divergent && (
            <Badge variant="amber">
              <AlertTriangle size={12} className="mr-1" />Divergence
            </Badge>
          )}
          <Badge variant={info.fibActive ? "lime" : "gray"}>
            {info.fibActive ? "Fib Active" : "Fib Inactive"}
          </Badge>
          <Badge variant={info.volMode === "HV" ? "amber" : "blue"}>
            {info.volMode === "HV" ? "⚡ HV" : "○ LV"}
          </Badge>
          {info.rr && (
            <Badge variant="gray">R:R {info.rr} (TP1) | {info.rrMax} (Max)</Badge>
          )}
        </div>
      )}

      {/* Chart */}
      <Card className="p-0 overflow-hidden">
        {loading && !chartInstance.current ? (
          <Skeleton className="h-[500px] w-full rounded-none" />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <Button size="sm" onClick={loadChart}>Coba Lagi</Button>
            </div>
          </div>
        ) : (
          <div ref={chartRef} className="h-[500px]" />
        )}
      </Card>

      <p className="text-[10px] text-[#8B949E] text-center">
        Indikator berjalan sepenuhnya di server. Formula dan parameter tersembunyi. Auto-refresh setiap 60 detik.
      </p>
    </div>
  );
}
