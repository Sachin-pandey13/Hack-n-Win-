"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function CircuitGame() {
  const [completed, setCompleted] = useState(false);

  function completeCircuit() {
    setCompleted(true);
    updateProgress(20); // ✅ XP
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Circuit Builder</h1>
      <p>
        Drag and drop components (battery + bulb + wire) to complete the circuit
        (demo: just click button).
      </p>
      {!completed ? (
        <button
          onClick={completeCircuit}
          className="mt-4 px-4 py-2 border rounded bg-green-700"
        >
          Complete Circuit
        </button>
      ) : (
        <p className="mt-4">⚡ Circuit Completed! (+20 XP)</p>
      )}
    </main>
  );
}
