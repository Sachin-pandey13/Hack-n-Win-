"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function WordMatch() {
  const pairs = [
    { term: "Photosynthesis", def: "Plants making food using sunlight" },
    { term: "Evaporation", def: "Water changing to vapor" },
  ];

  const [matched, setMatched] = useState(false);

  function completeMatch() {
    setMatched(true);
    updateProgress(20); // ✅ XP
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Word Match (Science Terms)</h1>
      <p>Match the terms with their definitions (demo simplified).</p>
      {!matched ? (
        <button
          onClick={completeMatch}
          className="mt-4 px-4 py-2 border rounded bg-blue-700"
        >
          Complete Matching
        </button>
      ) : (
        <p className="mt-4">🎉 Matched correctly! (+20 XP)</p>
      )}
    </main>
  );
}
