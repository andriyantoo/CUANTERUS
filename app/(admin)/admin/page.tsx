"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, CreditCard, DollarSign, BookOpen } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalMembers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  coursesPublished: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [membersRes, subsRes, revenueRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("payments")
          .select("amount_idr")
          .eq("status", "paid"),
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
      ]);

      const totalRevenue = (revenueRes.data || []).reduce(
        (sum, p) => sum + (p.amount_idr || 0),
        0
      );

      setStats({
        totalMembers: membersRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        totalRevenue,
        coursesPublished: coursesRes.count || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Members",
          value: stats.totalMembers.toString(),
          icon: Users,
          color: "#96FC03",
        },
        {
          label: "Active Subscriptions",
          value: stats.activeSubscriptions.toString(),
          icon: CreditCard,
          color: "#3B82F6",
        },
        {
          label: "Total Revenue",
          value: `Rp ${formatCurrency(stats.totalRevenue)}`,
          icon: DollarSign,
          color: "#F59E0B",
        },
        {
          label: "Courses Published",
          value: stats.coursesPublished.toString(),
          icon: BookOpen,
          color: "#22C55E",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Admin Dashboard</h1>
        <p className="text-[#8B949E] text-sm mt-1">Ringkasan platform Cuanterus</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#8B949E]">{card.label}</span>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}15` }}
                  >
                    <card.icon size={18} style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#F0F0F5]">{card.value}</p>
              </Card>
            ))}
      </div>
    </div>
  );
}
