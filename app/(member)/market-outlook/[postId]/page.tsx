"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import type { MarketOutlook } from "@/lib/types";
import { ArrowLeft, BarChart3, Calendar, Lock } from "lucide-react";

const CATEGORY_BADGE_VARIANT: Record<string, "lime" | "blue" | "amber" | "red" | "gray"> = {
  daily: "blue",
  weekly: "amber",
  special: "lime",
};

export default function MarketOutlookDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [outlook, setOutlook] = useState<MarketOutlook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hasAccess } = useAccessControl(activeSubscription, outlook?.product_id);

  useEffect(() => {
    async function fetchOutlook() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("market_outlooks")
        .select("*, product:products(*)")
        .eq("id", postId)
        .single();

      if (err || !data) {
        setError("Outlook tidak ditemukan.");
        setLoading(false);
        return;
      }

      setOutlook(data as MarketOutlook);
      setLoading(false);
    }

    if (postId) fetchOutlook();
  }, [postId]);

  const productSlug = outlook?.product?.slug ?? "forex";
  const productColor = PRODUCT_COLORS[productSlug] ?? "#96FC03";

  if (loading || subLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="aspect-[16/9] w-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !outlook) {
    return (
      <div className="max-w-3xl">
        <Card className="text-center py-12">
          <p className="text-red-400">{error ?? "Terjadi kesalahan."}</p>
          <Link href="/market-outlook" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          href="/market-outlook"
          className="inline-flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Market Outlook
        </Link>
        <Card className="text-center py-12 border-amber-500/20 bg-amber-500/5">
          <Lock size={32} className="mx-auto text-amber-400 mb-3" />
          <p className="font-semibold text-amber-400 mb-1">Akses Terkunci</p>
          <p className="text-sm text-[#8B949E] mb-4">
            Kamu perlu berlangganan untuk membaca outlook ini.
          </p>
          <Link href="/billing">
            <Button size="sm">Pilih Paket</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/market-outlook"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke Market Outlook
      </Link>

      {/* Cover image */}
      {outlook.cover_image_url && (
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-[#131318] border border-[#222229]">
          <img
            src={outlook.cover_image_url}
            alt={outlook.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="space-y-3">
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

        <h1 className="text-2xl font-bold text-[#F0F0F5]">{outlook.title}</h1>

        <div className="flex items-center gap-1.5 text-sm text-[#8B949E]">
          <Calendar size={14} />
          <span>
            {outlook.published_at
              ? formatDate(outlook.published_at)
              : formatDate(outlook.created_at)}
          </span>
        </div>
      </div>

      {/* Content */}
      <Card>
        <div
          className="prose prose-invert prose-sm max-w-none
            prose-headings:text-[#F0F0F5] prose-headings:font-bold
            prose-p:text-[#8B949E] prose-p:leading-relaxed
            prose-a:text-[#96FC03] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#F0F0F5]
            prose-img:rounded-xl prose-img:border prose-img:border-[#222229]
            prose-hr:border-[#222229]
            prose-blockquote:border-l-[#96FC03] prose-blockquote:text-[#8B949E]
            prose-code:text-[#96FC03] prose-code:bg-[#222229] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-ul:text-[#8B949E] prose-ol:text-[#8B949E]
            prose-li:text-[#8B949E]
            prose-table:text-[#8B949E]
            prose-th:text-[#F0F0F5] prose-th:border-[#222229]
            prose-td:border-[#222229]"
          dangerouslySetInnerHTML={{ __html: outlook.content }}
        />
      </Card>
    </div>
  );
}
