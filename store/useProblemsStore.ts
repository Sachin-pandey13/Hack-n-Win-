// store/useProblemsStore.ts
import { create } from "zustand";
import { PROBLEMS, TAGS } from "@/lib/problem";
import type { Problem, Difficulty } from "@/types/problem";

type SortKey = "number" | "acceptance" | "difficulty" | "title";

interface ProblemsState {
  search: string;
  tag: "All" | string;
  difficulty: Difficulty | "All";
  sort: SortKey;
  list: Problem[];
  setSearch(v: string): void;
  setTag(t: "All" | string): void;
  setDifficulty(d: Difficulty | "All"): void;
  setSort(s: SortKey): void;
}

const sorters: Record<SortKey, (a: Problem, b: Problem) => number> = {
  number: (a, b) => a.number - b.number,
  acceptance: (a, b) => b.acceptance - a.acceptance,
  difficulty: (a, b) =>
    ({ Easy: 0, Medium: 1, Hard: 2 }[a.difficulty] -
      { Easy: 0, Medium: 1, Hard: 2 }[b.difficulty]),
  title: (a, b) => a.title.localeCompare(b.title),
};

export const useProblemsStore = create<ProblemsState>((set) => ({
  search: "",
  tag: "All",
  difficulty: "All",
  sort: "number",
  list: PROBLEMS,
  setSearch: (v) => set({ search: v }),
  setTag: (t) => set({ tag: t }),
  setDifficulty: (d) => set({ difficulty: d }),
  setSort: (s) => set({ sort: s }),
}));

export function selectFiltered(): Problem[] {
  const { search, tag, difficulty, sort } = useProblemsStore.getState();
  const q = search.trim().toLowerCase();

  return PROBLEMS
    .filter((p) => {
      const byDiff = difficulty === "All" || p.difficulty === difficulty;
      const byTag = tag === "All" || p.tags.includes(tag);
      const bySearch =
        q === "" ||
        p.title.toLowerCase().includes(q) ||
        String(p.number).includes(q);
      return byDiff && byTag && bySearch;
    })
    .sort(sorters[sort]);
}

// (optional) export TAGS if your Filters UI reads from here
export { TAGS };
