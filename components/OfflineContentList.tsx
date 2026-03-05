// components/OfflineContentList.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getIndex, setIndex, setLesson, getLesson } from "@/lib/offlineStorage";
import { useLang } from "@/components/LanguageProvider"; 

type LessonMeta = {
  id: string;
  title: { [lang: string]: string };
  grade: string;
  path: string;
  thumbnail?: string;
  sizeKb?: number;
};

type Status = "idle" | "downloading" | "done" | "failed";

export default function OfflineContentList() {
  const { lang } = useLang(); // 👈 get language globally
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStatus, setGlobalStatus] = useState<Status>("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [perLessonStatus, setPerLessonStatus] = useState<Record<string, Status>>({});
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      // Try cached index first (IndexedDB or localStorage)
      const cached = await getIndex();
      if (cached?.lessons && mounted) {
        setLessons(cached.lessons);
      }

      // Fetch latest index (SW will serve cached if offline)
      try {
        const res = await fetch("/offline-content/index.json", { cache: "no-cache" });
        if (res.ok) {
          const json = await res.json();
          await setIndex(json);
          if (mounted) setLessons(json.lessons);
        }
      } catch {
        console.warn("Offline? Using cached lessons.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // safe init per-lesson status
  useEffect(() => {
    const map: Record<string, Status> = {};
    lessons.forEach((l) => {
      map[l.id] = perLessonStatus[l.id] ?? "idle";
    });
    if (Object.keys(map).length) setPerLessonStatus((s) => ({ ...map, ...s }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons]);

  async function downloadLesson(l: LessonMeta) {
    setPerLessonStatus((s) => ({ ...s, [l.id]: "downloading" }));
    try {
      const res = await fetch(l.path);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const lessonJson = await res.json();
      await setLesson(l.id, lessonJson);
      setPerLessonStatus((s) => ({ ...s, [l.id]: "done" }));
      return true;
    } catch (err) {
      console.error("download error", err);
      setPerLessonStatus((s) => ({ ...s, [l.id]: "failed" }));
      return false;
    }
  }

  // Download All with progress tracking
  async function downloadAll() {
    if (!lessons.length) return;
    // compute total size KB (fallback to 0)
    const total = lessons.reduce((sum, l) => sum + (l.sizeKb ?? 0), 0) || lessons.length;
    setGlobalStatus("downloading");
    setProgressPercent(0);
    setCurrentIndex(0);

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      setCurrentIndex(i);
      // skip if already downloaded (quick check in IDB)
      try {
        const cached = await getLesson(l.id);
        if (cached) {
          setPerLessonStatus((s) => ({ ...s, [l.id]: "done" }));
          // update progress (use sizeKb if available)
          const doneSoFar = lessons.slice(0, i + 1).reduce((sum, x) => sum + (x.sizeKb ?? 0), 0);
          const percent = total ? Math.min(100, Math.round((doneSoFar / total) * 100)) : Math.round(((i + 1) / lessons.length) * 100);
          setProgressPercent(percent);
          continue;
        }
      } catch {
        // ignore; continue to download
      }

      // perform download
      setPerLessonStatus((s) => ({ ...s, [l.id]: "downloading" }));
      const ok = await downloadLesson(l);
      // update progress
      const doneSoFar = lessons.slice(0, i + 1).reduce((sum, x) => sum + (x.sizeKb ?? 0), 0);
      const percent = total ? Math.min(100, Math.round((doneSoFar / total) * 100)) : Math.round(((i + 1) / lessons.length) * 100);
      setProgressPercent(percent);

      // if a download failed, keep going but mark global as failed at the end
      // (we don't abort whole pack for spotty connections)
      if (!ok) {
        // continue
      }
    }

    // finalize
    setGlobalStatus(Object.values(perLessonStatus).includes("failed") ? "failed" : "done");
    setCurrentIndex(null);
    // ensure percent reaches 100
    setProgressPercent(100);
    // refresh index from storage in case some lessons were newly added
    try {
      const idx = await getIndex();
      if (idx?.lessons) setLessons(idx.lessons);
    } catch {}
    setTimeout(() => setGlobalStatus("idle"), 1200);
  }

  // Utility small UI helpers
  function statusLabel(s: Status) {
    if (s === "idle") return "Idle";
    if (s === "downloading") return "Downloading…";
    if (s === "done") return "Downloaded";
    return "Failed";
  }

  if (loading && lessons.length === 0) return <div>Loading lessons…</div>;
  if (!lessons.length) return <div>No lessons available.</div>;

  const totalSize = lessons.reduce((sum, l) => sum + (l.sizeKb ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Offline STEAM Lessons</h2>
          <div className="text-sm text-gray-400">Total: {lessons.length} lessons • {totalSize} KB</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadAll}
            disabled={globalStatus === "downloading"}
            className="px-4 py-2 border rounded bg-gray-800 hover:bg-gray-700"
          >
            {globalStatus === "downloading" ? `Downloading… ${progressPercent}%` : `Download All (${totalSize} KB)`}
          </button>
        </div>
      </div>

      {/* progress bar */}
      {globalStatus === "downloading" && (
        <div className="mb-3">
          <div className="w-full bg-gray-800 h-3 rounded overflow-hidden">
            <div
              className="h-3 rounded"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg,#f59e0b,#f97316)"
              }}
            />
          </div>
          <div className="text-sm text-gray-300 mt-1">Progress: {progressPercent}%</div>
        </div>
      )}

      <ul className="space-y-3">
        {lessons.map((l, idx) => {
          const s = perLessonStatus[l.id] ?? "idle";
          const isCurrent = currentIndex === idx;
          return (
            <li key={l.id} className="p-3 rounded-md bg-gray-900/60 flex items-center gap-4">
              {l.thumbnail && (
                <img src={l.thumbnail} width={64} height={64} alt="" className="object-contain" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{l.title[lang] ?? l.title["en"]}</div>
                    <div className="text-sm text-gray-400">Grade {l.grade} • {l.sizeKb ?? "?"} KB</div>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${s === "done" ? "bg-green-700 text-white" : s === "failed" ? "bg-red-700 text-white" : isCurrent ? "bg-yellow-700 text-black" : "bg-gray-800 text-gray-200"}`}>
                      {isCurrent ? "In queue" : statusLabel(s)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <Link href={`/offline/lesson/${l.id}`} className="px-3 py-1 text-sm border rounded hover:bg-gray-800">Open</Link>
                  <button
                    onClick={() => downloadLesson(l)}
                    disabled={s === "downloading" || globalStatus === "downloading"}
                    className="px-3 py-1 text-sm border rounded"
                  >
                    {s === "downloading" ? "Downloading…" : s === "done" ? "Re-download" : "Download"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
