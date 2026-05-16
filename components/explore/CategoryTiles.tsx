"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  selected: string | null;
  onSelect: (c: string | null) => void;
};

const tiles = [
  { id: "Curriculum", title: "College curriculum", desc: "Stream → Subject playlists", icon: "📚" },
  { id: "Technical", title: "Technical", desc: "DSA, Languages, Interview prep", icon: "💻" },
  { id: "Project", title: "Project-based learning", desc: "Project videos & full courses", icon: "🚀" },
  { id: "Trending", title: "Trending industries", desc: "Hot topics, resources & hiring", icon: "🔥" },
  { id: "STEAM", title: "STEAM (Grades 6–12)", desc: "Science, Math, Tech, Arts & Logic", icon: "🧪" },
];

export default function CategoryTiles({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
      {tiles.map((t, i) => (
        <motion.button
          key={t.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(selected === t.id ? null : t.id)}
          aria-pressed={selected === t.id}
          className={`relative overflow-hidden p-4 text-left rounded-xl transition-all
            ${selected === t.id 
              ? "bg-purple-600/20 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
              : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
            }
            focus:outline-none`}
        >
          {selected === t.id && (
             <motion.div layoutId="tileGlow" className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 blur-xl rounded-xl z-0" />
          )}
          <div className="relative z-10 flex flex-col h-full">
            <span className="text-2xl mb-2">{t.icon}</span>
            <div className={`font-bold text-sm sm:text-base ${selected === t.id ? 'text-white' : 'text-gray-200'}`}>{t.title}</div>
            <div className={`text-[11px] sm:text-xs mt-1 ${selected === t.id ? 'text-purple-200' : 'text-gray-400'}`}>{t.desc}</div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
