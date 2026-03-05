"use client";
import React, { useEffect, useState } from "react";
import { getProgress } from "@/lib/gamification";

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  if (!progress) return <div>Loading progress...</div>;

  return (
    <div className="p-6 bg-gray-900/70 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Your Progress</h2>
      <p className="text-gray-300">XP: {progress.xp}</p>
      <p className="text-gray-300">Level: {progress.level}</p>
      <p className="text-gray-300">Streak: {progress.streak} days</p>

      <div className="mt-2">
        <p className="text-gray-300 mb-1">Badges:</p>
        <ul className="flex gap-2 flex-wrap">
          {progress.badges.length > 0 ? (
            progress.badges.map((b: string, i: number) => (
              <li
                key={i}
                className="px-2 py-1 bg-yellow-600 text-white text-xs rounded"
              >
                {b}
              </li>
            ))
          ) : (
            <li className="text-gray-400 text-sm">No badges yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
