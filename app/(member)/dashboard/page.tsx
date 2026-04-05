"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { daysUntil, formatDate, formatRelative, formatCurrency } from "@/lib/utils";
import { PRODUCT_NAMES, SIGNAL_STATUS_LABELS } from "@/lib/constants";
import {
  BookOpen, TrendingUp, TrendingDown, BarChart3, Clock, AlertTriangle,
  FileText, MessageSquare, Activity, CreditCard, ArrowRight, Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import type { Signal, MarketInsight, ForumThread } from "@/lib/types";

const quickLinks = [
  { href: "/courses", label: "Edukasi", icon: BookOpen, desc: "Mulai belajar", color: "#96FC03" },
  { href: "/signals", label: "Sinyal", icon: TrendingUp, desc: "Market outlook terbaru", color: "#3B82F6" },
  { href: "/market-insight", label: "Market Insight", icon: FileText, desc: "Download PDF analisa", color: "#F59E0B" },
  { href: "/analisa", label: "Analisa", icon: BarChart3, desc: "TradingView charts", color: "#8B5CF6" },
  { href: "/indicator", label: "Golden Trap", icon: Activity, desc: "Indikator eksklusif", color: "#EC4899" },
  { href: "/forum", label: "Forum", icon: MessageSquare, desc: "Diskusi & sharing", color: "#06B6D4" },
];

export default function DashboardPage() {
  const { user, profile, subscription: activeSubscription, loading } = useUser();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const daysLeft = activeSubscription ? daysUntil(activeSubscription.expires_at) : 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 14;
  const totalDays = activeSubscription
    ? Math.ceil((new Date(activeSubscription.expires_at).getTime() - new Date(activeSubscription.starts_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const progressPercent = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 0;

  // Check if first login (show welcome)
  useEffect(() => {
    if (profile?.created_at) {
      const created = new Date(profile.created_at);
      const now = new Date();
      const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated < 48) {
        setShowWelcome(true);
      }
    }
  }, [profile]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [signalsRes, insightsRes, threadsRes] = await Promise.all([
        supabase
          .from("signals")
          .select("*, product:products(*)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("market_insights")
          .select("*, product:products(*)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("forum_threads")
          .select("*, author:profiles(full_name, role), channel:forum_channels(name, icon)")
          .order("last_activity_at", { ascending: false })
          .limit(5),
      ]);

      setSignals((signalsRes.data ?? []) as Signal[]);
      setInsights((insightsRes.data ?? []) as MarketInsight[]);
      setThreads((threadsRes.data ?? []) as ForumThread[]);
      setLoadingData(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome Banner (new members, first 48h) */}
      {showWelcome && (
        <Card className="border-[#96FC03]/30 bg-gradient-to-r from-[#96FC03]/10 to-transparent relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-[#8B949E] hover:text-[#F0F0F5]"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-[#96FC03] flex-shrink-0" />
            <div>
              <h2 className="font-bold text-[#F0F0F5]">Selamat datang di Cuanterus! 🎉</h2>
              <p className="text-sm text-[#8B949E] mt-1">
                Mulai perjalanan trading kamu. Pilih paket di{" "}
                <Link href="/billing" className="text-[#96FC03] underline">Billing</Link>,
                lalu akses semua materi edukasi, sinyal, dan komunitas.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Halo, {profile?.full_name?.split(" ")[0] || "Member"} 👋
        </h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Selamat datang di member area Cuanterus.
        </p>
      </div>

      {/* Subscription Status with Progress Bar */}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : activeSubscription ? (
        <Card className={isExpiringSoon ? "border-amber-500/20 bg-amber-500/5" : "border-[#96FC03]/20 bg-[#96FC03]/5"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="lime">Aktif</Badge>
                <Badge variant="gray">
                  {PRODUCT_NAMES[activeSubscription.product?.slug ?? ""] ?? "Plan"}
                </Badge>
              </div>
              <p className="text-sm text-[#8B949E] mt-1 flex items-center gap-1.5">
                <Clock size={14} />
                {formatDate(activeSubscription.starts_at)} — {formatDate(activeSubscription.expires_at)}
                {isExpiringSoon && (
                  <span className="text-amber-400 flex items-center gap-1 ml-2">
                    <AlertTriangle size={14} />
                    {daysLeft} hari lagi
                  </span>
                )}
              </p>
            </div>
            {isExpiringSoon && (
              <Link href="/billing">
                <Button size="sm">Perpanjang</Button>
              </Link>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#222229] rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: isExpiringSoon
                  ? "linear-gradient(90deg, #F59E0B, #EF4444)"
                  : "linear-gradient(90deg, #96FC03, #3B82F6)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[#8B949E]">
            <span>Mulai</span>
            <span>{daysLeft > 0 ? `${daysLeft} hari tersisa` : "Berakhir"}</span>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-400 flex items-center gap-2">
                <AlertTriangle size={16} />
                Belum ada paket aktif
              </p>
              <p className="text-sm text-[#8B949E] mt-1">
                Pilih paket untuk mulai mengakses semua fitur.
              </p>
            </div>
            <Link href="/billing">
              <Button size="sm">Pilih Paket</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card hover className="h-full">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  <item.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F0F0F5] truncate">{item.label}</p>
                  <p className="text-[10px] text-[#8B949E] truncate">{item.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Latest Signals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#F0F0F5] flex items-center gap-2">
            <TrendingUp size={16} className="text-[#96FC03]" />
            Sinyal Terbaru
          </h2>
          <Link href="/signals" className="text-xs text-[#96FC03] hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>
        {loadingData ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : signals.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-xs text-[#8B949E]">Belum ada sinyal.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {signals.map((s) => (
              <Link key={s.id} href="/signals">
                <Card hover className="!p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.direction === "long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {s.direction === "long" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#F0F0F5]">{s.pair}</span>
                        <Badge variant={s.direction === "long" ? "lime" : "red"} className="text-[8px]">
                          {s.direction.toUpperCase()}
                        </Badge>
                        <Badge variant="gray" className="text-[8px]">
                          {SIGNAL_STATUS_LABELS[s.status]}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[#8B949E]">
                        Entry: {s.entry_price ?? "-"} | SL: {s.stop_loss ?? "-"} | TP1: {s.take_profit_1 ?? "-"}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#8B949E] flex-shrink-0">{formatRelative(s.created_at)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Latest Market Insight */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#F0F0F5] flex items-center gap-2">
              <FileText size={16} className="text-[#F59E0B]" />
              Market Insight Terbaru
            </h2>
            <Link href="/market-insight" className="text-xs text-[#96FC03] hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {insights.map((insight) => (
              <Link key={insight.id} href="/market-insight">
                <Card hover className="!p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-[#F0F0F5] truncate">{insight.title}</p>
                  </div>
                  <p className="text-[10px] text-[#8B949E]">{formatRelative(insight.created_at)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Forum Highlights */}
      {threads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#F0F0F5] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#06B6D4]" />
              Diskusi Terbaru
            </h2>
            <Link href="/forum" className="text-xs text-[#96FC03] hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <Card className="!p-0 divide-y divide-[#222229]">
            {threads.map((thread) => (
              <Link key={thread.id} href="/forum" className="block px-4 py-3 hover:bg-[#131318]/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{thread.channel?.icon}</span>
                  <p className="text-sm text-[#F0F0F5] truncate flex-1">{thread.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-[#8B949E]">
                      {thread.author?.full_name?.split(" ")[0] || "Member"}
                    </span>
                    {thread.author?.role === "admin" && (
                      <Badge variant="amber" className="text-[6px] py-0 px-1">Mentor</Badge>
                    )}
                    <span className="text-[10px] text-[#8B949E]">{formatRelative(thread.last_activity_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
