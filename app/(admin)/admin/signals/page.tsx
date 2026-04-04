"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { SIGNAL_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import type { Signal, Product, SignalStatus, SignalDirection } from "@/lib/types";
import { toast } from "sonner";

const STATUS_BADGE_VARIANT: Record<string, "lime" | "blue" | "amber" | "red" | "gray"> = {
  active: "lime",
  tp1_hit: "blue",
  tp2_hit: "blue",
  tp3_hit: "amber",
  sl_hit: "red",
  closed: "gray",
  cancelled: "gray",
};

const ALL_STATUSES: SignalStatus[] = [
  "active",
  "tp1_hit",
  "tp2_hit",
  "tp3_hit",
  "sl_hit",
  "closed",
  "cancelled",
];

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New signal form
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState<SignalDirection>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [entryPrice2, setEntryPrice2] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [tp3, setTp3] = useState("");
  const [productId, setProductId] = useState("");
  const [notes, setNotes] = useState("");
  const [chartUrl, setChartUrl] = useState("");

  const fetchSignals = useCallback(async () => {
    const supabase = createClient();
    const [signalsRes, productsRes] = await Promise.all([
      supabase
        .from("signals")
        .select("*, product:products(*)")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (signalsRes.data) {
      setSignals(signalsRes.data as Signal[]);
    }
    if (productsRes.data) {
      setProducts(productsRes.data);
      if (!productId && productsRes.data.length > 0) {
        setProductId(productsRes.data[0].id);
      }
    }
    setLoading(false);
  }, []);

  async function sendSignalNotification(signal: Signal) {
    const supabase = createClient();
    // Get all users with active subscription for this product (or cuantroopers)
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, product_id")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    if (!subs) return;

    const { data: cuantroopersProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", "cuantroopers")
      .single();

    const targetUserIds = Array.from(new Set(
      subs
        .filter(s => s.product_id === signal.product_id || s.product_id === cuantroopersProduct?.id)
        .map(s => s.user_id)
    ));

    const dirLabel = signal.direction === "long" ? "LONG ▲" : "SHORT ▼";
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title: `Sinyal Baru: ${signal.pair} ${dirLabel}`,
      body: `Entry: ${signal.entry_price || "-"} | SL: ${signal.stop_loss || "-"} | TP1: ${signal.take_profit_1 || "-"}`,
      type: "info" as const,
      link: "/signals",
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  }

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  function resetForm() {
    setPair("");
    setDirection("long");
    setEntryPrice("");
    setEntryPrice2("");
    setStopLoss("");
    setTp1("");
    setTp2("");
    setTp3("");
    setNotes("");
    setChartUrl("");
  }

  async function handleCreate() {
    if (!pair.trim() || !productId) {
      toast.error("Pair dan produk harus diisi");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("signals").insert({
      pair: pair.trim().toUpperCase(),
      direction,
      entry_price: entryPrice ? parseFloat(entryPrice) : null,
      entry_price_2: entryPrice2 ? parseFloat(entryPrice2) : null,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit_1: tp1 ? parseFloat(tp1) : null,
      take_profit_2: tp2 ? parseFloat(tp2) : null,
      take_profit_3: tp3 ? parseFloat(tp3) : null,
      product_id: productId,
      notes: notes.trim() || null,
      chart_url: chartUrl.trim() || null,
      status: "active" as SignalStatus,
      is_published: false,
    });

    if (error) {
      toast.error("Gagal membuat sinyal: " + error.message);
    } else {
      toast.success("Sinyal berhasil dibuat");
      resetForm();
      setShowForm(false);
      fetchSignals();
    }
    setSaving(false);
  }

  async function updateStatus(signal: Signal, newStatus: SignalStatus) {
    setUpdatingId(signal.id);
    const supabase = createClient();
    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "closed" || newStatus === "cancelled") {
      updateData.closed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("signals")
      .update(updateData)
      .eq("id", signal.id);

    if (error) {
      toast.error("Gagal mengubah status");
    } else {
      toast.success(`Status diubah ke ${SIGNAL_STATUS_LABELS[newStatus]}`);
      fetchSignals();
    }
    setUpdatingId(null);
  }

  async function togglePublished(signal: Signal) {
    setTogglingId(signal.id);
    const supabase = createClient();
    const updateData: Record<string, any> = {
      is_published: !signal.is_published,
    };
    if (!signal.is_published) {
      updateData.published_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("signals")
      .update(updateData)
      .eq("id", signal.id);

    if (error) {
      toast.error("Gagal mengubah status publish");
    } else {
      // Send notification to all members with matching subscription when publishing
      if (!signal.is_published) {
        sendSignalNotification(signal).catch(() => {});
        toast.success("Sinyal dipublish & notifikasi dikirim!");
      }
      fetchSignals();
    }
    setTogglingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Signals</h1>
          <p className="text-[#8B949E] text-sm mt-1">
            Kelola sinyal trading untuk member
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? (
            <>
              <X size={14} className="mr-1" /> Batal
            </>
          ) : (
            <>
              <Plus size={14} className="mr-1" /> Buat Sinyal
            </>
          )}
        </Button>
      </div>

      {/* Create Signal Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-[#F0F0F5] mb-4">Sinyal Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Pair"
              placeholder="EUR/USD, BTC/USDT"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as SignalDirection)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">
                Produk
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Entry Price 1"
              type="number"
              step="any"
              placeholder="1.0850"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
            <Input
              label="Entry Price 2 (opsional)"
              type="number"
              step="any"
              placeholder="1.0830"
              value={entryPrice2}
              onChange={(e) => setEntryPrice2(e.target.value)}
            />
            <Input
              label="Stop Loss"
              type="number"
              step="any"
              placeholder="1.0800"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
            <Input
              label="Take Profit 1"
              type="number"
              step="any"
              placeholder="1.0900"
              value={tp1}
              onChange={(e) => setTp1(e.target.value)}
            />
            <Input
              label="Take Profit 2"
              type="number"
              step="any"
              placeholder="1.0950"
              value={tp2}
              onChange={(e) => setTp2(e.target.value)}
            />
            <Input
              label="Take Profit 3"
              type="number"
              step="any"
              placeholder="1.1000"
              value={tp3}
              onChange={(e) => setTp3(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">
                Notes
              </label>
              <textarea
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-none"
              />
            </div>
            <Input
              id="chart_url"
              label="TradingView / Chart URL (opsional)"
              placeholder="https://www.tradingview.com/chart/..."
              value={chartUrl}
              onChange={(e) => setChartUrl(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreate} loading={saving}>
              Simpan Sinyal
            </Button>
          </div>
        </Card>
      )}

      {/* Signals Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Pair</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Direction</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Entry</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">SL / TP</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Status</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Produk</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Tanggal</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#222229]/50">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                : signals.map((signal) => (
                    <tr
                      key={signal.id}
                      className="border-b border-[#222229]/50 hover:bg-[#131318]/50"
                    >
                      <td className="px-6 py-4 text-[#F0F0F5] font-semibold">
                        {signal.pair}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {signal.direction === "long" ? (
                            <TrendingUp size={14} className="text-green-400" />
                          ) : (
                            <TrendingDown size={14} className="text-red-400" />
                          )}
                          <span
                            className={
                              signal.direction === "long"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {signal.direction.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#F0F0F5] font-mono text-xs">
                        {signal.entry_price ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono space-y-0.5">
                          <div className="text-red-400">SL: {signal.stop_loss ?? "-"}</div>
                          <div className="text-green-400">
                            TP: {signal.take_profit_1 ?? "-"} / {signal.take_profit_2 ?? "-"} / {signal.take_profit_3 ?? "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={signal.status}
                          onChange={(e) =>
                            updateStatus(signal, e.target.value as SignalStatus)
                          }
                          disabled={updatingId === signal.id}
                          className="px-2 py-1 rounded-lg bg-[#0A0A0F] border border-[#222229] text-xs text-[#F0F0F5] focus:outline-none focus:ring-1 focus:ring-[#96FC03]/30"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {SIGNAL_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="blue">
                          {signal.product?.name || signal.product_id}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8B949E] text-xs">
                        {formatDateTime(signal.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant={signal.is_published ? "secondary" : "primary"}
                          onClick={() => togglePublished(signal)}
                          loading={togglingId === signal.id}
                        >
                          {signal.is_published ? "Published" : "Publish"}
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && signals.length === 0 && (
            <div className="text-center py-12 text-[#8B949E]">
              Belum ada sinyal. Klik &quot;Buat Sinyal&quot; untuk memulai.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
