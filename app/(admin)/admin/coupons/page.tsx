"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Plus, Tag, Trash2, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_amount: number;
  product_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [productId, setProductId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const supabase = createClient();

  async function fetchData() {
    const [cRes, pRes] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);
    setCoupons((cRes.data ?? []) as Coupon[]);
    setProducts((pRes.data ?? []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Kode dan nilai diskon wajib diisi");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: code.toUpperCase().trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: parseInt(discountValue),
      max_uses: maxUses ? parseInt(maxUses) : null,
      min_amount: minAmount ? parseInt(minAmount) : 0,
      product_id: productId || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: true,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Kode kupon sudah ada" : error.message);
    } else {
      toast.success(`Kupon ${code.toUpperCase()} dibuat!`);
      setCode(""); setDescription(""); setDiscountValue(""); setMaxUses("");
      setMinAmount(""); setProductId(""); setExpiresAt("");
      setShowForm(false);
      fetchData();
    }
    setSaving(false);
  }

  async function toggleActive(coupon: Coupon) {
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    fetchData();
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Yakin hapus kupon ini?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Kupon dihapus");
    fetchData();
  }

  if (loading) {
    return <div className="space-y-4 max-w-4xl"><Skeleton className="h-10 w-48" />{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kupon Diskon</h1>
          <p className="text-sm text-[#8B949E] mt-1">Kelola kode kupon dan diskon.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1.5" /> Buat Kupon
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardTitle className="mb-4">Kupon Baru</CardTitle>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input id="code" label="Kode Kupon" placeholder="WELCOME50" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              <Input id="desc" label="Deskripsi (opsional)" placeholder="Diskon 50% untuk member baru" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Tipe Diskon</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30">
                  <option value="percent">Persen (%)</option>
                  <option value="fixed">Rupiah (Rp)</option>
                </select>
              </div>
              <Input id="value" label={discountType === "percent" ? "Diskon (%)" : "Diskon (Rp)"} placeholder={discountType === "percent" ? "50" : "100000"} type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
              <Input id="maxUses" label="Max Penggunaan" placeholder="Kosong = unlimited" type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input id="minAmount" label="Min. Pembelian (Rp)" placeholder="0" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Produk (opsional)</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30">
                  <option value="">Semua Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <Input id="expires" label="Kedaluwarsa" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>Buat Kupon</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <Card className="text-center py-12">
          <Tag size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada kupon.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-[#F0F0F5] text-lg">{coupon.code}</span>
                    <Badge variant={coupon.is_active ? "lime" : "gray"}>
                      {coupon.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Badge variant={coupon.discount_type === "percent" ? "amber" : "blue"}>
                      {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `Rp ${formatCurrency(coupon.discount_value)}`}
                    </Badge>
                    {coupon.product_id && (
                      <Badge variant="gray">{PRODUCT_NAMES[products.find(p => p.id === coupon.product_id)?.slug ?? ""] ?? "Product"}</Badge>
                    )}
                  </div>
                  {coupon.description && <p className="text-xs text-[#8B949E] mb-1">{coupon.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-[#8B949E]">
                    <span>Dipakai: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}</span>
                    {coupon.expires_at && <span>Exp: {formatDate(coupon.expires_at)}</span>}
                    {coupon.min_amount > 0 && <span>Min: Rp {formatCurrency(coupon.min_amount)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success("Kode disalin!"); }}>
                    <Copy size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(coupon)}>
                    {coupon.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteCoupon(coupon.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
