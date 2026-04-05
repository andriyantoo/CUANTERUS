"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PRODUCT_NAMES,
  PRODUCT_COLORS,
  SIGNAL_STATUS_LABELS,
} from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import type { Signal, SignalStatus, ProductSlug } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";

type ProductFilter = "all" | ProductSlug;
type StatusFilter = "all" | SignalStatus;

const PRODUCT_FILTERS: { label: string; value: ProductFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Forex", value: "forex" },
  { label: "Crypto", value: "crypto" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Active", value: "active" },
  { label: "TP1 Hit", value: "tp1_hit" },
  { label: "TP2 Hit", value: "tp2_hit" },
  { label: "TP3 Hit", value: "tp3_hit" },
  { label: "SL Hit", value: "sl_hit" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_BADGE_VARIANT: Record<string, "lime" | "blue" | "amber" | "red" | "gray"> = {
  active: "blue",
  tp1_hit: "lime",
  tp2_hit: "lime",
  tp3_hit: "lime",
  sl_hit: "red",
  closed: "gray",
  cancelled: "gray",
};

function formatPrice(value: number | null): string {
  if (value === null) return "-";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

function SignalCard({ signal, hasAccess }: { signal: Signal; hasAccess: boolean }) {
  const isLong = signal.direction === "long";
  const directionColor = isLong ? "#22C55E" : "#EF4444";
  const productSlug = signal.product?.slug ?? "forex";
  const productColor = PRODUCT_COLORS[productSlug] ?? "#96FC03";

  return (
    <Card className="relative overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: directionColor }}
      />

      {!hasAccess && (
        <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <Lock size={24} className="text-[#8B949E]" />
          <p className="text-xs text-[#8B949E]">Berlangganan untuk melihat</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Header: pair + direction + badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isLong ? (
              <ArrowUpCircle size={22} style={{ color: directionColor }} />
            ) : (
              <ArrowDownCircle size={22} style={{ color: directionColor }} />
            )}
            <div>
              <h3 className="text-[#F0F0F5] font-bold text-lg leading-none">
                {signal.pair}
              </h3>
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: directionColor }}
              >
                {isLong ? "Long" : "Short"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              className="text-[10px]"
              style={{
                background: `${productColor}15`,
                color: productColor,
                borderColor: `${productColor}40`,
              } as React.CSSProperties}
            >
              {PRODUCT_NAMES[productSlug] ?? productSlug}
            </Badge>
            <Badge variant={STATUS_BADGE_VARIANT[signal.status] ?? "gray"}>
              {SIGNAL_STATUS_LABELS[signal.status] ?? signal.status}
            </Badge>
          </div>
        </div>

        {/* Prices grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-[#8B949E] text-xs">Entry</p>
            <p className="text-[#F0F0F5] font-mono font-medium">
              {formatPrice(signal.entry_price)}
            </p>
          </div>
          <div>
            <p className="text-[#8B949E] text-xs">Stop Loss</p>
            <p className="text-red-400 font-mono font-medium">
              {formatPrice(signal.stop_loss)}
            </p>
          </div>
          <div>
            <p className="text-[#8B949E] text-xs">TP1</p>
            <p className="text-[#96FC03] font-mono font-medium">
              {formatPrice(signal.take_profit_1)}
            </p>
          </div>
          <div>
            <p className="text-[#8B949E] text-xs">TP2</p>
            <p className="text-[#96FC03] font-mono font-medium">
              {formatPrice(signal.take_profit_2)}
            </p>
          </div>
          {signal.take_profit_3 !== null && (
            <div>
              <p className="text-[#8B949E] text-xs">TP3</p>
              <p className="text-[#96FC03] font-mono font-medium">
                {formatPrice(signal.take_profit_3)}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {signal.notes && (
          <p className="text-xs text-[#8B949E] leading-relaxed border-t border-[#222229] pt-3 line-clamp-3">
            {signal.notes}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-[#8B949E]/60">
          {formatRelative(signal.created_at)}
        </p>
      </div>
    </Card>
  );
}

export default function SignalsPage() {
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function fetchSignals() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("signals")
        .select("*, product:products(*)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (err) {
        setError("Gagal memuat sinyal trading.");
        setLoading(false);
        return;
      }

      setSignals((data ?? []) as Signal[]);
      setLoading(false);
    }

    fetchSignals();
  }, []);

  const filtered = signals.filter((s) => {
    if (productFilter !== "all" && s.product?.slug !== productFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Sinyal Trading</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Sinyal trading terbaru dari tim analis kami.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRODUCT_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={productFilter === f.value ? "primary" : "secondary"}
              onClick={() => setProductFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "primary" : "secondary"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading || subLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <TrendingUp size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada sinyal tersedia.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((signal) => {
            const { hasAccess } = useAccessControl(
              activeSubscription,
              signal.product_id
            );
            return (
              <SignalCard
                key={signal.id}
                signal={signal}
                hasAccess={hasAccess}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
