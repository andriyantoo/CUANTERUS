"use client";

import { useState, useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Calculator, Info, AlertTriangle, DollarSign, TrendingUp, Shield } from "lucide-react";

const COMMON_PAIRS: Record<string, { pipDecimal: number; label: string }> = {
  // JPY pairs: 1 pip = 0.01
  "USD/JPY": { pipDecimal: 2, label: "USD/JPY" },
  "EUR/JPY": { pipDecimal: 2, label: "EUR/JPY" },
  "GBP/JPY": { pipDecimal: 2, label: "GBP/JPY" },
  "AUD/JPY": { pipDecimal: 2, label: "AUD/JPY" },
  "CAD/JPY": { pipDecimal: 2, label: "CAD/JPY" },
  "CHF/JPY": { pipDecimal: 2, label: "CHF/JPY" },
  "NZD/JPY": { pipDecimal: 2, label: "NZD/JPY" },
  // Standard pairs: 1 pip = 0.0001
  "EUR/USD": { pipDecimal: 4, label: "EUR/USD" },
  "GBP/USD": { pipDecimal: 4, label: "GBP/USD" },
  "AUD/USD": { pipDecimal: 4, label: "AUD/USD" },
  "NZD/USD": { pipDecimal: 4, label: "NZD/USD" },
  "USD/CAD": { pipDecimal: 4, label: "USD/CAD" },
  "USD/CHF": { pipDecimal: 4, label: "USD/CHF" },
  "EUR/GBP": { pipDecimal: 4, label: "EUR/GBP" },
  "EUR/AUD": { pipDecimal: 4, label: "EUR/AUD" },
  "GBP/AUD": { pipDecimal: 4, label: "GBP/AUD" },
  "EUR/CAD": { pipDecimal: 4, label: "EUR/CAD" },
  "GBP/CAD": { pipDecimal: 4, label: "GBP/CAD" },
  // Gold
  "XAU/USD": { pipDecimal: 1, label: "XAU/USD (Gold)" },
};

