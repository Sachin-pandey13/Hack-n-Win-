// components/problems/EditorToolbar.tsx
"use client";
import React from "react";

const LANGUAGES = [
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
  { key: "python", label: "Python" },
  { key: "c", label: "C" },
  // add more if your editor supports them
];

type Props = {
  language: string;
  setLanguage: (l: string) => void;
  onRun: () => void;
  /** Optional: show a green Submit button */
  onSubmit?: () => void;
  /** Optional: show an AI Assistant toggle */
  onToggleAI?: () => void;
  /** Optional: disable buttons & show “Running…” text */
  running?: boolean;
};

export default function EditorToolbar({
  language,
  setLanguage,
  onRun,
  onSubmit,
  onToggleAI,
  running = false,
}: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 bg-[#0b1020]/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#0b1020]/60">
      {/* Language */}
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <span className="uppercase tracking-wide text-[10px] text-slate-400">Language</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 outline-none hover:border-slate-600 focus:border-indigo-500"
          aria-label="Language selector"
        >
          {LANGUAGES.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {/* Divider */}
      <div className="mx-2 h-5 w-px bg-slate-800" />

      {/* Autosave / theme note (subtle like LC) */}
      <div className="hidden text-xs text-slate-500 md:block">
        Autosave: <span className="text-slate-300">On</span> • Theme: <span className="text-slate-300">Dark</span>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Optional AI */}
        {onToggleAI && (
          <button
            onClick={onToggleAI}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            AI Assistant
          </button>
        )}

        {/* Run */}
        <button
          onClick={onRun}
          disabled={running}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running…" : "Run"}
        </button>

        {/* Submit (optional) */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={running}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
