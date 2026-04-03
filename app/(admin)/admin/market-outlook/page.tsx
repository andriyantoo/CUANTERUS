"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  BarChart3,
  Eye,
  EyeOff,
  Pencil,
  X,
} from "lucide-react";
import type { MarketOutlook, Product, OutlookCategory } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  special: "Special",
};

const CATEGORY_BADGE: Record<string, "lime" | "blue" | "amber"> = {
  daily: "lime",
  weekly: "blue",
  special: "amber",
};

export default function AdminMarketOutlookPage() {
  const [posts, setPosts] = useState<MarketOutlook[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New post form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<OutlookCategory>("daily");
  const [productId, setProductId] = useState("");

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const [postsRes, productsRes] = await Promise.all([
      supabase
        .from("market_outlooks")
        .select("*, product:products(*)")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (postsRes.data) {
      setPosts(postsRes.data as MarketOutlook[]);
    }
    if (productsRes.data) {
      setProducts(productsRes.data);
      if (!productId && productsRes.data.length > 0) {
        setProductId(productsRes.data[0].id);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleCreate() {
    if (!title.trim() || !productId) {
      toast.error("Judul dan produk harus diisi");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("market_outlooks")
      .insert({
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        content: "",
        category,
        product_id: productId,
        is_published: false,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Gagal membuat post: " + error.message);
      setSaving(false);
    } else {
      toast.success("Post berhasil dibuat");
      setTitle("");
      setSlug("");
      setShowForm(false);
      // Navigate to edit page
      if (data) {
        window.location.href = `/admin/market-outlook/${data.id}`;
      } else {
        fetchPosts();
      }
      setSaving(false);
    }
  }

  async function togglePublished(post: MarketOutlook) {
    setTogglingId(post.id);
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
      .eq("id", post.id);

    if (error) {
      toast.error("Gagal mengubah status publish");
    } else {
      fetchPosts();
    }
    setTogglingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Market Outlook</h1>
          <p className="text-[#8B949E] text-sm mt-1">
            Kelola konten analisa dan outlook pasar
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? (
            <>
              <X size={14} className="mr-1" /> Batal
            </>
          ) : (
            <>
              <Plus size={14} className="mr-1" /> Buat Post
            </>
          )}
        </Button>
      </div>

      {/* Create Post Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-[#F0F0F5] mb-4">Post Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Judul"
              placeholder="Masukkan judul post"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(generateSlug(e.target.value));
              }}
            />
            <Input
              label="Slug"
              placeholder="judul-post"
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
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreate} loading={saving}>
              Buat & Edit Post
            </Button>
          </div>
        </Card>
      )}

      {/* Post List */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Judul
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Kategori
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Produk
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Dibuat
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#222229]/50">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                    </tr>
                  ))
                : posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-[#222229]/50 hover:bg-[#131318]/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <BarChart3 size={14} className="text-blue-400" />
                          </div>
                          <span className="text-[#F0F0F5] font-medium">
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={CATEGORY_BADGE[post.category] || "gray"}>
                          {CATEGORY_LABELS[post.category] || post.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="blue">
                          {post.product?.name ||
                            PRODUCT_NAMES[post.product_id] ||
                            post.product_id}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={post.is_published ? "lime" : "gray"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8B949E]">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublished(post)}
                            loading={togglingId === post.id}
                            title={post.is_published ? "Unpublish" : "Publish"}
                          >
                            {post.is_published ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                          <Link href={`/admin/market-outlook/${post.id}`}>
                            <Button size="sm" variant="secondary">
                              <Pencil size={14} className="mr-1" /> Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && posts.length === 0 && (
            <div className="text-center py-12 text-[#8B949E]">
              Belum ada post outlook. Klik &quot;Buat Post&quot; untuk memulai.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
