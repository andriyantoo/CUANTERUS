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
  BookOpen,
  Eye,
  EyeOff,
  Pencil,
  X,
} from "lucide-react";
import type { Course, Product } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New course form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const fetchCourses = useCallback(async () => {
    const supabase = createClient();
    const [coursesRes, productsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*, product:products(*), lessons(id)")
        .order("sort_order", { ascending: true }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (coursesRes.data) {
      const mapped = coursesRes.data.map((c: any) => ({
        ...c,
        lesson_count: c.lessons?.length || 0,
        lessons: undefined,
      }));
      setCourses(mapped);
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
    fetchCourses();
  }, [fetchCourses]);

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
    const { error } = await supabase.from("courses").insert({
      title: title.trim(),
      slug: slug.trim() || generateSlug(title),
      description: description.trim() || null,
      product_id: productId,
      thumbnail_url: thumbnailUrl.trim() || null,
      sort_order: courses.length,
      is_published: false,
    });

    if (error) {
      toast.error("Gagal membuat kursus: " + error.message);
    } else {
      toast.success("Kursus berhasil dibuat");
      setTitle("");
      setSlug("");
      setDescription("");
      setThumbnailUrl("");
      setShowForm(false);
      fetchCourses();
    }
    setSaving(false);
  }

  async function togglePublished(course: Course) {
    setTogglingId(course.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !course.is_published })
      .eq("id", course.id);

    if (error) {
      toast.error("Gagal mengubah status");
    } else {
      toast.success(
        course.is_published ? "Kursus di-unpublish" : "Kursus dipublish"
      );
      fetchCourses();
    }
    setTogglingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Courses</h1>
          <p className="text-[#8B949E] text-sm mt-1">
            Kelola kursus dan materi pembelajaran
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? (
            <>
              <X size={14} className="mr-1" /> Batal
            </>
          ) : (
            <>
              <Plus size={14} className="mr-1" /> Buat Kursus
            </>
          )}
        </Button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-[#F0F0F5] mb-4">
            Kursus Baru
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Judul"
              placeholder="Masukkan judul kursus"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(generateSlug(e.target.value));
              }}
            />
            <Input
              label="Slug"
              placeholder="judul-kursus"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
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
            <Input
              label="Thumbnail URL"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-[#F0F0F5]">
                Deskripsi
              </label>
              <textarea
                placeholder="Deskripsi singkat kursus..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreate} loading={saving}>
              Simpan Kursus
            </Button>
          </div>
        </Card>
      )}

      {/* Course List */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Judul
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Produk
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Lessons
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
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12" />
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
                : courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-[#222229]/50 hover:bg-[#131318]/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#96FC03]/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={14} className="text-[#96FC03]" />
                          </div>
                          <span className="text-[#F0F0F5] font-medium">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="blue">
                          {course.product?.name ||
                            PRODUCT_NAMES[course.product_id] ||
                            course.product_id}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8B949E]">
                        {course.lesson_count || 0} lesson
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={course.is_published ? "lime" : "gray"}
                        >
                          {course.is_published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8B949E]">
                        {formatDate(course.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublished(course)}
                            loading={togglingId === course.id}
                            title={
                              course.is_published ? "Unpublish" : "Publish"
                            }
                          >
                            {course.is_published ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                          <Link href={`/admin/courses/${course.id}`}>
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
          {!loading && courses.length === 0 && (
            <div className="text-center py-12 text-[#8B949E]">
              Belum ada kursus. Klik &quot;Buat Kursus&quot; untuk memulai.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
