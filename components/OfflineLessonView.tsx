"use client";
import React, { useEffect, useState } from "react";
import { getLesson } from "@/lib/offlineStorage";
import { useLang } from "@/components/LanguageProvider";
import { updateProgress } from "@/lib/gamification"; // ✅ new import

export default function OfflineLessonView({ lessonId }: { lessonId: string }) {
  const { lang } = useLang();
  const [lesson, setLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // First try IndexedDB/localStorage
        const cached = await getLesson(lessonId);
        if (cached && mounted) {
          setLesson(cached);
          setLoading(false);
          return;
        }

        // Fallback: fetch from /public (served by SW if offline)
        const res = await fetch(`/offline-content/lessons/${lessonId}.json`);
        if (res.ok) {
          const json = await res.json();
          if (mounted) setLesson(json);
        }
      } catch (err) {
        console.warn("Could not load lesson", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  if (loading) return <div>Loading lesson…</div>;
  if (!lesson) return <div>Lesson not available.</div>;

  // Pick correct language (fallback to English if missing)
  const title = lesson.title?.[lang] ?? lesson.title?.en ?? "Untitled Lesson";
  const blocks = lesson.content?.[lang] ?? lesson.content?.en ?? [];

  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      <div className="space-y-4">
        {blocks.map((b: any, i: number) => {
          if (b.type === "text") return <p key={i}>{b.value}</p>;

          if (b.type === "quiz") {
            return (
              <div key={i} className="p-3 border rounded">
                <div className="font-semibold">{b.question}</div>
                <ul className="mt-2 space-y-1">
                  {b.options?.map((opt: string, idx: number) => (
                    <li key={idx}>
                      <button
                        className="px-3 py-1 border rounded hover:bg-gray-800"
                        onClick={async () => {
                          if (idx === b.answer) {
                            await updateProgress(10); // ✅ award 10 XP
                            alert("✅ Correct! (+10 XP)");
                          } else {
                            alert("❌ Try again");
                          }
                        }}
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          // fallback: debug render unknown block type
          return <pre key={i}>{JSON.stringify(b, null, 2)}</pre>;
        })}
      </div>
    </article>
  );
}
