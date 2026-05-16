// app/problems/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PROBLEMS, TAGS } from "@/lib/problem";
import type { Problem } from "@/types/problem";

/* ─── Platform Config ─── */
const PLATFORMS = [
  { id: "All",         label: "All",          color: "#94a3b8", emoji: "🌐" },
  { id: "LeetCode",    label: "LeetCode",     color: "#ffa116", emoji: "💛" },
  { id: "HackerRank",  label: "HackerRank",   color: "#2ec866", emoji: "💚" },
  { id: "CodeChef",    label: "CodeChef",     color: "#825e36", emoji: "🍴" },
  { id: "CodingNinjas",label: "Ninja",        color: "#f05f40", emoji: "🥷" },
  { id: "GFG",         label: "GFG",          color: "#2f8d46", emoji: "🌿" },
];

/* ─── Difficulty Badge ─── */
function DiffBadge({ value }: { value: Problem["difficulty"] }) {
  const cfg = {
    Easy:   { cls: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/25", dot: "#10b981" },
    Medium: { cls: "text-amber-400  bg-amber-400/10  ring-amber-400/25",   dot: "#f59e0b" },
    Hard:   { cls: "text-rose-400   bg-rose-500/10   ring-rose-500/25",    dot: "#f43f5e" },
  }[value];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {value}
    </span>
  );
}

/* ─── Platform Logo ─── */
function PlatformDot({ id }: { id: string }) {
  const p = PLATFORMS.find(x => x.id === id) ?? PLATFORMS[0];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold"
          style={{ color: p.color }}>
      {p.emoji} {id === "CodingNinjas" ? "Ninja" : id}
    </span>
  );
}

/* ─── Activity Heatmap ─── */
const WEEK_COUNT = 26; // 26 weeks = ~6 months like GitHub / LeetCode

function buildHeatmapData(problems: Problem[], solvedIds: Set<string>) {
  // Generate last 26 weeks of dates
  const today = new Date();
  const weeks: { date: Date; count: number }[][] = [];

  for (let w = WEEK_COUNT - 1; w >= 0; w--) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      // Simulate: problems with solved IDs get count, others 0
      const dateStr = date.toISOString().split("T")[0];
      // Demo counts — in prod you'd look up by date
      const count = solvedIds.size > 0 ? Math.floor(Math.random() * 4) : 0;
      week.push({ date, count });
    }
    weeks.push(week);
  }
  return weeks;
}

