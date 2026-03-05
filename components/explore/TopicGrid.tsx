// components/explore/TopicGrid.tsx
"use client";

import React from "react";
import PlaylistCard from "@/components/cards/PlaylistCard";
import type { Playlist } from "@/lib/playlists";

type Props = {
  items: Playlist[];
  onOpen?: (p: Playlist) => void;
  emptyMessage?: string;
  columns?: { base?: number; sm?: number; lg?: number }; // optional grid sizes
};

export default function TopicGrid({
  items,
  onOpen,
  emptyMessage = "No playlists found.",
  columns = { base: 1, sm: 2, lg: 3 },
}: Props) {
  const baseCols = columns.base || 1;
  const smCols = columns.sm || 2;
  const lgCols = columns.lg || 3;

  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div className={`mt-4 grid grid-cols-${baseCols} gap-4 sm:grid-cols-${smCols} lg:grid-cols-${lgCols}`}>
      {items.map((pl) => (
        <PlaylistCard
          key={pl.id}
          item={pl}
          onOpen={(p) => onOpen?.(p)}
        />
      ))}
    </div>
  );
}
