"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import type { Course, Lesson, Product } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Course form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // New lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  // Editing lesson
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");

  const fetchCourse = useCallback(async () => {
    const supabase = createClient();
    const [courseRes, lessonsRes, productsRes] = await Promise.all([
      supabase.from("courses").select("*, product:products(*)").eq("id", courseId).single(),
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true }),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

    if (courseRes.data) {
      const c = courseRes.data as Course;
      setCourse(c);
      setTitle(c.title);
      setSlug(c.slug);
      setDescription(c.description || "");
      setProductId(c.product_id);
      setThumbnailUrl(c.thumbnail_url || "");
    }
    if (lessonsRes.data) {
      setLessons(lessonsRes.data as Lesson[]);
    }
    if (productsRes.data) {
      setProducts(productsRes.data);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  async function handleSaveCourse() {
    if (!title.trim()) {
      toast.error("Judul harus diisi");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        product_id: productId,
        thumbnail_url: thumbnailUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Kursus berhasil disimpan");
    }
    setSaving(false);
  }

  async function handleDeleteCourse() {
    if (!confirm("Yakin ingin menghapus kursus ini? Semua lesson akan ikut terhapus.")) return;
    setDeleting(true);
    const supabase = createClient();

    // Delete lessons first
    await supabase.from("lessons").delete().eq("course_id", courseId);
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      toast.error("Gagal menghapus: " + error.message);
      setDeleting(false);
    } else {
      toast.success("Kursus berhasil dihapus");
      router.push("/admin/courses");
    }
  }

  async function handleAddLesson() {
    if (!lessonTitle.trim()) {
      toast.error("Judul lesson harus diisi");
      return;
    }
    setSavingLesson(true);
    const supabase = createClient();

    const lessonSlug = lessonTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("lessons").insert({
      course_id: courseId,
      title: lessonTitle.trim(),
      slug: lessonSlug,
      video_url: lessonVideoUrl.trim() || null,
      duration_seconds: lessonDuration ? parseInt(lessonDuration) : null,
      sort_order: lessons.length,
      is_published: false,
    });

    if (error) {
      toast.error("Gagal menambah lesson: " + error.message);
    } else {
      toast.success("Lesson berhasil ditambahkan");
      setLessonTitle("");
      setLessonVideoUrl("");
      setLessonDuration("");
      setShowLessonForm(false);
      fetchCourse();
    }
    setSavingLesson(false);
  }

  async function handleUpdateLesson(lessonId: string) {
    if (!editLessonTitle.trim()) {
      toast.error("Judul lesson harus diisi");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("lessons")
      .update({
        title: editLessonTitle.trim(),
        video_url: editLessonVideoUrl.trim() || null,
        duration_seconds: editLessonDuration ? parseInt(editLessonDuration) : null,
      })
      .eq("id", lessonId);

    if (error) {
      toast.error("Gagal mengupdate lesson");
    } else {
      toast.success("Lesson berhasil diupdate");
      setEditingLessonId(null);
      fetchCourse();
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Yakin ingin menghapus lesson ini?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

    if (error) {
      toast.error("Gagal menghapus lesson");
    } else {
      toast.success("Lesson berhasil dihapus");
      fetchCourse();
    }
  }

  async function toggleLessonPublished(lesson: Lesson) {
    const supabase = createClient();
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !lesson.is_published })
      .eq("id", lesson.id);

    if (error) {
      toast.error("Gagal mengubah status lesson");
    } else {
      fetchCourse();
    }
  }

  async function reorderLesson(lessonId: string, direction: "up" | "down") {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;

    const supabase = createClient();
    await Promise.all([
      supabase.from("lessons").update({ sort_order: swapIdx }).eq("id", lessons[idx].id),
      supabase.from("lessons").update({ sort_order: idx }).eq("id", lessons[swapIdx].id),
    ]);
    fetchCourse();
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonVideoUrl(lesson.video_url || "");
    setEditLessonDuration(lesson.duration_seconds?.toString() || "");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8B949E]">Kursus tidak ditemukan.</p>
        <Link href="/admin/courses">
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
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F0F5]">Edit Kursus</h1>
            <p className="text-[#8B949E] text-sm mt-0.5">{course.title}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleDeleteCourse} loading={deleting}>
          <Trash2 size={14} className="mr-1" /> Hapus Kursus
        </Button>
      </div>

      {/* Course Details Form */}
      <Card>
        <CardTitle className="mb-4">Detail Kursus</CardTitle>
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
            <label className="block text-sm font-medium text-[#F0F0F5]">Produk</label>
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
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
          />
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-[#F0F0F5]">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveCourse} loading={saving}>
            <Save size={14} className="mr-1" /> Simpan Perubahan
          </Button>
        </div>
      </Card>

      {/* Lessons */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Lessons ({lessons.length})</CardTitle>
          <Button
            size="sm"
            variant={showLessonForm ? "ghost" : "primary"}
            onClick={() => setShowLessonForm(!showLessonForm)}
          >
            {showLessonForm ? (
              <>
                <X size={14} className="mr-1" /> Batal
              </>
            ) : (
              <>
                <Plus size={14} className="mr-1" /> Tambah Lesson
              </>
            )}
          </Button>
        </div>

        {/* Add Lesson Form */}
        {showLessonForm && (
          <div className="mb-6 p-4 rounded-xl border border-[#222229] bg-[#0A0A0F] space-y-3">
            <Input
              label="Judul Lesson"
              placeholder="Masukkan judul lesson"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Video URL"
                placeholder="https://..."
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
              />
              <Input
                label="Durasi (detik)"
                type="number"
                placeholder="600"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddLesson} loading={savingLesson}>
                Tambah Lesson
              </Button>
            </div>
          </div>
        )}

        {/* Lesson List */}
        {lessons.length === 0 ? (
          <p className="text-[#8B949E] text-sm text-center py-8">
            Belum ada lesson. Tambahkan lesson pertama.
          </p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-[#222229] bg-[#0A0A0F] hover:border-[#222229]/80"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => reorderLesson(lesson.id, "up")}
                    disabled={idx === 0}
                    className="text-[#8B949E] hover:text-[#F0F0F5] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => reorderLesson(lesson.id, "down")}
                    disabled={idx === lessons.length - 1}
                    className="text-[#8B949E] hover:text-[#F0F0F5] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingLessonId === lesson.id ? (
                    <div className="space-y-3">
                      <Input
                        label="Judul"
                        value={editLessonTitle}
                        onChange={(e) => setEditLessonTitle(e.target.value)}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Video URL"
                          value={editLessonVideoUrl}
                          onChange={(e) => setEditLessonVideoUrl(e.target.value)}
                        />
                        <Input
                          label="Durasi (detik)"
                          type="number"
                          value={editLessonDuration}
                          onChange={(e) => setEditLessonDuration(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateLesson(lesson.id)}>
                          Simpan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingLessonId(null)}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#8B949E] font-mono">
                            #{idx + 1}
                          </span>
                          <span className="text-sm text-[#F0F0F5] font-medium">
                            {lesson.title}
                          </span>
                          <Badge variant={lesson.is_published ? "lime" : "gray"}>
                            {lesson.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        {lesson.video_url && (
                          <p className="text-xs text-[#8B949E] mt-1 truncate max-w-md">
                            {lesson.video_url}
                          </p>
                        )}
                        {lesson.duration_seconds && (
                          <p className="text-xs text-[#8B949E]">
                            Durasi: {Math.floor(lesson.duration_seconds / 60)}m{" "}
                            {lesson.duration_seconds % 60}s
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleLessonPublished(lesson)}
                          className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]/50"
                          title={lesson.is_published ? "Unpublish" : "Publish"}
                        >
                          {lesson.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => startEditLesson(lesson)}
                          className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#222229]/50"
                        >
                          <GripVertical size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 rounded-lg text-[#8B949E] hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