function ActivityHeatmap({ solvedCount }: { solvedCount: number }) {
  const [hovered, setHovered] = useState<{ date: string; count: number } | null>(null);

  // Generate deterministic heatmap from today
  const weeks = useMemo(() => {
    const today = new Date();
    const result: { date: Date; count: number; dateStr: string }[][] = [];
    const flatCells: { date: Date; count: number; dateStr: string }[] = [];
    
    for (let w = WEEK_COUNT - 1; w >= 0; w--) {
      const week: { date: Date; count: number; dateStr: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));
        const cell = { 
          date, 
          count: 0, 
          dateStr: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
        };
        week.push(cell);
        flatCells.push(cell);
      }
      result.push(week);
    }
    
    // Distribute exactly `solvedCount` solves over the most recent days
    // instead of random fake data all over the board.
    if (solvedCount > 0) {
      let remaining = solvedCount;
      let currentIndex = flatCells.length - 1;
      
      while (remaining > 0 && currentIndex >= 0) {
        // Add 1 solve to the current day
        flatCells[currentIndex].count += 1;
        remaining--;
        
        // Move to previous day every so often, or keep adding to the same day (max 4 per day for color scale)
        if (flatCells[currentIndex].count >= 2 || Math.random() > 0.5) {
            currentIndex--;
        }
      }
    }
    return result;
  }, [solvedCount]);

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const cellColor = (count: number) =>
    count === 0 ? "#1e293b" :
    count === 1 ? "#166534" :
    count === 2 ? "#15803d" :
    count === 3 ? "#16a34a" :
                  "#22c55e";

  return (
    <div className="relative">
      {hovered && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 bg-slate-800 border border-slate-600 text-xs text-white px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
          <span className="font-semibold text-emerald-400">{hovered.count} problem{hovered.count !== 1 ? "s" : ""}</span>
          <span className="text-slate-400 ml-1">on {hovered.date}</span>
        </div>
      )}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 justify-between py-[1px]">
          {DAYS.map((d, i) => (
            <span key={d} className="text-[9px] text-slate-600 h-[10px] flex items-center leading-none"
                  style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}>
              {d}
            </span>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                className="w-[10px] h-[10px] rounded-sm cursor-pointer transition-transform hover:scale-125"
                style={{ background: cellColor(cell.count) }}
                onMouseEnter={() => setHovered({ date: cell.dateStr, count: cell.count })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[9px] text-slate-600">Less</span>
        {[0,1,2,3,4].map(n => (
          <div key={n} className="w-[10px] h-[10px] rounded-sm" style={{ background: cellColor(n) }} />
        ))}
        <span className="text-[9px] text-slate-600">More</span>
      </div>
    </div>
  );
}

/* ─── Stats Ring ─── */
function StatRing({ easy, medium, hard, total }: { easy: number; medium: number; hard: number; total: number }) {
  const solved = easy + medium + hard;
  const pct = total ? (solved / total) * 100 : 0;
  const r = 32; const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-white">{solved}</span>
          <span className="text-[9px] text-slate-500">/{total}</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Easy</span>
          <span className="ml-auto font-bold text-emerald-400">{easy}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">Medium</span>
          <span className="ml-auto font-bold text-amber-400">{medium}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-slate-400">Hard</span>
          <span className="ml-auto font-bold text-rose-400">{hard}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"All"|"Easy"|"Medium"|"Hard">("All");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState("All");
  const [solved, setSolved] = useState<Set<string>>(new Set(["two-sum", "contains-duplicate", "valid-anagram"]));
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });

  const filtered = useMemo(() => PROBLEMS.filter(p => {
    const q = search.trim().toLowerCase();
    const hitText = !q || p.title.toLowerCase().includes(q) || String(p.number).includes(q);
    const hitDiff = difficulty === "All" || p.difficulty === difficulty;
    const tags = Array.from(selectedTags);
    const hitTag = tags.length === 0 || tags.some(t => p.tags.includes(t));
    const hitPlatform = platform === "All" || (p as any).platform === platform;
    return hitText && hitDiff && hitTag && hitPlatform;
  }).sort((a, b) => (a.number ?? 0) - (b.number ?? 0)), [search, difficulty, selectedTags, platform]);

  const easyCount = useMemo(() => PROBLEMS.filter(p => p.difficulty === "Easy").length, []);
  const medCount  = useMemo(() => PROBLEMS.filter(p => p.difficulty === "Medium").length, []);
  const hardCount = useMemo(() => PROBLEMS.filter(p => p.difficulty === "Hard").length, []);

  const months = useMemo(() => {
    const today = new Date();
    const out: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      out.push(d.toLocaleString("default", { month: "short" }));
    }
    return out;
  }, []);

  return (
    <div className="fixed inset-0 flex bg-[#0d1117] text-slate-200 overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-[260px] shrink-0 flex flex-col border-r border-white/[0.06] bg-[#161b22]/80 backdrop-blur overflow-y-auto no-scrollbar">
        
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm outline-none focus:border-indigo-500/80 text-slate-200 placeholder:text-slate-600 transition"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mx-4 mb-4 p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Progress</div>
          <StatRing easy={solved.size} medium={0} hard={0} total={PROBLEMS.length} />
        </div>

        {/* Platform */}
        <div className="px-4 mb-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</div>
          <div className="flex flex-col gap-1">
            {PLATFORMS.map(pl => (
              <button key={pl.id} onClick={() => setPlatform(pl.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition text-left
                  ${platform === pl.id ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/40" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
                <span>{pl.emoji}</span>
                <span>{pl.label}</span>
                {platform === pl.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="px-4 mb-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Difficulty</div>
          <div className="flex gap-2">
            {(["All","Easy","Medium","Hard"] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition
                  ${difficulty === d
                    ? d === "Easy" ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                    : d === "Medium" ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                    : d === "Hard" ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"
                    : "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Topics</div>
            {selectedTags.size > 0 && (
              <button onClick={() => setSelectedTags(new Set())} className="text-[10px] text-indigo-400 hover:text-indigo-300">Clear</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(tag => {
              const active = selectedTags.has(tag);
              return (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition ring-1
                    ${active ? "bg-indigo-600/30 text-indigo-300 ring-indigo-500/50" : "text-slate-500 ring-white/10 hover:bg-white/5 hover:text-slate-300"}`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top strip */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#161b22]/60 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">Problems</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{filtered.length} shown</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{solved.size} solved</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-sm bg-emerald-600" /> Solved
              <span className="w-2 h-2 rounded-sm bg-[#1e293b] ml-2" /> Unsolved
            </div>
          </div>
        </div>

        {/* Two-column layout: table + right panel */}
        <div className="flex-1 flex min-h-0">

          {/* Problem Table */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Column headers */}
            <div className="sticky top-0 z-10 grid grid-cols-[44px_1fr_90px_110px_110px] px-6 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border-b border-white/[0.04] bg-[#0d1117]/95 backdrop-blur">
              <div>#</div>
              <div>Title</div>
              <div className="text-center">Difficulty</div>
              <div className="text-center">Acceptance</div>
              <div className="text-center">Platform</div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
                <div className="text-sm">No problems match your filters.</div>
              </div>
            ) : (
              <ul>
                {filtered.map((p, i) => {
                  const isSolved = solved.has(p.id);
                  const pct = Math.round((p.acceptance ?? 0) * 1000) / 10;
                  const catSlug = p.category.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <li key={`${p.id}-${i}`}
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`grid grid-cols-[44px_1fr_90px_110px_110px] items-center px-6 py-3 border-b border-white/[0.03] transition-colors cursor-pointer
                        ${hoveredRow === p.id ? "bg-white/[0.04]" : "bg-transparent"}`}>

                      {/* Number / solved indicator */}
                      <div className="flex items-center gap-1.5">
                        {isSolved ? (
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">{p.number}</span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="min-w-0">
                        <Link href={`/problems/${catSlug}/${p.id}`}
                          className={`text-sm font-medium hover:text-indigo-400 transition truncate block
                            ${isSolved ? "text-slate-400" : "text-slate-200"}`}>
                          {p.title}
                        </Link>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {p.tags.slice(0,3).map(t => (
                            <span key={t} className="text-[9px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div className="flex justify-center">
                        <DiffBadge value={p.difficulty} />
                      </div>

                      {/* Acceptance */}
                      <div className="px-3">
                        <div className="text-xs text-slate-400 mb-1 text-center">{pct.toFixed(1)}%</div>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* Platform */}
                      <div className="flex justify-center">
                        <PlatformDot id={(p as any).platform ?? "LeetCode"} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right Panel: Activity + Stats */}
          <div className="w-72 shrink-0 border-l border-white/[0.06] bg-[#161b22]/60 overflow-y-auto no-scrollbar p-5 space-y-6">

            {/* Activity Heatmap */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Activity</div>
              <ActivityHeatmap solvedCount={solved.size} />
              {/* Month labels */}
              <div className="flex justify-between mt-1">
                {Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - (5 - i));
                  return <span key={i} className="text-[9px] text-slate-600">{d.toLocaleString("default", { month: "short" })}</span>;
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-white/[0.06] space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quick Stats</div>
              {[
                { label: "Total Problems", value: PROBLEMS.length, color: "text-white" },
                { label: "Easy",   value: easyCount,  color: "text-emerald-400" },
                { label: "Medium", value: medCount,   color: "text-amber-400" },
                { label: "Hard",   value: hardCount,  color: "text-rose-400" },
                { label: "Solved", value: solved.size, color: "text-indigo-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 text-xs">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">By Category</div>
              <div className="space-y-2">
                {Array.from(new Set(PROBLEMS.map(p => p.category)))
                  .sort()
                  .slice(0, 10)
                  .map(cat => {
                    const catProblems = PROBLEMS.filter(p => p.category === cat);
                    const catSolved   = catProblems.filter(p => solved.has(p.id)).length;
                    const pct = catProblems.length ? (catSolved / catProblems.length) * 100 : 0;
                    const slug = cat.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <Link key={cat} href={`/problems/${slug}`}
                        className="block group">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-slate-400 group-hover:text-indigo-400 transition">{cat}</span>
                          <span className="text-slate-600">{catSolved}/{catProblems.length}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-indigo-500/60 transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Difficulty distribution */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Distribution</div>
              <StatRing easy={easyCount} medium={medCount} hard={hardCount} total={PROBLEMS.length} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}