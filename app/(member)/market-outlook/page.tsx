"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  OUTLOOK_CATEGORY_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { MarketOutlook, OutlookCategory } from "@/lib/types";
import { BarChart3, Calendar, Lock } from "lucide-react";

type CategoryFilter = "all" | OutlookCategory;

const CATEGORY_FILTERS: { label: string; value: CategoryFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Special", value: "special" },
];

const CATEGORY_BADGE_VARIANT: Record<string, "lime" | "blue" | "amber" | "red" | "gray"> = {
  daily: "blue",
  weekly: "amber",
  special: "lime",
};

function OutlookCard({
  outlook,
  hasAccess,
}: {
  outlook: MarketOutlook;
  hasAccess: boolean;
}) {
  const productSlug = outlook.product?.slug ?? "forex";
  const productColor = PRODUCT_COLORS[productSlug] ?? "#96FC03";

  return (
    <Link href={`/market-outlook/${outlook.id}`}>
      <Card hover className="h-full overflow-hidden p-0">
        {/* Cover image */}
        <div className="relative aspect-[16/9] bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
          {outlook.cover_image_url ? (
            <img
              src={outlook.cover_image_url}
              alt={outlook.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BarChart3 size={40} className="text-[#222229]" />
          )}
          {!hasAccess && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Lock size={28} className="text-[#8B949E]" />
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={CATEGORY_BADGE_VARIANT[outlook.category] ?? "gray"}>
              {OUTLOOK_CATEGORY_LABELS[outlook.category] ?? outlook.category}
            </Badge>
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
          </div>

          <h3 className="text-[#F0F0F5] font-semibold leading-snug line-clamp-2">
            {outlook.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <Calendar size={14} />
            <span>
              {outlook.published_at
                ? formatDate(outlook.published_at)
                : formatDate(outlook.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function MarketOutlookPage() {
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [outlooks, setOutlooks] = useState<MarketOutlook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    async function fetchOutlooks() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("market_outlooks")
        .select("*, product:products(*)")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (err) {
        setError("Gagal memuat market outlook.");
        setLoading(false);
        return;
      }

      setOutlooks((data ?? []) as MarketOutlook[]);
      setLoading(false);
    }

    fetchOutlooks();
  }, []);

  const filtered =
    categoryFilter === "all"
      ? outlooks
      : outlooks.filter((o) => o.category === categoryFilter);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Market Outlook</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Analisa dan pandangan pasar dari tim analis kami.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={categoryFilter === f.value ? "primary" : "secondary"}
            onClick={() => setCategoryFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading || subLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BarChart3 size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada market outlook tersedia.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((outlook) => {
            const { hasAccess } = useAccessControl(
              activeSubscription,
              outlook.product_id
            );
            return (
              <OutlookCard
                key={outlook.id}
                outlook={outlook}
                hasAccess={hasAccess}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
