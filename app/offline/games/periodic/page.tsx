"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function PeriodicQuiz() {
  const [q] = useState({
    question: "What is the chemical symbol for Oxygen?",
    options: ["O", "Ox", "Og"],
    answer: 0,
  });
  const [feedback, setFeedback] = useState("");

  function check(idx: number) {
    if (idx === q.answer) {
      updateProgress(15); // ✅ XP
      setFeedback("✅ Correct! (+15 XP)");
    } else {
      setFeedback("❌ Try again");
    }
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Periodic Table Quiz</h1>
      <p>{q.question}</p>
      <ul className="mt-2 space-y-2">
        {q.options.map((opt, idx) => (
          <li key={idx}>
            <button
              className="px-3 py-1 border rounded hover:bg-gray-800"
              onClick={() => check(idx)}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
      {feedback && <p className="mt-3">{feedback}</p>}
    </main>
  );
}
