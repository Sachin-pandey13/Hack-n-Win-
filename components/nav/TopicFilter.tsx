// components/nav/TopicFilter.tsx
"use client";

export default function TopicFilter({
  topics,
  selected,
  onSelect,
}: {
  topics: readonly string[];
  selected: string | "All";
  onSelect: (t: string | "All") => void;
}) {

  // Ensure topics are unique and do not include "All"
  const uniqueTopics = Array.from(new Set(topics)).filter(t => t !== "All");

  const list = ["All", ...uniqueTopics];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden">
      {list.map((t, i) => {
        const active = selected === t;

        return (
          <button
            key={`${t}-${i}`}
            onClick={() => onSelect(t)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition
              ${
                active
                  ? "border-purple-500 bg-purple-600/20 text-purple-200"
                  : "border-gray-800 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}