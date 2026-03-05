// app/problems/[category]/page.tsx
"use client";
import React from "react";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problem";
import type { Problem } from "@/types/problem";

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

export default function CategoryPage({ params }: { params: { category: string } }) {
  const list = PROBLEMS.filter((p) => p.category === params.category);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 capitalize">
        {params.category} Problems
      </h1>

      <ul className="divide-y divide-slate-800/70 text-sm">
        {list.map((p) => (
          <li
            key={p.id}
            className="grid grid-cols-[76px_1fr_160px_140px] items-center px-3 py-3 cursor-pointer transform transition duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-slate-800/60 rounded-lg"
          >
            <div className="px-2 text-slate-400">{p.number}</div>

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
  );
}
