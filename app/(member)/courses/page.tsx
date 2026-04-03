"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES, PRODUCT_COLORS } from "@/lib/constants";
import type { Course, ProductSlug } from "@/lib/types";
import { BookOpen, Lock, PlayCircle } from "lucide-react";

type FilterValue = "all" | ProductSlug;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Semua", value: "all" },
  { label: "Forex", value: "forex" },
  { label: "Crypto", value: "crypto" },
];

function CourseCard({
  course,
  hasAccess,
}: {
  course: Course;
  hasAccess: boolean;
}) {
  const productSlug = course.product?.slug ?? "forex";
  const color = PRODUCT_COLORS[productSlug] ?? "#96FC03";

  return (
    <Link href={`/courses/${course.id}`}>
      <Card hover className="h-full overflow-hidden p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen size={40} className="text-[#222229]" />
          )}
          {!hasAccess && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Lock size={28} className="text-[#8B949E]" />
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px]"
              style={{
                background: `${color}15`,
                color,
                borderColor: `${color}40`,
              } as React.CSSProperties}
            >
              {PRODUCT_NAMES[productSlug] ?? productSlug}
            </Badge>
          </div>

          <h3 className="text-[#F0F0F5] font-semibold leading-snug line-clamp-2">
            {course.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <PlayCircle size={14} />
            <span>{course.lesson_count ?? 0} pelajaran</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function CoursesPage() {
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("courses")
        .select("*, product:products(*), lessons(id)")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (err) {
        setError("Gagal memuat kursus.");
        setLoading(false);
        return;
      }

      const withCount = (data ?? []).map((c: any) => ({
        ...c,
        lesson_count: c.lessons?.length ?? 0,
        lessons: undefined,
      })) as Course[];

      setCourses(withCount);
      setLoading(false);
    }

    fetchCourses();
  }, []);

  const filtered =
    filter === "all"
      ? courses
      : courses.filter((c) => c.product?.slug === filter);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Kursus</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Pelajari trading dari materi yang sudah terstruktur.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "primary" : "secondary"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading || subLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada kursus tersedia.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const { hasAccess } = useAccessControl(
              activeSubscription,
              course.product_id
            );
            return (
              <CourseCard
                key={course.id}
                course={course}
                hasAccess={hasAccess}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
