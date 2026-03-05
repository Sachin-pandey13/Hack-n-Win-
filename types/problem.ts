// types/problems.ts
export type Difficulty = "Easy" | "Medium" | "Hard";

export type Example = {
  input: string;
  output: string;
  explanation?: string;
};

export type Statement = {
  content: string;
  examples: Example[];
  constraints: string[];
};

export type Problem = {
  id: string;
  number?: number;
  title: string;
  difficulty: Difficulty;
  acceptance?: number; // e.g. 0.48
  tags: string[];
  category: string;
  languages: string[]; // ['cpp','java','python','c']
  statement: Statement;
};

export type RunResult = {
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Timeout";
  runtimeMs: number;
  memoryKb?: number;
  tests: { name: string; passed: boolean; expected: string; actual?: string }[];
  timeComplexity?: string; // e.g. O(n)
  spaceComplexity?: string; // e.g. O(1)
  aiSuggestion?: string; // e.g. "Brute / Better / Optimal" explanation
};
