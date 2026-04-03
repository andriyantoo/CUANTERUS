"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { MessageCircle, Save, Link2, Users } from "lucide-react";
import { toast } from "sonner";

interface RoleMapping {
  id: string;
  product_id: string;
  discord_role_id: string;
}

export default function AdminDiscordPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mappings, setMappings] = useState<RoleMapping[]>([]);
  const [roleInputs, setRoleInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stats
  const [linkedCount, setLinkedCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  const supabase = createClient();

  async function fetchData() {
    const [prodRes, mapRes, linkedRes, totalRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("discord_role_mappings").select("*"),
      supabase.from("profiles").select("id", { count: "exact" }).not("discord_id", "is", null),
      supabase.from("profiles").select("id", { count: "exact" }),
    ]);

    const prods = (prodRes.data ?? []) as Product[];
    const maps = (mapRes.data ?? []) as RoleMapping[];

    setProducts(prods);
    setMappings(maps);
    setLinkedCount(linkedRes.count ?? 0);
    setTotalMembers(totalRes.count ?? 0);

    // Init role inputs
    const inputs: Record<string, string> = {};
    prods.forEach((p) => {
      const existing = maps.find((m) => m.product_id === p.id);
      inputs[p.id] = existing?.discord_role_id ?? "";
    });
    setRoleInputs(inputs);

    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    setSaving(true);

    for (const product of products) {
      const roleId = roleInputs[product.id]?.trim();
      const existing = mappings.find((m) => m.product_id === product.id);

      if (roleId && existing) {
        await supabase
          .from("discord_role_mappings")
          .update({ discord_role_id: roleId })
          .eq("id", existing.id);
      } else if (roleId && !existing) {
        await supabase
          .from("discord_role_mappings")
          .insert({ product_id: product.id, discord_role_id: roleId });
      } else if (!roleId && existing) {
        await supabase
          .from("discord_role_mappings")
          .delete()
          .eq("id", existing.id);
      }
    }

    toast.success("Role mappings disimpan!");
    setSaving(false);
    fetchData();
  }

  if (loading) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-10 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle size={24} style={{ color: "#5865F2" }} />
          Discord Integration
        </h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Manage role mappings untuk auto-assign & auto-remove Discord roles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Link2 size={20} className="text-[#96FC03]" />
            <div>
              <p className="text-2xl font-bold font-mono text-[#F0F0F5]">{linkedCount}</p>
              <p className="text-xs text-[#8B949E]">Discord Terhubung</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[#8B949E]" />
            <div>
              <p className="text-2xl font-bold font-mono text-[#F0F0F5]">{totalMembers}</p>
              <p className="text-xs text-[#8B949E]">Total Members</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Role Mappings */}
      <Card>
        <CardTitle className="mb-4">Role Mapping</CardTitle>
        <p className="text-xs text-[#8B949E] mb-6">
          Masukkan Discord Role ID untuk setiap produk. Role akan otomatis di-assign saat member
          beli paket, dan dicopot saat membership expired.
          <br />
          <span className="text-[#96FC03]">
            Cara dapat Role ID: Discord Server Settings → Roles → klik kanan role → Copy Role ID
          </span>
        </p>

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4">
              <Badge variant="gray" className="w-32 justify-center">
                {PRODUCT_NAMES[product.slug] ?? product.name}
              </Badge>
              <Input
                id={`role-${product.id}`}
                placeholder="Discord Role ID (contoh: 1234567890)"
                value={roleInputs[product.id] ?? ""}
                onChange={(e) =>
                  setRoleInputs((prev) => ({ ...prev, [product.id]: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} loading={saving} size="sm">
            <Save size={14} className="mr-1.5" />
            Simpan Mappings
          </Button>
        </div>
      </Card>

      {/* How it works */}
      <Card>
        <CardTitle className="mb-3">Cara Kerja</CardTitle>
        <div className="space-y-2 text-sm text-[#8B949E]">
          <p>1. Member hubungkan Discord di halaman Profil</p>
          <p>2. Saat member beli paket → role otomatis di-assign di Discord</p>
          <p>3. Saat membership expired → role otomatis dicopot (cron daily)</p>
          <p>4. Saat member perpanjang → role di-assign lagi</p>
        </div>
      </Card>
    </div>
  );
}
