// components/explore/CategoryTiles.tsx
"use client";

import React from "react";

type Props = {
  selected: string | null;
  onSelect: (c: string | null) => void;
};

const tiles = [
  { id: "Curriculum", title: "College curriculum", desc: "Stream → Subject playlists" },
  { id: "Technical", title: "Technical", desc: "DSA, Languages, Interview prep" },
  { id: "Project", title: "Project-based learning", desc: "Project videos & full courses" },
  { id: "Trending", title: "Trending industries", desc: "Hot topics, resources & hiring" },
  // NEW: STEAM tile — Grades 6–12
  { id: "STEAM", title: "STEAM (Grades 6–12)", desc: "Science, Math, Tech, Arts & Logic games" },
];

export default function CategoryTiles({ selected, onSelect }: Props) {
  return (
    // use sm:grid-cols-5 so up to five tiles can show on wider screens
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
      {tiles.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(selected === t.id ? null : t.id)}
          aria-pressed={selected === t.id}
          className={`p-4 text-left rounded-xl border transition-all transform
            ${selected === t.id ? "border-purple-500 bg-white/5" : "border-white/6 hover:scale-[1.01]"}
            focus:outline-none focus:ring-2 focus:ring-purple-600`}
        >
          <div className="font-semibold text-sm sm:text-base">{t.title}</div>
          <div className="text-xs text-gray-400 mt-1">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}
