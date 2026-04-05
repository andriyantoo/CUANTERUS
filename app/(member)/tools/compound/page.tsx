"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Info,
  Zap,
  ArrowRight,
  BookOpen,
  BarChart3,
  Trophy,
} from "lucide-react";

interface JournalStats {
  totalTrades: number;
  winRate: number;
  avgWinUsd: number;
  avgLossUsd: number;
  totalPnl: number;
  avgMonthlyReturn: number;
  avgTradesPerMonth: number;
}

interface ProjectionRow {
  month: number;
  balance: number;
  profit: number;
  cumProfit: number;
}

export default function CompoundCalculatorPage() {
  const { user } = useUser();
  const [journalStats, setJournalStats] = useState<JournalStats | null>(null);
  const [journalLoading, setJournalLoading] = useState(true);

  // Manual mode inputs
  const [mode, setMode] = useState<"manual" | "journal">("manual");
  const [startBalance, setStartBalance] = useState("10000");
  const [monthlyReturn, setMonthlyReturn] = useState("5");
  const [months, setMonths] = useState("12");
  const [monthlyDeposit, setMonthlyDeposit] = useState("0");
  const [monthlyWithdraw, setMonthlyWithdraw] = useState("0");

  // Load journal stats
  useEffect(() => {
    if (!user) return;
    loadJournalStats();
  }, [user]);

  async function loadJournalStats() {
    const supabase = createClient();
    const { data: trades } = await supabase
      .from("trade_journal")
      .select("pnl_usd, status, traded_at")
      .eq("user_id", user!.id)
      .neq("status", "open");

    if (!trades || trades.length === 0) {
      setJournalStats(null);
      setJournalLoading(false);
      return;
    }

    const wins = trades.filter((t) => t.status === "win");
    const losses = trades.filter((t) => t.status === "loss");
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWinUsd = wins.length > 0
      ? wins.reduce((s, t) => s + (t.pnl_usd || 0), 0) / wins.length
      : 0;
    const avgLossUsd = losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + (t.pnl_usd || 0), 0) / losses.length)
      : 0;
    const totalPnl = trades.reduce((s, t) => s + (t.pnl_usd || 0), 0);

    // Calculate monthly stats
    const tradesByMonth: Record<string, number> = {};
    trades.forEach((t) => {
      const monthKey = t.traded_at.slice(0, 7); // YYYY-MM
      tradesByMonth[monthKey] = (tradesByMonth[monthKey] || 0) + (t.pnl_usd || 0);
    });

    const monthKeys = Object.keys(tradesByMonth);
    const avgMonthlyPnl = monthKeys.length > 0
      ? monthKeys.reduce((s, k) => s + tradesByMonth[k], 0) / monthKeys.length
      : 0;

    const avgTradesPerMonth = monthKeys.length > 0
      ? trades.length / monthKeys.length
      : 0;

    setJournalStats({
      totalTrades: trades.length,
      winRate,
      avgWinUsd,
      avgLossUsd,
      totalPnl,
      avgMonthlyReturn: avgMonthlyPnl,
      avgTradesPerMonth,
    });
    setJournalLoading(false);
  }

  function applyJournalStats() {
    if (!journalStats) return;
    const balance = parseFloat(startBalance) || 10000;
    // Convert average monthly PnL to percentage based on start balance
    const monthlyPct = (journalStats.avgMonthlyReturn / balance) * 100;
    setMonthlyReturn(monthlyPct.toFixed(2));
    setMode("journal");
  }

  // Projection calculation
  const projection = useMemo(() => {
    const balance = parseFloat(startBalance) || 0;
    const returnPct = parseFloat(monthlyReturn) || 0;
    const numMonths = parseInt(months) || 12;
    const deposit = parseFloat(monthlyDeposit) || 0;
    const withdraw = parseFloat(monthlyWithdraw) || 0;

    if (balance <= 0 || numMonths <= 0) return null;

    const rows: ProjectionRow[] = [];
    let currentBalance = balance;
    let cumProfit = 0;

    for (let m = 1; m <= numMonths; m++) {
      const profit = currentBalance * (returnPct / 100);
      cumProfit += profit;
      currentBalance = currentBalance + profit + deposit - withdraw;
      if (currentBalance < 0) currentBalance = 0;

      rows.push({
        month: m,
        balance: currentBalance,
        profit,
        cumProfit,
      });
    }

    const finalBalance = rows[rows.length - 1]?.balance || balance;
    const totalProfit = finalBalance - balance - (deposit * numMonths) + (withdraw * numMonths);
    const totalDeposits = deposit * numMonths;
    const totalWithdrawals = withdraw * numMonths;
    const growthPct = ((finalBalance - balance) / balance) * 100;

    return { rows, finalBalance, totalProfit, totalDeposits, totalWithdrawals, growthPct };
  }, [startBalance, monthlyReturn, months, monthlyDeposit, monthlyWithdraw]);

  // Milestones
  const milestones = useMemo(() => {
    if (!projection) return [];
    const balance = parseFloat(startBalance) || 0;
    const targets = [2, 3, 5, 10].map((x) => ({ multiplier: x, target: balance * x }));
    return targets
      .map((t) => {
        const row = projection.rows.find((r) => r.balance >= t.target);
        return row ? { ...t, month: row.month } : null;
      })
      .filter(Boolean) as { multiplier: number; target: number; month: number }[];
  }, [projection, startBalance]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-[#96FC03]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Compound Calculator</h1>
          <p className="text-sm text-[#8B949E]">Simulasi pertumbuhan akun dengan compounding</p>
        </div>
      </div>

      {/* Journal Stats Integration */}
      {!journalLoading && journalStats && (
        <Card className="border-[#96FC03]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#96FC03]" />
              <span className="text-sm font-bold text-[#F0F0F5]">Data dari Trading Journal</span>
            </div>
            <Badge variant={mode === "journal" ? "lime" : "gray"}>
              {mode === "journal" ? "Active" : "Manual"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
              <p className="text-[10px] text-[#8B949E] uppercase">Trades</p>
              <p className="text-lg font-bold text-[#F0F0F5]">{journalStats.totalTrades}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
              <p className="text-[10px] text-[#8B949E] uppercase">Win Rate</p>
              <p className={`text-lg font-bold ${journalStats.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                {journalStats.winRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
              <p className="text-[10px] text-[#8B949E] uppercase">Total P&L</p>
              <p className={`text-lg font-bold ${journalStats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {journalStats.totalPnl >= 0 ? "+" : ""}${journalStats.totalPnl.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
              <p className="text-[10px] text-[#8B949E] uppercase">Avg/Bulan</p>
              <p className={`text-lg font-bold ${journalStats.avgMonthlyReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {journalStats.avgMonthlyReturn >= 0 ? "+" : ""}${journalStats.avgMonthlyReturn.toFixed(2)}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={mode === "journal" ? "secondary" : "primary"}
            onClick={applyJournalStats}
          >
            <Zap size={14} className="mr-1.5" />
            {mode === "journal" ? "Data journal sudah diterapkan" : "Gunakan data journal untuk simulasi"}
          </Button>

          {mode === "journal" && (
            <button
              onClick={() => setMode("manual")}
              className="ml-3 text-xs text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
            >
              Kembali ke manual
            </button>
          )}
        </Card>
      )}

      {!journalLoading && !journalStats && (
        <Card className="!p-4 border-[#222229]">
          <div className="flex items-center gap-2 text-[#8B949E]">
            <BookOpen size={16} />
            <p className="text-sm">
              Belum ada data di Trading Journal. <a href="/tools/journal" className="text-[#96FC03] hover:underline">Catat trade</a> untuk simulasi berdasarkan performa nyata kamu.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle>Parameter Simulasi</CardTitle>
            <div className="mt-4 space-y-4">
              <Input
                id="balance"
                label="Starting Balance (USD)"
                type="number"
                placeholder="10000"
                value={startBalance}
                onChange={(e) => setStartBalance(e.target.value)}
                min="0"
                step="100"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="return" className="block text-sm font-medium text-[#F0F0F5]">
                    Monthly Return (%)
                  </label>
                  {mode === "journal" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#96FC03]/10 text-[#96FC03]">
                      dari journal
                    </span>
                  )}
                </div>
                <input
                  id="return"
                  type="number"
                  placeholder="5"
                  value={monthlyReturn}
                  onChange={(e) => { setMonthlyReturn(e.target.value); setMode("manual"); }}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                />
                {/* Quick return buttons */}
                <div className="flex gap-2 mt-1">
                  {[3, 5, 8, 10, 15].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMonthlyReturn(String(r)); setMode("manual"); }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        monthlyReturn === String(r)
                          ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                          : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30 hover:text-[#F0F0F5]"
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="months" className="block text-sm font-medium text-[#F0F0F5]">
                  Periode (Bulan)
                </label>
                <input
                  id="months"
                  type="number"
                  placeholder="12"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  min="1"
                  max="120"
                  step="1"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                />
                <div className="flex gap-2 mt-1">
                  {[6, 12, 24, 36, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonths(String(m))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        months === String(m)
                          ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                          : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30 hover:text-[#F0F0F5]"
                      }`}
                    >
                      {m >= 12 ? `${m / 12}Y` : `${m}M`}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                id="deposit"
                label="Monthly Deposit (USD)"
                type="number"
                placeholder="0"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                min="0"
                step="100"
              />

              <Input
                id="withdraw"
                label="Monthly Withdrawal (USD)"
                type="number"
                placeholder="0"
                value={monthlyWithdraw}
                onChange={(e) => setMonthlyWithdraw(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          </Card>

          {/* Milestones */}
          {milestones.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-[#96FC03]" />
                <CardTitle className="text-sm">Milestones</CardTitle>
              </div>
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div key={m.multiplier} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#96FC03]">{m.multiplier}x</span>
                      <span className="text-xs text-[#8B949E]">${m.target.toLocaleString("en-US")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#8B949E]" />
                      <span className="text-sm font-medium text-[#F0F0F5]">
                        Bulan ke-{m.month}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Formula */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[#96FC03]" />
              <span className="text-xs font-bold text-[#F0F0F5]">Formula</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0A0F] font-mono text-xs text-[#96FC03]/80">
              Balance(n) = Balance(n-1) × (1 + return%)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ deposit - withdrawal
            </div>
          </Card>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary cards */}
          {projection && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="!p-4 border-[#96FC03]/20">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-[#96FC03]" />
                    <span className="text-xs text-[#8B949E]">Final Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-[#96FC03]">
                    ${projection.finalBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-[#8B949E] mt-1">
                    +{projection.growthPct.toFixed(1)}% growth
                  </p>
                </Card>
                <Card className="!p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-[#8B949E]" />
                    <span className="text-xs text-[#8B949E]">Total Profit</span>
                  </div>
                  <p className={`text-2xl font-bold ${projection.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {projection.totalProfit >= 0 ? "+" : ""}${projection.totalProfit.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-[#8B949E] mt-1">
                    dari compounding
                  </p>
                </Card>
              </div>

              {/* Visual growth bar chart */}
              <Card>
                <CardTitle>Proyeksi Pertumbuhan</CardTitle>
                <div className="mt-4">
                  {/* Simple bar chart */}
                  <div className="flex items-end gap-1 h-48">
                    {projection.rows.map((row, i) => {
                      const maxBalance = Math.max(...projection.rows.map((r) => r.balance));
                      const height = maxBalance > 0 ? (row.balance / maxBalance) * 100 : 0;
                      const startBal = parseFloat(startBalance) || 0;
                      const isAboveStart = row.balance > startBal;

                      // Show limited bars for long projections
                      const totalMonths = projection.rows.length;
                      if (totalMonths > 24) {
                        // Show every Nth bar
                        const step = Math.ceil(totalMonths / 24);
                        if (i % step !== 0 && i !== totalMonths - 1) return null;
                      }

                      return (
                        <div
                          key={row.month}
                          className="flex-1 flex flex-col items-center justify-end group relative min-w-0"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#222229] rounded-lg px-2.5 py-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#333]">
                            <p className="text-[#F0F0F5] font-bold">${row.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                            <p className="text-[#8B949E]">Bulan {row.month} &middot; +${row.profit.toFixed(0)}</p>
                          </div>
                          <div
                            className={`w-full rounded-t-sm transition-all duration-300 ${
                              isAboveStart ? "bg-[#96FC03]/60 hover:bg-[#96FC03]/80" : "bg-red-400/40 hover:bg-red-400/60"
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          {/* Label - only show for some bars */}
                          {(totalMonths <= 12 || i % Math.ceil(totalMonths / 12) === 0 || i === totalMonths - 1) && (
                            <span className="text-[9px] text-[#8B949E] mt-1 truncate w-full text-center">{row.month}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#8B949E] text-center mt-2">Bulan ke-</p>
                </div>
              </Card>

              {/* Projection table */}
              <Card>
                <CardTitle>Detail per Bulan</CardTitle>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#222229]">
                        <th className="text-left py-2 px-3 text-xs font-bold text-[#8B949E] uppercase">Bulan</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-[#8B949E] uppercase">Profit</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-[#8B949E] uppercase">Cum. Profit</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-[#8B949E] uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Starting row */}
                      <tr className="border-b border-[#222229]/50">
                        <td className="py-2 px-3 text-[#8B949E]">Start</td>
                        <td className="py-2 px-3 text-right text-[#8B949E]">—</td>
                        <td className="py-2 px-3 text-right text-[#8B949E]">—</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-[#F0F0F5]">
                          ${(parseFloat(startBalance) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {projection.rows.map((row) => (
                        <tr key={row.month} className="border-b border-[#222229]/50 hover:bg-[#0A0A0F]/50 transition-colors">
                          <td className="py-2 px-3 text-[#F0F0F5]">{row.month}</td>
                          <td className="py-2 px-3 text-right font-mono text-green-400">
                            +${row.profit.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#96FC03]">
                            +${row.cumProfit.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-[#F0F0F5]">
                            ${row.balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Comparison: with vs without compounding */}
              <Card>
                <CardTitle className="text-sm">Compound vs Simple Interest</CardTitle>
                <div className="mt-3">
                  {(() => {
                    const bal = parseFloat(startBalance) || 0;
                    const ret = parseFloat(monthlyReturn) || 0;
                    const m = parseInt(months) || 12;
                    const simpleTotal = bal + (bal * (ret / 100) * m);
                    const compoundTotal = projection.finalBalance;
                    const diff = compoundTotal - simpleTotal;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                          <span className="text-sm text-[#8B949E]">Simple Interest</span>
                          <span className="text-sm font-mono font-medium text-[#F0F0F5]">
                            ${simpleTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#96FC03]/5 border border-[#96FC03]/20">
                          <span className="text-sm text-[#96FC03] font-medium">Compound Interest</span>
                          <span className="text-sm font-mono font-bold text-[#96FC03]">
                            ${compoundTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                          <span className="text-sm text-green-400">Keuntungan Compounding</span>
                          <span className="text-sm font-mono font-bold text-green-400">
                            +${diff.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            </>
          )}

          {!projection && (
            <Card className="text-center py-16">
              <TrendingUp size={32} className="text-[#222229] mx-auto mb-3" />
              <p className="text-sm text-[#8B949E]">Isi parameter untuk melihat proyeksi</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
