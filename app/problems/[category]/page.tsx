// app/problems/[category]/page.tsx
"use client";
import React, { useMemo, useState, use } from "react";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problem";
import type { Problem } from "@/types/problem";

function DiffBadge({ value }: { value: Problem["difficulty"] }) {
  const cfg = {
    Easy:   "text-emerald-400 bg-emerald-500/10 ring-emerald-500/25",
    Medium: "text-amber-400  bg-amber-400/10  ring-amber-400/25",
    Hard:   "text-rose-400   bg-rose-500/10   ring-rose-500/25",
  }[value];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg}`}>
      {value}
    </span>
  );
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  // Slug matching: "binary-search" → "Binary Search", "arrays" → "Arrays"
  const categorySlug = unwrappedParams.category; // e.g. "binary-search"
  
  const list = useMemo(() => PROBLEMS.filter(p => {
    const slug = p.category.toLowerCase().replace(/\s+/g, "-");
    return slug === categorySlug;
  }), [categorySlug]);

  const categoryLabel = list[0]?.category ?? categorySlug;
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/problems" className="text-indigo-400 hover:text-indigo-300 text-sm">← Problems</Link>
          <h1 className="text-2xl font-bold capitalize">{categoryLabel}</h1>
          <span className="text-sm text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{list.length} problems</span>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <div className="text-5xl mb-4">🔍</div>
            <div>No problems found for category &quot;{categorySlug}&quot;</div>
            <Link href="/problems" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">← Back to Problems</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#161b22]">
            <div className="grid grid-cols-[44px_1fr_90px_110px] px-6 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border-b border-white/[0.04] bg-[#0d1117]">
              <div>#</div><div>Title</div><div className="text-center">Difficulty</div><div className="text-center">Acceptance</div>
            </div>
            <ul>
              {list.map((p, i) => {
                const pct = Math.round((p.acceptance ?? 0) * 1000) / 10;
                const catSlug = p.category.toLowerCase().replace(/\s+/g, "-");
                return (
                  <li key={p.id}
                    onMouseEnter={() => setHoveredRow(p.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`grid grid-cols-[44px_1fr_90px_110px] items-center px-6 py-3 border-b border-white/[0.03] transition-colors
                      ${hoveredRow === p.id ? "bg-white/[0.04]" : ""}`}>
                    <div className="text-xs text-slate-600 font-mono">{p.number}</div>
                    <div>
                      <Link href={`/problems/${catSlug}/${p.id}`}
                        className="text-sm font-medium text-slate-200 hover:text-indigo-400 transition">
                        {p.title}
                      </Link>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {p.tags.slice(0,3).map(t => (
                          <span key={t} className="text-[9px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center"><DiffBadge value={p.difficulty} /></div>
                    <div className="px-3">
                      <div className="text-xs text-slate-400 mb-1 text-center">{pct.toFixed(1)}%</div>
                      <div className="h-1 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
