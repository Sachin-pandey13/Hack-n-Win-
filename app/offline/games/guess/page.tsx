"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function BinaryGuessGame() {
  const [number, setNumber] = useState(() => Math.floor(Math.random() * 20) + 1);
  const [result, setResult] = useState<string | null>(null);

  function checkAnswer(type: "even" | "odd") {
    const correct = number % 2 === 0 ? "even" : "odd";

    if (type === correct) {
      setResult("correct");
      updateProgress(15); // +15 XP
    } else {
      setResult("wrong");
    }
  }

  function newRound() {
    setNumber(Math.floor(Math.random() * 20) + 1);
    setResult(null);
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Binary Guess Game</h1>

      <p className="mb-3">
        Guess whether the number is <b>Even</b> or <b>Odd</b>.
      </p>

      <div className="text-3xl font-bold mb-4">{number}</div>

      {!result && (
        <div className="flex gap-3">
          <button
            onClick={() => checkAnswer("even")}
            className="px-4 py-2 rounded bg-blue-700"
          >
            Even
          </button>

          <button
            onClick={() => checkAnswer("odd")}
            className="px-4 py-2 rounded bg-purple-700"
          >
            Odd
          </button>
        </div>
      )}

      {result === "correct" && (
        <div className="mt-4">
          ✅ Correct! (+15 XP)
          <button
            onClick={newRound}
            className="ml-3 px-3 py-1 border rounded"
          >
            Next
          </button>
        </div>
      )}

      {result === "wrong" && (
        <div className="mt-4">
          ❌ Wrong guess.
          <button
            onClick={newRound}
            className="ml-3 px-3 py-1 border rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </main>
  );
}