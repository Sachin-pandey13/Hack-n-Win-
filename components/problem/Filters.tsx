// components/problem/Filters.tsx
"use client";

import { Search } from "lucide-react";
import { useProblemsStore, selectFiltered } from "@/store/useProblemsStore";
import { TAGS } from "@/lib/problem"; // make sure TAGS is exported from lib/problem

export default function Filters() {
  const {
    search,
    setSearch,
    tag,
    setTag,
    difficulty,
    setDifficulty,
  } = useProblemsStore();

  const count = selectFiltered().length;

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
          aria-hidden="true"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or #..."
          aria-label="Search problems"
          className="w-full bg-slate-800/70 border border-slate-700 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTag("All")}
          aria-pressed={tag === "All"}                
          aria-label="Filter by all tags"
          className={`px-3 py-1 rounded-full border ${
            tag === "All"
              ? "border-indigo-500 bg-indigo-500/15"
              : "border-slate-700 hover:border-slate-600"
          }`}
        >
          All
        </button>

        {TAGS.map((t) => {
          const pressed = tag === t;                
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              aria-pressed={pressed}                 
              aria-label={`Filter by ${t}`}
              className={`px-3 py-1 rounded-full border ${
                pressed
                  ? "border-indigo-500 bg-indigo-500/15"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Difficulty */}
      <div className="flex gap-2">
        {(["All", "Easy", "Medium", "Hard"] as const).map((d) => {
          const pressed = difficulty === d;          // ✅ boolean
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              aria-pressed={pressed}                 // ✅ boolean
              aria-label={`Filter by ${d} difficulty`}
              className={`px-3 py-1 rounded-md border ${
                pressed
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-sm text-slate-400">
        Showing <span className="text-slate-200">{count}</span> problems
      </p>
    </div>
  );
}
