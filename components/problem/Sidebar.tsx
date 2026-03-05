// components/problems/Sidebar.tsx
"use client";
import React from "react";

export default function Sidebar() {
  // placeholder: you'll replace with a calendar/heatmap library later
  const days = new Array(30).fill(0).map((_, i) => ({ day: i + 1, done: Math.random() > 0.7 }));

  return (
    <aside className="w-72 p-4 space-y-4 bg-slate-900/60 border-l border-slate-800">
      <div>
        <h4 className="font-semibold">My Lists</h4>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="p-2 bg-slate-800/50 rounded">Favorites</li>
          <li className="p-2 bg-slate-800/50 rounded">To Practice</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold">Activity</h4>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {days.map((d) => (
            <div key={d.day} className={`h-6 w-6 rounded ${d.done ? "bg-emerald-500" : "bg-slate-800"}`} title={`Day ${d.day}`}>
              &nbsp;
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
