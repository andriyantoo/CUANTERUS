"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { formatDuration } from "@/lib/utils";
import type { Course, Lesson, LessonProgress } from "@/lib/types";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
} from "lucide-react";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hasAccess } = useAccessControl(activeSubscription, course?.product_id);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();

      const { data: courseData, error: courseErr } = await supabase
        .from("courses")
        .select("*, product:products(*)")
        .eq("id", courseId)
        .single();

      if (courseErr || !courseData) {
        setError("Kursus tidak ditemukan.");
        setLoading(false);
        return;
      }

      setCourse(courseData as Course);

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      setLessons((lessonData ?? []) as Lesson[]);

      // Fetch progress
      if (user) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .in(
            "lesson_id",
            (lessonData ?? []).map((l: any) => l.id)
          );

        const progressMap: Record<string, LessonProgress> = {};
        (progressData ?? []).forEach((p: any) => {
          progressMap[p.lesson_id] = p;
        });
        setProgress(progressMap);
      }

      setLoading(false);
    }

    if (courseId) fetch();
  }, [courseId, user]);

  const completedCount = lessons.filter(
    (l) => progress[l.id]?.completed
  ).length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const productSlug = course?.product?.slug ?? "forex";
  const color = PRODUCT_COLORS[productSlug] ?? "#96FC03";

  if (loading || subLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-3 w-full" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl">
        <Card className="text-center py-12">
          <p className="text-red-400">{error ?? "Terjadi kesalahan."}</p>
          <Link href="/courses" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke Kursus
      </Link>

      {/* Header */}
      <div className="space-y-3">
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
        <h1 className="text-2xl font-bold text-[#F0F0F5]">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-[#8B949E] leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {hasAccess && totalCount > 0 && (
        <Card className="!p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#8B949E]">Progres Kursus</span>
            <span className="text-[#F0F0F5] font-semibold">
              {completedCount}/{totalCount} selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#222229] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#96FC03] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>
      )}

      {/* Access gate */}
      {!hasAccess && (
        <Card className="border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">Akses Terkunci</p>
              <p className="text-sm text-[#8B949E]">
                Kamu perlu berlangganan untuk mengakses kursus ini.
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button size="sm">Pilih Paket</Button>
          </Link>
        </Card>
      )}

      {/* Lesson list */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[#F0F0F5] mb-3">
          Daftar Pelajaran
        </h2>
        {lessons.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[#8B949E]">Belum ada pelajaran.</p>
          </Card>
        ) : (
          lessons.map((lesson, idx) => {
            const isCompleted = progress[lesson.id]?.completed;
            return (
              <Link
                key={lesson.id}
                href={
                  hasAccess
                    ? `/courses/${courseId}/${lesson.id}`
                    : "#"
                }
                className={!hasAccess ? "pointer-events-none" : ""}
              >
                <Card
                  hover={hasAccess}
                  className="!p-4 flex items-center gap-4"
                >
                  {/* Number / Check */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2
                        size={22}
                        className="text-[#96FC03]"
                      />
                    ) : (
                      <Circle size={22} className="text-[#222229]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F0F0F5] truncate">
                      {idx + 1}. {lesson.title}
                    </p>
                    {lesson.duration_seconds && (
                      <p className="text-xs text-[#8B949E] mt-0.5">
                        {formatDuration(lesson.duration_seconds)}
                      </p>
                    )}
                  </div>

                  {/* Icon */}
                  {hasAccess ? (
                    <PlayCircle
                      size={18}
                      className="shrink-0 text-[#8B949E]"
                    />
                  ) : (
                    <Lock size={16} className="shrink-0 text-[#8B949E]/50" />
                  )}
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
