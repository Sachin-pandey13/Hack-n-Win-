// app/problems/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PROBLEMS, TAGS } from "@/lib/problem";
import type { Problem } from "@/types/problem";
import dynamic from "next/dynamic";

const Calendar = dynamic(() => import("react-calendar"), { ssr: false });
import "react-calendar/dist/Calendar.css";

/* ——— helpers ——— */

function DifficultyBadge({ value }: { value: Problem["difficulty"] }) {
  const cls =
    value === "Easy"
      ? "text-emerald-400"
      : value === "Medium"
      ? "text-amber-400"
      : "text-rose-400";

  return <span className={`font-medium ${cls}`}>{value}</span>;
}

function AcceptanceCell({ acceptance }: { acceptance: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(acceptance * 1000) / 10));

  return (
    <div>
      <div className="text-slate-200">{pct.toFixed(1)}%</div>
      <div className="mt-1 h-1.5 w-24 rounded bg-slate-800">
        <div
          className="h-1.5 rounded bg-slate-500/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ——— Page ——— */

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<
    "All" | "Easy" | "Medium" | "Hard"
  >("All");

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const [platform, setPlatform] = useState<
    "All" | "LeetCode" | "HackerRank" | "CodeChef" | "CodingNinjas"
  >("All");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const clearTags = () => setSelectedTags(new Set());

  const filtered = useMemo(() => {
    return PROBLEMS.filter((p) => {
      const q = search.trim().toLowerCase();

      const hitTitle = p.title.toLowerCase().includes(q);
      const hitNum = p.number.toString().includes(q);
      const hitText = !q || hitTitle || hitNum;

      const hitDiff = difficulty === "All" || p.difficulty === difficulty;

      const tagArray = Array.from(selectedTags);
      const hitTag =
        tagArray.length === 0 || tagArray.some((t) => p.tags.includes(t));

      const hitPlatform = platform === "All" || p.platform === platform;

      return hitText && hitDiff && hitTag && hitPlatform;
    }).sort((a, b) => a.number - b.number);
  }, [search, difficulty, selectedTags, platform]);

  const solvedDates = ["2025-08-15", "2025-08-17"];
  const visitedDates = ["2025-08-14", "2025-08-16"];

  return (
    <div className="fixed inset-0 flex bg-slate-950 text-slate-200">

      {/* LEFT PANEL */}

      <aside className="w-72 shrink-0 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-md shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Library</h2>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* platform */}

          <div className="mt-6">
            <div className="text-sm text-slate-400 mb-2">Platform</div>

            <div className="flex flex-wrap gap-2">
              {["All", "LeetCode", "HackerRank", "CodeChef", "CodingNinjas"].map(
                (pl) => (
                  <button
                    key={pl}
                    onClick={() => setPlatform(pl as any)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      platform === pl
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {pl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* difficulty */}

          <div className="mt-6">
            <div className="text-sm text-slate-400">Difficulty</div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    difficulty === d
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* tags */}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Tags</div>

              {selectedTags.size > 0 && (
                <button
                  onClick={clearTags}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const active = selectedTags.has(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs transition ring-1 ${
                      active
                        ? "bg-indigo-600 text-white ring-indigo-400 shadow"
                        : "bg-slate-800 text-slate-300 ring-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}

      <main className="flex-1 grid grid-cols-[2fr_1fr] overflow-auto">

        {/* Problems */}

        <div className="h-full w-full border-l border-slate-800/80 bg-slate-900/40 backdrop-blur-md">

          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/70">
            <h2 className="text-lg font-semibold">Problems</h2>

            <div className="text-sm text-slate-400">
              Showing {filtered.length} problems
            </div>
          </div>

          <ul className="divide-y divide-slate-800/70 text-sm">

            {filtered.map((p, index) => (

              <li
                key={`${p.id}-${p.number}-${p.platform}-${index}`}
                className="grid grid-cols-[76px_1fr_160px_140px] items-center px-3 py-3 cursor-pointer transform transition duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-slate-800/60 rounded-lg"
              >

                <div className="px-2 text-slate-400">
                  {p.number}
                </div>

                <div className="px-2">
                  <Link
                    href={`/problems/${p.category.toLowerCase()}/${p.id}`}
                    className="text-slate-200 hover:text-indigo-400"
                  >
                    {p.title}
                  </Link>
                </div>

                <div className="px-2">
                  <AcceptanceCell acceptance={p.acceptance} />
                </div>

                <div className="px-2">
                  <DifficultyBadge value={p.difficulty} />
                </div>

              </li>

            ))}

          </ul>
        </div>

        {/* Calendar */}

        <div className="border-l border-slate-800/80 bg-slate-900/50 p-4">

          <h2 className="text-lg font-semibold mb-4">Attendance</h2>

          <Calendar
            tileClassName={({ date }) => {

              const d = date.toISOString().split("T")[0];

              if (solvedDates.includes(d))
                return "bg-emerald-600 text-white rounded-full";

              if (visitedDates.includes(d))
                return "bg-rose-600 text-white rounded-full";

              return "";

            }}
          />

          <div className="mt-4 text-xs text-slate-400 space-y-1">

            <div>
              <span className="inline-block w-3 h-3 bg-emerald-600 rounded-full mr-2"></span>
              Solved
            </div>

            <div>
              <span className="inline-block w-3 h-3 bg-rose-600 rounded-full mr-2"></span>
              Visited, not solved
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}