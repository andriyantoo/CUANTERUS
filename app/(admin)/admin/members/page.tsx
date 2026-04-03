"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, daysUntil } from "@/lib/utils";
import { Search, ShieldCheck, User, Gift, X, Clock } from "lucide-react";
import type { Profile, Subscription, Product } from "@/lib/types";
import { toast } from "sonner";
import { addMonths } from "date-fns";

interface MemberWithSub extends Profile {
  subscriptions?: Subscription[];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberWithSub[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Grant access modal
  const [grantingMember, setGrantingMember] = useState<MemberWithSub | null>(null);
  const [grantProductId, setGrantProductId] = useState("");
  const [grantDuration, setGrantDuration] = useState("1");
  const [granting, setGranting] = useState(false);

  // Revoke
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const [membersRes, productsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, subscriptions(*, product:products(*))")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (membersRes.data) setMembers(membersRes.data as MemberWithSub[]);
    if (productsRes.data) {
      setProducts(productsRes.data as Product[]);
      if (productsRes.data.length > 0) setGrantProductId(productsRes.data[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function toggleRole(member: Profile) {
    setUpdatingId(member.id);
    const supabase = createClient();
    const newRole = member.role === "admin" ? "member" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", member.id);

    if (error) {
      toast.error("Gagal mengubah role");
    } else {
      toast.success(`Role diubah menjadi ${newRole}`);
      fetchMembers();
    }
    setUpdatingId(null);
  }

  async function grantAccess() {
    if (!grantingMember || !grantProductId) return;

    setGranting(true);
    const supabase = createClient();
    const now = new Date();
    const months = parseInt(grantDuration);
    const expiresAt = addMonths(now, months);

    // Find if there's a matching plan for this product/duration
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("product_id", grantProductId)
      .eq("duration_months", months)
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("subscriptions").insert({
      user_id: grantingMember.id,
      plan_id: plan?.id ?? grantProductId, // fallback if no exact plan match
      product_id: grantProductId,
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error("Gagal memberikan akses: " + error.message);
    } else {
      const productName = products.find((p) => p.id === grantProductId)?.name ?? "Product";
      toast.success(`Akses ${productName} (${months} bulan) diberikan ke ${grantingMember.full_name || grantingMember.email}`);

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: grantingMember.id,
        title: "Akses Diberikan!",
        body: `Kamu mendapat akses ${productName} selama ${months} bulan dari admin. Selamat belajar!`,
        type: "success",
        link: "/dashboard",
      });

      setGrantingMember(null);
      fetchMembers();
    }
    setGranting(false);
  }

  async function revokeAccess(subscriptionId: string) {
    if (!confirm("Yakin mau cabut akses ini?")) return;

    setRevokingId(subscriptionId);
    const supabase = createClient();
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId);

    if (error) {
      toast.error("Gagal mencabut akses");
    } else {
      toast.success("Akses dicabut");
      fetchMembers();
    }
    setRevokingId(null);
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.full_name?.toLowerCase().includes(q) ?? false) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Members</h1>
        <p className="text-[#8B949E] text-sm mt-1">Kelola anggota & berikan akses langsung</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grant Access Modal */}
      {grantingMember && (
        <Card className="border-[#96FC03]/30 bg-[#96FC03]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-[#96FC03]" />
              <h3 className="font-bold text-[#F0F0F5]">Berikan Akses Langsung</h3>
            </div>
            <button onClick={() => setGrantingMember(null)} className="text-[#8B949E] hover:text-[#F0F0F5]">
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-[#8B949E] mb-4">
            Memberikan akses ke <strong className="text-[#F0F0F5]">{grantingMember.full_name || grantingMember.email}</strong> tanpa pembayaran.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">Produk</label>
              <select
                value={grantProductId}
                onChange={(e) => setGrantProductId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">Durasi</label>
              <select
                value={grantDuration}
                onChange={(e) => setGrantDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30"
              >
                <option value="1">1 Bulan</option>
                <option value="3">3 Bulan</option>
                <option value="6">6 Bulan</option>
                <option value="12">12 Bulan</option>
                <option value="24">24 Bulan</option>
                <option value="120">Lifetime (10 Tahun)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={grantAccess} loading={granting} className="w-full">
                <Gift size={14} className="mr-1.5" />
                Berikan Akses
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-4 sm:px-6 py-4 text-[#8B949E] font-medium">Member</th>
                <th className="text-left px-4 sm:px-6 py-4 text-[#8B949E] font-medium">Role</th>
                <th className="text-left px-4 sm:px-6 py-4 text-[#8B949E] font-medium">Akses Aktif</th>
                <th className="text-left px-4 sm:px-6 py-4 text-[#8B949E] font-medium">Bergabung</th>
                <th className="text-left px-4 sm:px-6 py-4 text-[#8B949E] font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#222229]/50">
                      <td className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 sm:px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                : filtered.map((member) => {
                    const activeSubs = (member.subscriptions || []).filter(
                      (s) => s.status === "active" && new Date(s.expires_at) > new Date()
                    );
                    return (
                      <tr key={member.id} className="border-b border-[#222229]/50 hover:bg-[#131318]/50">
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <p className="text-[#F0F0F5] font-medium">{member.full_name || "-"}</p>
                            <p className="text-xs text-[#8B949E]">{member.email}</p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <Badge variant={member.role === "admin" ? "lime" : "gray"}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {activeSubs.length > 0 ? (
                            <div className="space-y-1.5">
                              {activeSubs.map((sub) => {
                                const days = daysUntil(sub.expires_at);
                                return (
                                  <div key={sub.id} className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="blue">{sub.product?.name}</Badge>
                                    <span className="text-xs text-[#8B949E] flex items-center gap-1">
                                      <Clock size={10} />
                                      {days > 0 ? `${days}d left` : "Expired"}
                                    </span>
                                    <button
                                      onClick={() => revokeAccess(sub.id)}
                                      disabled={revokingId === sub.id}
                                      className="text-red-400 hover:text-red-300 text-xs underline"
                                    >
                                      {revokingId === sub.id ? "..." : "Cabut"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[#8B949E] text-xs">Tidak ada akses</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-[#8B949E] text-xs">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setGrantingMember(member)}
                            >
                              <Gift size={14} className="mr-1" />
                              Grant
                            </Button>
                            <Button
                              size="sm"
                              variant={member.role === "admin" ? "danger" : "ghost"}
                              loading={updatingId === member.id}
                              onClick={() => toggleRole(member)}
                            >
                              {member.role === "admin" ? (
                                <><User size={14} /></>
                              ) : (
                                <><ShieldCheck size={14} /></>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-[#8B949E]">
              Tidak ada member ditemukan.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
