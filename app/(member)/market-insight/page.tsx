"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { PRODUCT_NAMES } from "@/lib/constants";
import type { MarketInsight } from "@/lib/types";
import { FileText, Download, Eye, Lock, Filter } from "lucide-react";

const categoryLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  special: "Special",
};

const categoryVariants: Record<string, "lime" | "blue" | "amber" | "red"> = {
  daily: "lime",
  weekly: "blue",
  monthly: "amber",
  special: "red",
};

export default function MarketInsightPage() {
  const { user } = useUser();
  const { activeSubscription } = useSubscription(user?.id);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("market_insights")
        .select("*, product:products(*)")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      setInsights((data ?? []) as MarketInsight[]);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = insights.filter(
    (i) => categoryFilter === "all" || i.category === categoryFilter
  );

  const hasAccess = (insight: MarketInsight) => {
    if (!activeSubscription) return false;
    if (new Date(activeSubscription.expires_at) < new Date()) return false;
    if (activeSubscription.product?.slug === "cuantroopers") return true;
    return activeSubscription.product_id === insight.product_id;
  };

  async function handleDownload(insight: MarketInsight) {
    setDownloading(insight.id);
    try {
      const res = await window.fetch(`/api/insights/download?id=${insight.id}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = insight.file_name.replace(/\.pdf$/i, "") + "_watermarked.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal download file. Coba lagi.");
    }
    setDownloading(null);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Market Insight</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Analisa market dalam format PDF. Download otomatis ter-watermark dengan nama & email kamu.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-[#8B949E]" />
        {["all", "daily", "weekly", "monthly", "special"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              categoryFilter === cat
                ? "bg-[#96FC03]/10 text-[#96FC03]"
                : "text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]"
            }`}
          >
            {cat === "all" ? "Semua" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileText size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada insight tersedia.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((insight) => {
            const canAccess = hasAccess(insight);

            return (
              <Card key={insight.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-red-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[#F0F0F5] truncate">
                      {insight.title}
                    </h3>
                    <Badge variant={categoryVariants[insight.category] || "gray"}>
                      {categoryLabels[insight.category]}
                    </Badge>
                    <Badge variant="gray">
                      {PRODUCT_NAMES[insight.product?.slug ?? ""] ?? ""}
                    </Badge>
                  </div>
                  {insight.description && (
                    <p className="text-xs text-[#8B949E] mb-1 line-clamp-1">
                      {insight.description}
                    </p>
                  )}
                  <p className="text-xs text-[#8B949E]">
                    {insight.published_at
                      ? formatDate(insight.published_at)
                      : formatDate(insight.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canAccess ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setViewing(viewing === insight.id ? null : insight.id)
                        }
                      >
                        <Eye size={14} className="mr-1.5" />
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        loading={downloading === insight.id}
                        onClick={() => handleDownload(insight)}
                      >
                        <Download size={14} className="mr-1.5" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
                      <Lock size={14} />
                      <span>Upgrade untuk akses</span>
                    </div>
                  )}
                </div>

                {/* Inline PDF viewer */}
                {viewing === insight.id && canAccess && (
                  <div className="w-full mt-4 sm:col-span-full">
                    <iframe
                      src={insight.file_url}
                      className="w-full h-[600px] rounded-xl border border-[#222229]"
                      title={insight.title}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
