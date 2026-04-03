"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { daysUntil, formatDate } from "@/lib/utils";
import { PRODUCT_NAMES } from "@/lib/constants";
import { BookOpen, TrendingUp, BarChart3, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

const quickLinks = [
  { href: "/courses", label: "Kursus", icon: BookOpen, desc: "Mulai belajar" },
  { href: "/signals", label: "Sinyal", icon: TrendingUp, desc: "Lihat sinyal terbaru" },
  { href: "/market-outlook", label: "Market Outlook", icon: BarChart3, desc: "Analisa harian" },
];

export default function DashboardPage() {
  const { profile, subscription: activeSubscription, loading } = useUser();

  const daysLeft = activeSubscription ? daysUntil(activeSubscription.expires_at) : 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 14;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">
          Halo, {profile?.full_name?.split(" ")[0] || "Member"} 👋
        </h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Selamat datang di member area Cuanterus.
        </p>
      </div>

      {/* Subscription Status */}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : activeSubscription ? (
        <Card className="border-[#96FC03]/20 bg-[#96FC03]/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="lime">Aktif</Badge>
                <Badge variant="gray">
                  {PRODUCT_NAMES[activeSubscription.product?.slug ?? ""] ?? "Plan"}
                </Badge>
              </div>
              <p className="text-sm text-[#8B949E] mt-2 flex items-center gap-1.5">
                <Clock size={14} />
                Berlaku sampai {formatDate(activeSubscription.expires_at)}
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

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card hover className="h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center text-[#96FC03]">
                  <item.icon size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <p className="text-xs text-[#8B949E]">{item.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
