// components/problems/ProblemRow.tsx
"use client";
import React from "react";
import Link from "next/link";
import type { Problem } from "@/types/problems";

export default function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex items-center justify-between">
      <div>
        <div className="text-lg font-semibold">{problem.number ? `${problem.number}. ` : ""}{problem.title}</div>
        <div className="text-sm text-slate-400">{problem.tags.join(" • ")}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-400">{Math.round((problem.acceptance ?? 0) * 100)}%</div>
        <div className={`px-2 py-1 rounded text-sm ${problem.difficulty === "Easy" ? "bg-emerald-800 text-emerald-300" : problem.difficulty === "Medium" ? "bg-amber-800 text-amber-300" : "bg-rose-800 text-rose-300"}`}>
          {problem.difficulty}
        </div>
        <Link href={`/problems/${problem.category}/${problem.id}`} className="ml-2">
          <button aria-label={`Open problem ${problem.title}`} className="px-3 py-1 bg-indigo-600 rounded-md text-sm">Solve</button>
        </Link>
      </div>
    </div>
  );
}
