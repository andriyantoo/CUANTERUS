"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  BarChart3,
  Trash2,
  ChevronDown,
  ChevronUp,
  LineChart,
  ExternalLink,
} from "lucide-react";

interface Trade {
  id: string;
  pair: string;
  direction: "long" | "short";
  lot_size: number;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  pnl_usd: number | null;
  status: "open" | "win" | "loss" | "breakeven";
  setup: string | null;
  notes: string | null;
  traded_at: string;
  closed_at: string | null;
}

const PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "USD/CHF", "AUD/USD", "NZD/USD",
  "EUR/JPY", "GBP/JPY", "AUD/JPY", "EUR/GBP", "EUR/AUD", "GBP/AUD", "XAU/USD",
];

// Map pair format to TradingView symbol
function toTvSymbol(pair: string): string {
  const clean = pair.replace("/", "");
  if (clean === "XAUUSD") return "OANDA:XAUUSD";
  return "FX:" + clean;
}

function TradingViewChart({ symbol, className }: { symbol: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "60",
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(19, 19, 24, 1)",
      gridColor: "rgba(34, 34, 41, 0.6)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default function TradingJournalPage() {
  const { user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showChart, setShowChart] = useState(true);
  const [chartPair, setChartPair] = useState("EUR/USD");

  // Form state
  const [form, setForm] = useState({
    pair: "EUR/USD",
    direction: "long" as "long" | "short",
    lot_size: "",
    entry_price: "",
    stop_loss: "",
    take_profit: "",
    exit_price: "",
    pnl_usd: "",
    status: "open" as Trade["status"],
    setup: "",
    notes: "",
    traded_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (user) loadTrades();
  }, [user]);

  async function loadTrades() {
    const supabase = createClient();
    const { data } = await supabase
      .from("trade_journal")
      .select("*")
      .eq("user_id", user!.id)
      .order("traded_at", { ascending: false });

    setTrades(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("trade_journal").insert({
      user_id: user!.id,
      pair: form.pair,
      direction: form.direction,
      lot_size: parseFloat(form.lot_size),
      entry_price: parseFloat(form.entry_price),
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      pnl_usd: form.pnl_usd ? parseFloat(form.pnl_usd) : null,
      status: form.status,
      setup: form.setup || null,
      notes: form.notes || null,
      traded_at: new Date(form.traded_at).toISOString(),
      closed_at: form.status !== "open" ? new Date().toISOString() : null,
    });

    if (!error) {
      setShowForm(false);
      setForm({
        pair: "EUR/USD", direction: "long", lot_size: "", entry_price: "",
        stop_loss: "", take_profit: "", exit_price: "", pnl_usd: "",
        status: "open", setup: "", notes: "",
        traded_at: new Date().toISOString().slice(0, 16),
      });
      await loadTrades();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("trade_journal").delete().eq("id", id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }

  const filteredTrades = useMemo(() => {
    if (filterStatus === "all") return trades;
    return trades.filter((t) => t.status === filterStatus);
  }, [trades, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status !== "open");
    const wins = closed.filter((t) => t.status === "win").length;
    const losses = closed.filter((t) => t.status === "loss").length;
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl_usd || 0), 0);
    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
    const avgWin = wins > 0
      ? closed.filter((t) => t.status === "win").reduce((s, t) => s + (t.pnl_usd || 0), 0) / wins
      : 0;
    const avgLoss = losses > 0
      ? Math.abs(closed.filter((t) => t.status === "loss").reduce((s, t) => s + (t.pnl_usd || 0), 0) / losses)
      : 0;

    return { total: closed.length, wins, losses, totalPnl, winRate, avgWin, avgLoss };
  }, [trades]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center">
            <BookOpen size={20} className="text-[#96FC03]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F0F5]">Trading Journal</h1>
            <p className="text-sm text-[#8B949E]">Catat dan analisa setiap trade kamu</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? <X size={16} className="mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
          {showForm ? "Batal" : "Tambah Trade"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-[#8B949E]" />
            <span className="text-xs text-[#8B949E]">Total Trades</span>
          </div>
          <p className="text-2xl font-bold text-[#F0F0F5]">{stats.total}</p>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-[#96FC03]" />
            <span className="text-xs text-[#8B949E]">Win Rate</span>
          </div>
          <p className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-[#8B949E]">{stats.wins}W / {stats.losses}L</p>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-[#8B949E]" />
            <span className="text-xs text-[#8B949E]">Total P&L</span>
          </div>
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
          </p>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#8B949E]" />
            <span className="text-xs text-[#8B949E]">Avg Win / Loss</span>
          </div>
          <p className="text-sm font-bold text-green-400">+${stats.avgWin.toFixed(2)}</p>
          <p className="text-sm font-bold text-red-400">-${stats.avgLoss.toFixed(2)}</p>
        </Card>
      </div>

      {/* TradingView Chart */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#222229]">
          <div className="flex items-center gap-3">
            <LineChart size={16} className="text-[#96FC03]" />
            <span className="text-sm font-bold text-[#F0F0F5]">Live Chart</span>
            {/* Pair quick switch */}
            <select
              value={chartPair}
              onChange={(e) => setChartPair(e.target.value)}
              className="ml-2 px-3 py-1 rounded-lg bg-[#0A0A0F] border border-[#222229] text-[#F0F0F5] text-xs focus:outline-none focus:ring-1 focus:ring-[#96FC03]/30"
            >
              {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.tradingview.com/chart/?symbol=${toTvSymbol(chartPair)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-[#96FC03] transition-colors"
            >
              <ExternalLink size={12} />
              Buka di TradingView
            </a>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#222229] text-[#8B949E] hover:text-[#F0F0F5] hover:border-[#96FC03]/30 transition-colors"
            >
              {showChart ? "Tutup" : "Buka"}
            </button>
          </div>
        </div>
        {showChart && (
          <TradingViewChart
            symbol={toTvSymbol(chartPair)}
            className="h-[400px] md:h-[500px]"
          />
        )}
      </Card>

      {/* New Trade Form */}
      {showForm && (
        <Card className="border-[#96FC03]/20">
          <CardTitle>Trade Baru</CardTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Pair */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Pair</label>
                <select
                  value={form.pair}
                  onChange={(e) => { setForm({ ...form, pair: e.target.value }); setChartPair(e.target.value); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                >
                  {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Direction */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, direction: "long" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.direction === "long"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30"
                    }`}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, direction: "short" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.direction === "short"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30"
                    }`}
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* Lot Size */}
              <Input
                id="lot"
                label="Lot Size"
                type="number"
                placeholder="0.10"
                value={form.lot_size}
                onChange={(e) => setForm({ ...form, lot_size: e.target.value })}
                required
                min="0.01"
                step="0.01"
              />

              {/* Date */}
              <Input
                id="traded_at"
                label="Tanggal Trade"
                type="datetime-local"
                value={form.traded_at}
                onChange={(e) => setForm({ ...form, traded_at: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                id="entry"
                label="Entry Price"
                type="number"
                placeholder="1.08500"
                value={form.entry_price}
                onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                required
                step="0.00001"
              />
              <Input
                id="sl"
                label="Stop Loss"
                type="number"
                placeholder="1.08000"
                value={form.stop_loss}
                onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                step="0.00001"
              />
              <Input
                id="tp"
                label="Take Profit"
                type="number"
                placeholder="1.09500"
                value={form.take_profit}
                onChange={(e) => setForm({ ...form, take_profit: e.target.value })}
                step="0.00001"
              />
              <Input
                id="exit"
                label="Exit Price"
                type="number"
                placeholder="1.09200"
                value={form.exit_price}
                onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
                step="0.00001"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* P&L */}
              <Input
                id="pnl"
                label="P&L (USD)"
                type="number"
                placeholder="150.00"
                value={form.pnl_usd}
                onChange={(e) => setForm({ ...form, pnl_usd: e.target.value })}
                step="0.01"
              />

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Trade["status"] })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
                >
                  <option value="open">Open</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </div>

              {/* Setup */}
              <div className="col-span-2">
                <Input
                  id="setup"
                  label="Setup / Strategy"
                  type="text"
                  placeholder="e.g. Breakout, Pullback, Supply & Demand"
                  value={form.setup}
                  onChange={(e) => setForm({ ...form, setup: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">Notes</label>
              <textarea
                placeholder="Catatan tentang trade ini..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Simpan Trade
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Semua" },
          { key: "open", label: "Open" },
          { key: "win", label: "Win" },
          { key: "loss", label: "Loss" },
          { key: "breakeven", label: "BE" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filterStatus === f.key
                ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30 hover:text-[#F0F0F5]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trade List */}
      {filteredTrades.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen size={32} className="text-[#222229] mx-auto mb-3" />
          <p className="text-sm text-[#8B949E]">
            {trades.length === 0 ? "Belum ada trade. Mulai catat trade pertama kamu!" : "Tidak ada trade dengan filter ini."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => (
            <Card key={trade.id} className="!p-0 overflow-hidden">
              <button
                onClick={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Direction indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    trade.direction === "long" ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    {trade.direction === "long"
                      ? <TrendingUp size={16} className="text-green-400" />
                      : <TrendingDown size={16} className="text-red-400" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#F0F0F5]">{trade.pair}</span>
                      <Badge variant={
                        trade.status === "win" ? "lime" :
                        trade.status === "loss" ? "red" :
                        trade.status === "open" ? "blue" : "gray"
                      }>
                        {trade.status.toUpperCase()}
                      </Badge>
                      {trade.setup && (
                        <span className="text-xs text-[#8B949E] hidden sm:inline">{trade.setup}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8B949E]">{formatDateTime(trade.traded_at)} &middot; {trade.lot_size} lot</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {trade.pnl_usd !== null && (
                    <span className={`font-bold text-sm ${trade.pnl_usd >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {trade.pnl_usd >= 0 ? "+" : ""}${trade.pnl_usd.toFixed(2)}
                    </span>
                  )}
                  {expandedTrade === trade.id
                    ? <ChevronUp size={16} className="text-[#8B949E]" />
                    : <ChevronDown size={16} className="text-[#8B949E]" />}
                </div>
              </button>

              {/* Expanded details */}
              {expandedTrade === trade.id && (
                <div className="px-4 pb-4 pt-0 border-t border-[#222229]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-[#8B949E] mb-0.5">Entry</p>
                      <p className="text-[#F0F0F5] font-mono">{trade.entry_price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B949E] mb-0.5">Stop Loss</p>
                      <p className="text-red-400 font-mono">{trade.stop_loss ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B949E] mb-0.5">Take Profit</p>
                      <p className="text-green-400 font-mono">{trade.take_profit ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B949E] mb-0.5">Exit</p>
                      <p className="text-[#F0F0F5] font-mono">{trade.exit_price ?? "—"}</p>
                    </div>
                  </div>
                  {trade.notes && (
                    <div className="mt-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#222229]">
                      <p className="text-xs text-[#8B949E] mb-1">Notes</p>
                      <p className="text-sm text-[#F0F0F5] whitespace-pre-wrap">{trade.notes}</p>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(trade.id)}>
                      <Trash2 size={14} className="mr-1" /> Hapus
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
