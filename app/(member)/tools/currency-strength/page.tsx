"use client";

import { useState, useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  RefreshCw,
} from "lucide-react";

// Simulated currency strength data based on cross-pair analysis
// In production, this could be fetched from an API or calculated from live price feeds
interface CurrencyStrength {
  currency: string;
  flag: string;
  strength: number; // -100 to 100
  trend: "bullish" | "bearish" | "neutral";
  pairs: { pair: string; change: number }[];
}

function generateStrengthData(seed: number): CurrencyStrength[] {
  // Deterministic pseudo-random based on date for consistency within the same day
  function seededRandom(s: number) {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  const currencies = [
    { currency: "USD", flag: "🇺🇸" },
    { currency: "EUR", flag: "🇪🇺" },
    { currency: "GBP", flag: "🇬🇧" },
    { currency: "JPY", flag: "🇯🇵" },
    { currency: "AUD", flag: "🇦🇺" },
    { currency: "CAD", flag: "🇨🇦" },
    { currency: "CHF", flag: "🇨🇭" },
    { currency: "NZD", flag: "🇳🇿" },
  ];

  const pairMap: Record<string, string[]> = {
    USD: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"],
    EUR: ["EUR/USD", "EUR/GBP", "EUR/JPY", "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/NZD"],
    GBP: ["GBP/USD", "EUR/GBP", "GBP/JPY", "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/NZD"],
    JPY: ["USD/JPY", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY", "CHF/JPY", "NZD/JPY"],
    AUD: ["AUD/USD", "EUR/AUD", "GBP/AUD", "AUD/JPY", "AUD/CAD", "AUD/CHF", "AUD/NZD"],
    CAD: ["USD/CAD", "EUR/CAD", "GBP/CAD", "CAD/JPY", "AUD/CAD", "CAD/CHF", "NZD/CAD"],
    CHF: ["USD/CHF", "EUR/CHF", "GBP/CHF", "CHF/JPY", "AUD/CHF", "CAD/CHF", "NZD/CHF"],
    NZD: ["NZD/USD", "EUR/NZD", "GBP/NZD", "NZD/JPY", "AUD/NZD", "NZD/CAD", "NZD/CHF"],
  };

  return currencies.map((c, i) => {
    const strength = Math.round((seededRandom(seed + i * 7) - 0.5) * 160);
    const pairs = (pairMap[c.currency] || []).map((pair, j) => ({
      pair,
      change: Math.round((seededRandom(seed + i * 13 + j * 3) - 0.48) * 200) / 100,
    }));

    return {
      ...c,
      strength: Math.max(-100, Math.min(100, strength)),
      trend: (strength > 20 ? "bullish" : strength < -20 ? "bearish" : "neutral") as CurrencyStrength["trend"],
      pairs,
    };
  }).sort((a, b) => b.strength - a.strength);
}

const TIMEFRAMES = [
  { key: "1h", label: "1H", offset: 0 },
  { key: "4h", label: "4H", offset: 1 },
  { key: "1d", label: "1D", offset: 2 },
  { key: "1w", label: "1W", offset: 3 },
];

export default function CurrencyStrengthPage() {
  const [timeframe, setTimeframe] = useState("1d");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const seed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, []);

  const tfOffset = TIMEFRAMES.find((t) => t.key === timeframe)?.offset || 0;
  const data = useMemo(() => generateStrengthData(seed + tfOffset * 100), [seed, tfOffset]);

  const selectedData = selectedCurrency ? data.find((d) => d.currency === selectedCurrency) : null;

  function getStrengthColor(strength: number) {
    if (strength >= 50) return "text-green-400";
    if (strength >= 20) return "text-green-400/70";
    if (strength > -20) return "text-[#8B949E]";
    if (strength > -50) return "text-red-400/70";
    return "text-red-400";
  }

  function getBarColor(strength: number) {
    if (strength >= 50) return "bg-green-400";
    if (strength >= 20) return "bg-green-400/70";
    if (strength > -20) return "bg-[#8B949E]/50";
    if (strength > -50) return "bg-red-400/70";
    return "bg-red-400";
  }

  function getTrendIcon(trend: string) {
    if (trend === "bullish") return <TrendingUp size={14} className="text-green-400" />;
    if (trend === "bearish") return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-[#8B949E]" />;
  }

  // Find strongest vs weakest for pair suggestion
  const strongest = data[0];
  const weakest = data[data.length - 1];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center">
          <Activity size={20} className="text-[#96FC03]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Currency Strength Meter</h1>
          <p className="text-sm text-[#8B949E]">Analisa kekuatan relatif 8 mata uang utama</p>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setTimeframe(tf.key)}
            className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
              timeframe === tf.key
                ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30 hover:text-[#F0F0F5]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strength bars */}
        <div className="lg:col-span-2">
          <Card>
            <CardTitle>Strength Ranking</CardTitle>
            <div className="mt-4 space-y-3">
              {data.map((item) => {
                const absStrength = Math.abs(item.strength);
                const isPositive = item.strength >= 0;
                const isSelected = selectedCurrency === item.currency;

                return (
                  <button
                    key={item.currency}
                    onClick={() => setSelectedCurrency(isSelected ? null : item.currency)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-[#96FC03]/30 bg-[#96FC03]/5"
                        : "border-transparent hover:bg-[#0A0A0F]"
                    }`}
                  >
                    {/* Flag + Currency */}
                    <span className="text-xl">{item.flag}</span>
                    <div className="w-10">
                      <span className="text-sm font-bold text-[#F0F0F5]">{item.currency}</span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-6 bg-[#0A0A0F] rounded-lg overflow-hidden relative">
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#222229] z-10" />

                      {isPositive ? (
                        <div className="absolute top-0 bottom-0 left-1/2 flex items-center">
                          <div
                            className={`h-4 rounded-r-md ${getBarColor(item.strength)} transition-all duration-500`}
                            style={{ width: `${absStrength / 2}%` }}
                          />
                        </div>
                      ) : (
                        <div className="absolute top-0 bottom-0 right-1/2 flex items-center justify-end">
                          <div
                            className={`h-4 rounded-l-md ${getBarColor(item.strength)} transition-all duration-500`}
                            style={{ width: `${absStrength / 2}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="w-16 text-right flex items-center justify-end gap-1.5">
                      {getTrendIcon(item.trend)}
                      <span className={`text-sm font-bold font-mono ${getStrengthColor(item.strength)}`}>
                        {item.strength > 0 ? "+" : ""}{item.strength}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Pair suggestion */}
          <Card className="border-[#96FC03]/20">
            <CardTitle className="text-sm">Trade Suggestion</CardTitle>
            <div className="mt-3 space-y-3">
              <div className="p-3 rounded-xl bg-[#96FC03]/5 border border-[#96FC03]/20">
                <p className="text-xs text-[#8B949E] mb-1">Strongest vs Weakest</p>
                <p className="text-lg font-bold text-[#96FC03]">
                  {strongest.flag} {strongest.currency} vs {weakest.flag} {weakest.currency}
                </p>
                <p className="text-xs text-[#8B949E] mt-1">
                  Cari peluang <strong className="text-green-400">LONG {strongest.currency}/{weakest.currency}</strong> atau pair yang mengandung keduanya
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                  <p className="text-xs text-[#8B949E] mb-1">Terkuat</p>
                  <div className="flex items-center gap-1.5">
                    <span>{strongest.flag}</span>
                    <span className="text-sm font-bold text-green-400">{strongest.currency}</span>
                  </div>
                  <p className="text-xs font-mono text-green-400/70">+{strongest.strength}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                  <p className="text-xs text-[#8B949E] mb-1">Terlemah</p>
                  <div className="flex items-center gap-1.5">
                    <span>{weakest.flag}</span>
                    <span className="text-sm font-bold text-red-400">{weakest.currency}</span>
                  </div>
                  <p className="text-xs font-mono text-red-400/70">{weakest.strength}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Selected currency detail */}
          {selectedData ? (
            <Card>
              <CardTitle className="text-sm">
                {selectedData.flag} {selectedData.currency} Detail
              </CardTitle>
              <div className="mt-3 space-y-2">
                {selectedData.pairs.map((p) => (
                  <div key={p.pair} className="flex items-center justify-between py-1.5 border-b border-[#222229] last:border-0">
                    <span className="text-sm text-[#F0F0F5]">{p.pair}</span>
                    <span className={`text-xs font-mono font-bold ${p.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6">
                <Activity size={24} className="text-[#222229] mx-auto mb-2" />
                <p className="text-xs text-[#8B949E]">Klik mata uang untuk melihat detail pair</p>
              </div>
            </Card>
          )}

          {/* Heatmap */}
          <Card>
            <CardTitle className="text-sm">Strength Heatmap</CardTitle>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {data.map((item) => {
                const bg = item.strength >= 40 ? "bg-green-500/20 border-green-500/30"
                  : item.strength >= 10 ? "bg-green-500/10 border-green-500/20"
                  : item.strength > -10 ? "bg-[#222229]/50 border-[#222229]"
                  : item.strength > -40 ? "bg-red-500/10 border-red-500/20"
                  : "bg-red-500/20 border-red-500/30";

                return (
                  <div
                    key={item.currency}
                    className={`p-2 rounded-lg border text-center ${bg}`}
                  >
                    <p className="text-sm">{item.flag}</p>
                    <p className="text-xs font-bold text-[#F0F0F5]">{item.currency}</p>
                    <p className={`text-[10px] font-mono ${getStrengthColor(item.strength)}`}>
                      {item.strength > 0 ? "+" : ""}{item.strength}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Info */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[#96FC03]" />
              <span className="text-xs font-bold text-[#F0F0F5]">Cara Baca</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#8B949E]">
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Nilai + = mata uang sedang menguat
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Nilai - = mata uang sedang melemah
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Cari pair: beli yang kuat, jual yang lemah
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Hindari trade pair yang keduanya kuat/lemah
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
