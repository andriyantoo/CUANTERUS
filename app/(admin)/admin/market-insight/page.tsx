"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { PRODUCT_NAMES } from "@/lib/constants";
import type { MarketInsight, Product } from "@/lib/types";
import { Plus, FileText, Trash2, Eye, EyeOff, Upload } from "lucide-react";

export default function AdminMarketInsightPage() {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [category, setCategory] = useState("daily");
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();

  async function fetchData() {
    const [insightsRes, productsRes] = await Promise.all([
      supabase
        .from("market_insights")
        .select("*, product:products(*)")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);
    setInsights((insightsRes.data ?? []) as MarketInsight[]);
    setProducts((productsRes.data ?? []) as Product[]);
    if (productsRes.data?.[0]) setProductId(productsRes.data[0].id);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !productId) return;

    setUploading(true);

    try {
      // Upload PDF to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("market-insight")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("market-insight")
        .getPublicUrl(fileName);

      // Create record
      const { error } = await supabase.from("market_insights").insert({
        title,
        description: description || null,
        product_id: productId,
        category,
        file_url: urlData.publicUrl,
        file_name: file.name,
        is_published: false,
      });

      if (error) throw error;

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("daily");
      setFile(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert("Gagal upload. Coba lagi.");
      console.error(err);
    }

    setUploading(false);
  }

  async function togglePublish(insight: MarketInsight) {
    const newPublished = !insight.is_published;
    await supabase
      .from("market_insights")
      .update({
        is_published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq("id", insight.id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin mau hapus insight ini?")) return;
    await supabase.from("market_insights").delete().eq("id", id);
    fetchData();
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Insight</h1>
          <p className="text-sm text-[#8B949E] mt-1">Upload PDF insight. Download member otomatis ter-watermark.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1.5" />
          Upload Baru
        </Button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <Card>
          <CardTitle className="mb-4">Upload Market Insight</CardTitle>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              id="title"
              label="Judul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Daily Market Outlook 3 April 2026"
              required
            />
            <Input
              id="description"
              label="Deskripsi (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat..."
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Produk</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="special">Special</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">File PDF</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#96FC03]/10 file:text-[#96FC03] file:text-xs file:font-semibold"
                />
              </div>
              {file && (
                <p className="text-xs text-[#8B949E]">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={uploading}>
                <Upload size={14} className="mr-1.5" />
                Upload
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Insights List */}
      {insights.length === 0 ? (
        <Card className="text-center py-12">
          <FileText size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada insight. Upload yang pertama!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <Card key={insight.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-[#F0F0F5] text-sm truncate">{insight.title}</h3>
                  <Badge variant={insight.is_published ? "lime" : "gray"}>
                    {insight.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="gray">
                    {PRODUCT_NAMES[insight.product?.slug ?? ""] ?? ""}
                  </Badge>
                </div>
                <p className="text-xs text-[#8B949E]">
                  {insight.file_name} — {formatDate(insight.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="secondary" onClick={() => togglePublish(insight)}>
                  {insight.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(insight.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