export default function PositionSizingPage() {
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLossPips, setStopLossPips] = useState("");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [pipValue, setPipValue] = useState("10"); // default $10 per standard lot

  const result = useMemo(() => {
    const balance = parseFloat(accountBalance);
    const risk = parseFloat(riskPercent);
    const slPips = parseFloat(stopLossPips);
    const pipVal = parseFloat(pipValue);

    if (!balance || !risk || !slPips || !pipVal || balance <= 0 || risk <= 0 || slPips <= 0 || pipVal <= 0) {
      return null;
    }

    const riskAmount = balance * (risk / 100);
    const standardLots = riskAmount / (slPips * pipVal);
    const miniLots = standardLots * 10;
    const microLots = standardLots * 100;
    const units = standardLots * 100000;

    return {
      riskAmount,
      standardLots,
      miniLots,
      microLots,
      units: Math.round(units),
    };
  }, [accountBalance, riskPercent, stopLossPips, pipValue]);

  const riskLevel = useMemo(() => {
    const risk = parseFloat(riskPercent);
    if (!risk) return null;
    if (risk <= 1) return { label: "Konservatif", color: "text-green-400", bg: "bg-green-400/10" };
    if (risk <= 2) return { label: "Moderat", color: "text-[#96FC03]", bg: "bg-[#96FC03]/10" };
    if (risk <= 3) return { label: "Agresif", color: "text-amber-400", bg: "bg-amber-400/10" };
    return { label: "Sangat Berisiko", color: "text-red-400", bg: "bg-red-400/10" };
  }, [riskPercent]);

  function handlePairChange(pair: string) {
    setSelectedPair(pair);
    // Auto-set pip value based on pair (standard lot)
    if (pair === "XAU/USD") {
      setPipValue("1"); // $1 per pip per 1 oz (0.01 lot)... actually $10 per standard
      setPipValue("10");
    } else {
      setPipValue("10"); // ~$10 per pip for standard lot on most USD pairs
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center">
            <Calculator size={20} className="text-[#96FC03]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F0F5]">Position Sizing Calculator</h1>
            <p className="text-sm text-[#8B949E]">Hitung lot size yang tepat berdasarkan risk management kamu</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardTitle>Parameter Trading</CardTitle>
            <div className="space-y-4 mt-4">
              {/* Pair Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Pair</label>
                <select
                  value={selectedPair}
                  onChange={(e) => handlePairChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                >
                  <optgroup label="Major Pairs">
                    <option value="EUR/USD">EUR/USD</option>
                    <option value="GBP/USD">GBP/USD</option>
                    <option value="USD/JPY">USD/JPY</option>
                    <option value="USD/CAD">USD/CAD</option>
                    <option value="USD/CHF">USD/CHF</option>
                    <option value="AUD/USD">AUD/USD</option>
                    <option value="NZD/USD">NZD/USD</option>
                  </optgroup>
                  <optgroup label="JPY Cross">
                    <option value="EUR/JPY">EUR/JPY</option>
                    <option value="GBP/JPY">GBP/JPY</option>
                    <option value="AUD/JPY">AUD/JPY</option>
                    <option value="CAD/JPY">CAD/JPY</option>
                    <option value="CHF/JPY">CHF/JPY</option>
                    <option value="NZD/JPY">NZD/JPY</option>
                  </optgroup>
                  <optgroup label="Cross Pairs">
                    <option value="EUR/GBP">EUR/GBP</option>
                    <option value="EUR/AUD">EUR/AUD</option>
                    <option value="GBP/AUD">GBP/AUD</option>
                    <option value="EUR/CAD">EUR/CAD</option>
                    <option value="GBP/CAD">GBP/CAD</option>
                  </optgroup>
                  <optgroup label="Commodities">
                    <option value="XAU/USD">XAU/USD (Gold)</option>
                  </optgroup>
                </select>
              </div>

              {/* Account Balance */}
              <Input
                id="balance"
                label="Account Balance (USD)"
                type="number"
                placeholder="10000"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                min="0"
                step="100"
              />

              {/* Risk Percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="risk" className="block text-sm font-medium text-[#F0F0F5]">
                    Risk per Trade (%)
                  </label>
                  {riskLevel && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskLevel.bg} ${riskLevel.color}`}>
                      {riskLevel.label}
                    </span>
                  )}
                </div>
                <input
                  id="risk"
                  type="number"
                  placeholder="1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  min="0.1"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                />
                {/* Quick risk buttons */}
                <div className="flex gap-2 mt-1">
                  {[0.5, 1, 2, 3].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskPercent(String(r))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        riskPercent === String(r)
                          ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                          : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30 hover:text-[#F0F0F5]"
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss in Pips */}
              <Input
                id="sl"
                label="Stop Loss (Pips)"
                type="number"
                placeholder="50"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(e.target.value)}
                min="0"
                step="1"
              />

              {/* Pip Value */}
              <Input
                id="pipValue"
                label="Pip Value per Standard Lot (USD)"
                type="number"
                placeholder="10"
                value={pipValue}
                onChange={(e) => setPipValue(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-[#8B949E]/60 -mt-2">
                Umumnya ~$10 untuk pair berbasis USD. Cek broker kamu untuk nilai pastinya.
              </p>
            </div>
          </Card>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Result */}
          <Card className={result ? "border-[#96FC03]/20" : ""}>
            <CardTitle>Hasil Perhitungan</CardTitle>

            {result ? (
              <div className="space-y-4 mt-4">
                {/* Risk Amount */}
                <div className="p-4 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-[#8B949E]" />
                    <span className="text-xs text-[#8B949E]">Risk Amount</span>
                  </div>
                  <p className="text-xl font-bold text-[#F0F0F5]">
                    ${result.riskAmount.toFixed(2)}
                  </p>
                </div>

                {/* Lot Sizes */}
                <div className="p-4 rounded-xl bg-[#96FC03]/5 border border-[#96FC03]/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-[#96FC03]" />
                    <span className="text-xs text-[#96FC03]">Recommended Lot Size</span>
                  </div>
                  <p className="text-3xl font-bold text-[#96FC03]">
                    {result.standardLots.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#8B949E] mt-1">Standard Lots</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                    <p className="text-xs text-[#8B949E] mb-1">Mini Lots</p>
                    <p className="text-lg font-bold text-[#F0F0F5]">{result.miniLots.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                    <p className="text-xs text-[#8B949E] mb-1">Micro Lots</p>
                    <p className="text-lg font-bold text-[#F0F0F5]">{result.microLots.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                  <p className="text-xs text-[#8B949E] mb-1">Units</p>
                  <p className="text-lg font-bold text-[#F0F0F5]">{result.units.toLocaleString("id-ID")}</p>
                </div>

                {/* Warning for high risk */}
                {parseFloat(riskPercent) > 2 && (
                  <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/80">
                      Risk di atas 2% per trade termasuk agresif. Disarankan gunakan 1-2% untuk menjaga akun tetap aman.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 py-8 text-center">
                <Calculator size={32} className="text-[#222229] mx-auto mb-3" />
                <p className="text-sm text-[#8B949E]">Isi semua parameter untuk melihat hasil</p>
              </div>
            )}
          </Card>

          {/* Formula Info */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-[#96FC03]" />
              <CardTitle className="text-sm">Cara Hitung</CardTitle>
            </div>
            <div className="space-y-3 text-xs text-[#8B949E]">
              <div className="p-3 rounded-lg bg-[#0A0A0F] font-mono text-[#96FC03]/80">
                Risk ($) = Balance × Risk %<br />
                Lot Size = Risk ($) ÷ (SL pips × Pip Value)
              </div>
              <p>
                <strong className="text-[#F0F0F5]">Contoh:</strong> Balance $10,000, Risk 1%, SL 50 pips, Pip Value $10
              </p>
              <p>
                Risk = $10,000 × 1% = <strong className="text-[#F0F0F5]">$100</strong><br />
                Lot = $100 ÷ (50 × $10) = <strong className="text-[#96FC03]">0.20 lot</strong>
              </p>
            </div>
          </Card>

          {/* Tips */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[#96FC03]" />
              <CardTitle className="text-sm">Tips Risk Management</CardTitle>
            </div>
            <ul className="space-y-2 text-xs text-[#8B949E]">
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Jangan pernah risk lebih dari 2% per trade
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Selalu pasang stop loss sebelum entry
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Gunakan risk:reward minimal 1:2
              </li>
              <li className="flex gap-2">
                <span className="text-[#96FC03]">•</span>
                Sesuaikan lot size jika akun sedang drawdown
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
