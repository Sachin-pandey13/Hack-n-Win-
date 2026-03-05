import { Problem } from "@/types/problem";

export interface RunResult {
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit";
  passed: number;
  total: number;
  timeMs: number;
  memoryMB: number;
  analysis: {
    approach: "Brute" | "Better" | "Optimal";
    timeComplexity: string;
    spaceComplexity: string;
    notes?: string;
  };
}

export async function runCodeOnServerMock(
  problem: Problem,
  code: string,
  lang: string
): Promise<RunResult> {
  await new Promise((r) => setTimeout(r, 800)); // simulate latency

  const ok = Math.random() > 0.08;
  const passed = ok ? 12 : Math.floor(Math.random() * 11);
  const total = 12;
  const timeMs = 8 + Math.floor(Math.random() * 90);
  const memoryMB = 24 + Math.floor(Math.random() * 64);

  // naive heuristics from code strings (placeholder)
  const lower = code.toLowerCase();
  const approach =
    /two\s*pointers|hash|map|dictionary|binary\s*search|stack|heap/.test(lower)
      ? "Optimal"
      : /sort|nested\s*loop/.test(lower)
      ? "Better"
      : "Brute";

  const timeComplexity =
    /binary\s*search/.test(lower)
      ? "O(log n)"
      : /two\s*pointers|hash|map|dictionary/.test(lower)
      ? "O(n)"
      : /nested\s*for|for\s*\(.*\)\s*{[^}]*for/.test(code)
      ? "O(n^2)"
      : "O(n)";

  const spaceComplexity = /hash|map|dictionary/.test(lower) ? "O(n)" : "O(1)";

  return {
    status: ok ? "Accepted" : "Wrong Answer",
    passed,
    total,
    timeMs,
    memoryMB,
    analysis: {
      approach,
      timeComplexity,
      spaceComplexity,
      notes: "Heuristic analysis (demo).",
    },
  };
}
