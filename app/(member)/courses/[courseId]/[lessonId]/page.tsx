"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDuration } from "@/lib/utils";
import type { Lesson, LessonProgress, Course } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const { user } = useUser();
  const { activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progressRecord, setProgressRecord] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { hasAccess } = useAccessControl(activeSubscription, course?.product_id);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();

      // Fetch course
      const { data: courseData } = await supabase
        .from("courses")
        .select("*, product:products(*)")
        .eq("id", courseId)
        .single();

      if (!courseData) {
        setError("Kursus tidak ditemukan.");
        setLoading(false);
        return;
      }
      setCourse(courseData as Course);

      // Fetch all lessons for navigation
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      const lessons = (lessonsData ?? []) as Lesson[];
      setAllLessons(lessons);

      const current = lessons.find((l) => l.id === lessonId);
      if (!current) {
        setError("Pelajaran tidak ditemukan.");
        setLoading(false);
        return;
      }
      setLesson(current);

      // Fetch progress
      if (user) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .single();

        if (progressData) {
          setProgressRecord(progressData as LessonProgress);
        }
      }

      setLoading(false);
    }

    if (courseId && lessonId) fetch();
  }, [courseId, lessonId, user]);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleMarkComplete = useCallback(async () => {
    if (!user || !lesson) return;
    setCompleting(true);
    const supabase = createClient();

    const newCompleted = !progressRecord?.completed;

    const { error: err } = await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        completed: newCompleted,
        last_position_seconds: 0,
        completed_at: newCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (err) {
      toast.error("Gagal mengupdate progres.");
    } else {
      setProgressRecord((prev) =>
        prev
          ? { ...prev, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : ({
              id: "",
              user_id: user.id,
              lesson_id: lesson.id,
              completed: newCompleted,
              last_position_seconds: 0,
              completed_at: newCompleted ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            } as LessonProgress)
      );
      toast.success(newCompleted ? "Ditandai selesai!" : "Ditandai belum selesai.");
    }
    setCompleting(false);
  }, [user, lesson, progressRecord]);

  if (loading || subLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error || !lesson || !course) {
    return (
      <div className="max-w-4xl">
        <Card className="text-center py-12">
          <p className="text-red-400">{error ?? "Terjadi kesalahan."}</p>
          <Link href={`/courses/${courseId}`} className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl">
        <Card className="text-center py-12 border-amber-500/20 bg-amber-500/5">
          <Lock size={32} className="mx-auto text-amber-400 mb-3" />
          <p className="font-semibold text-amber-400 mb-1">Akses Terkunci</p>
          <p className="text-sm text-[#8B949E] mb-4">
            Kamu perlu berlangganan untuk mengakses pelajaran ini.
          </p>
          <Link href="/billing">
            <Button size="sm">Pilih Paket</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
      >
        <ArrowLeft size={16} />
        {course.title}
      </Link>

      {/* Video */}
      <div className="aspect-video rounded-2xl overflow-hidden bg-[#131318] border border-[#222229]">
        {lesson.video_url ? (
          <iframe
            src={lesson.video_url}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E] gap-2">
            <PlayCircle size={48} className="text-[#222229]" />
            <p className="text-sm">Video belum tersedia</p>
          </div>
        )}
      </div>

      {/* Title & complete */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-[#8B949E] uppercase tracking-wide">
            Pelajaran {currentIndex + 1} dari {allLessons.length}
          </p>
          <h1 className="text-xl font-bold text-[#F0F0F5]">{lesson.title}</h1>
          {lesson.duration_seconds && (
            <p className="text-xs text-[#8B949E]">
              Durasi: {formatDuration(lesson.duration_seconds)}
            </p>
          )}
        </div>
        <Button
          variant={progressRecord?.completed ? "secondary" : "primary"}
          size="sm"
          loading={completing}
          onClick={handleMarkComplete}
          className="shrink-0"
        >
          {progressRecord?.completed ? (
            <>
              <CheckCircle2 size={16} className="mr-1.5" />
              Selesai
            </>
          ) : (
            <>
              <Circle size={16} className="mr-1.5" />
              Tandai Selesai
            </>
          )}
        </Button>
      </div>

      {/* Description */}
      {lesson.description && (
        <Card>
          <p className="text-sm text-[#8B949E] leading-relaxed whitespace-pre-wrap">
            {lesson.description}
          </p>
        </Card>
      )}

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {prevLesson ? (
          <Link href={`/courses/${courseId}/${prevLesson.id}`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Sebelumnya
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link href={`/courses/${courseId}/${nextLesson.id}`}>
            <Button variant="secondary" size="sm">
              Selanjutnya
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
