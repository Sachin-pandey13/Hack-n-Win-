// components/explore/StreamSelector.tsx
"use client";

import React from "react";

type Props = {
  streams: string[];
  selected: string | null;
  onSelect: (s: string) => void;
};

export default function StreamSelector({ streams, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {streams.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`px-3 py-1 rounded-full text-sm border transition
            ${selected === s ? "border-purple-500 bg-white/5" : "border-white/6 hover:bg-white/2"}
            focus:outline-none focus:ring-2 focus:ring-purple-600`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
