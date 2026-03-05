"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function MathGame() {
  const [q] = useState({ question: "12 + 8 = ?", answer: 20 });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");

  function check() {
    if (parseInt(input) === q.answer) {
      updateProgress(15); // ✅ award XP
      setFeedback("✅ Correct! (+15 XP)");
    } else {
      setFeedback("❌ Try again");
    }
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Math Puzzle Challenge</h1>
      <p>{q.question}</p>
      <input
        type="number"
        className="border px-2 py-1 text-black"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="ml-2 px-3 py-1 border rounded"
        onClick={check}
      >
        Submit
      </button>
      {feedback && <p className="mt-2">{feedback}</p>}
    </main>
  );
}
