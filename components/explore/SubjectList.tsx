// components/explore/SubjectList.tsx
"use client";

import React, { useMemo } from "react";
import { PLAYLISTS, type Playlist } from "@/lib/playlists";

type Props = {
  stream: string;
  query?: string; // external search text (optional)
  onQueryChange?: (v: string) => void; // optional if parent wants to control search
  onSelect: (subject: string) => void;
  maxShown?: number;
};

export default function SubjectList({
  stream,
  query = "",
  onQueryChange,
  onSelect,
  maxShown = 100,
}: Props) {
  // collect subjects (dedupe and count playlists per subject) for given stream
  const subjects = useMemo(() => {
    const map = new Map<string, number>();
    PLAYLISTS.forEach((pl: Playlist) => {
      const plStream = (pl as any).stream || null;
      const plSubject = (pl as any).subject || null;
      if (plStream && plSubject && plStream === stream) {
        map.set(plSubject, (map.get(plSubject) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stream]);

  const filtered = subjects.filter((s) =>
    !query ? true : s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, maxShown);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder={`Search subjects in ${stream}...`}
          className="rounded-lg border bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 flex-1"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-[#071028]/60 p-4 text-sm text-gray-400">
          No subjects found for this stream yet. Seed playlists for subjects from your roadmap.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <button
              key={s.name}
              onClick={() => onSelect(s.name)}
              className="text-left rounded-lg border border-white/8 p-3 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-gray-400 mt-1">{s.count} playlist{ s.count > 1 ? "s" : "" }</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
