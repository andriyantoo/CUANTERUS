"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { Search, ShieldCheck, User } from "lucide-react";
import type { Profile, Subscription } from "@/lib/types";
import { toast } from "sonner";

interface MemberWithSub extends Profile {
  subscriptions?: Subscription[];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, subscriptions(*, product:products(*))")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMembers(data as MemberWithSub[]);
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
        <p className="text-[#8B949E] text-sm mt-1">Kelola semua anggota platform</p>
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

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Nama</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Email</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Role</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Subscription</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Bergabung</th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#222229]/50">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                : filtered.map((member) => {
                    const activeSubs = (member.subscriptions || []).filter(
                      (s) => s.status === "active"
                    );
                    return (
                      <tr key={member.id} className="border-b border-[#222229]/50 hover:bg-[#131318]/50">
                        <td className="px-6 py-4 text-[#F0F0F5] font-medium">
                          {member.full_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-[#8B949E]">{member.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={member.role === "admin" ? "lime" : "gray"}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {activeSubs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {activeSubs.map((sub) => (
                                <Badge key={sub.id} variant="blue">
                                  {sub.product?.name || sub.product_id}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#8B949E]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#8B949E]">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant={member.role === "admin" ? "danger" : "secondary"}
                            loading={updatingId === member.id}
                            onClick={() => toggleRole(member)}
                          >
                            {member.role === "admin" ? (
                              <><User size={14} className="mr-1" /> Set Member</>
                            ) : (
                              <><ShieldCheck size={14} className="mr-1" /> Set Admin</>
                            )}
                          </Button>
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
