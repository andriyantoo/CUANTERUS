"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import type { MarketOutlook, Product, OutlookCategory } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminMarketOutlookEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<MarketOutlook | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [category, setCategory] = useState<OutlookCategory>("daily");
  const [productId, setProductId] = useState("");

  const fetchPost = useCallback(async () => {
    const supabase = createClient();
    const [postRes, productsRes] = await Promise.all([
      supabase
        .from("market_outlooks")
        .select("*, product:products(*)")
        .eq("id", postId)
        .single(),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (postRes.data) {
      const p = postRes.data as MarketOutlook;
      setPost(p);
      setTitle(p.title);
      setSlug(p.slug);
      setContent(p.content || "");
      setCoverImageUrl(p.cover_image_url || "");
      setCategory(p.category);
      setProductId(p.product_id);
    }
    if (productsRes.data) {
      setProducts(productsRes.data);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Judul harus diisi");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("market_outlooks")
      .update({
        title: title.trim(),
        slug: slug.trim(),
        content: content,
        cover_image_url: coverImageUrl.trim() || null,
        category,
        product_id: productId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Post berhasil disimpan");
      fetchPost();
    }
    setSaving(false);
  }

  async function handleTogglePublish() {
    if (!post) return;
    setPublishing(true);
    const supabase = createClient();
    const updateData: Record<string, any> = {
      is_published: !post.is_published,
      updated_at: new Date().toISOString(),
    };
    if (!post.is_published) {
      updateData.published_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("market_outlooks")
      .update(updateData)
      .eq("id", postId);

    if (error) {
      toast.error("Gagal mengubah status publish");
    } else {
      toast.success(post.is_published ? "Post di-unpublish" : "Post dipublish");
      fetchPost();
    }
    setPublishing(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8B949E]">Post tidak ditemukan.</p>
        <Link href="/admin/market-outlook">
          <Button variant="secondary" className="mt-4">
            Kembali
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/market-outlook">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F0F5]">Edit Post</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[#8B949E] text-sm">{post.title}</p>
              <Badge variant={post.is_published ? "lime" : "gray"}>
                {post.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTogglePublish}
            loading={publishing}
          >
            {post.is_published ? (
              <>
                <EyeOff size={14} className="mr-1" /> Unpublish
              </>
            ) : (
              <>
                <Eye size={14} className="mr-1" /> Publish
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" /> Simpan
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardTitle className="mb-4">Detail Post</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#F0F0F5]">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OutlookCategory)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="special">Special</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#F0F0F5]">
              Produk
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              label="Cover Image URL"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card>
        <CardTitle className="mb-4">Konten</CardTitle>
        <div className="space-y-1.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Tulis konten outlook di sini... (Markdown/HTML support akan ditambahkan nanti)"
            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#222229] text-[#F0F0F5] text-sm font-mono leading-relaxed placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-y"
          />
          <p className="text-xs text-[#8B949E]">
            Tip: Gunakan textarea ini untuk menulis konten. Rich text editor akan ditambahkan di update berikutnya.
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" /> Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
