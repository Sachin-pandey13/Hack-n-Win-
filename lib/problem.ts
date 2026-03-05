// lib/problem.ts
import rawProblems from "./problems.json";
import type { Problem } from "@/types/problem";

// Ensure problems.json is parsed as Problem[]
export const PROBLEMS: Problem[] = (rawProblems as any[]).map((p, i) => ({
  id: p.id ?? String(i + 1),
  number: p.number ?? i + 1,
  title: p.title ?? "Untitled",
  difficulty: p.difficulty ?? "Easy",
  acceptance: p.acceptance ?? 0,
  category: p.category ?? "Misc",
  tags: p.tags ?? [],
  platform: p.platform ?? "LeetCode", // fallback if missing
  ...p,
}));

export const TAGS = [
  "Arrays",
  "Strings",
  "Binary Search",
  "Sorting",
  "DP",
  "Tree",
  "Graph",
  "Two Pointers",
  "Greedy",
  "Stack",
  "Queue",
  "Heap",
  "Backtracking",
  "Math",
  "Bit Manipulation",
  "Sliding Window",
  "Linked List",
  "Hash Table",
];

export const CATEGORIES = ["All", ...TAGS];
