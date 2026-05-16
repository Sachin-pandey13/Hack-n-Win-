"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useId,
  use,
} from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useRouter } from "next/navigation";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import "@/app/monaco-local"; 
import { PROBLEMS } from "@/lib/problem";
import type { Problem, Example } from "@/types/problem";
import ResultPanel from "@/components/problem/ResultPanel";
import type * as Monaco from "monaco-editor";
import type { RunResult } from "@/components/problem/ResultPanel";
import { parseLineNumber } from "@/lib/parseLineNumber";

/* =========================
   Language Map for Judge0
========================= */
type Lang = "cpp" | "java" | "python" | "c";

const LANG_MAP: Record<Lang, number> = {
  cpp: 54,
  java: 62,
  python: 71,
  c: 50,
};


/* =========================
   Platform Templates
========================= */
const PLATFORM_TEMPLATES: Record<string, Record<Lang, string>> = {
  LeetCode: {
    cpp: `class Solution {
public:
    int twoSum(vector<int>& nums, int target) {
        // Write code
    }
};`,
    java: `class Solution {
    public int twoSum(int[] nums, int target) {
        // Write code
    }
}`,
    python: `class Solution:
    def twoSum(self, nums, target):
        # Write code
        pass`,
    c: `#include <stdio.h>
int main() {
    // LeetCode style input
    return 0;
}`,
  },
  HackerRank: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    // HackerRank style input parsing
    return 0;
}`,
    java: `import java.util.*;
public class Solution {
    public static void main(String[] args) {
        // HackerRank style input parsing
    }
}`,
    python: `if __name__ == "__main__":
    # HackerRank style input parsing
    pass`,
    c: `#include <stdio.h>
int main() {
    // HackerRank style input parsing
    return 0;
}`,
  },
  CodeChef: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t; cin >> t;
    while (t--) {
        // CodeChef style multiple testcases
    }
    return 0;
}`,
    java: `import java.util.*;
class Codechef {
    public static void main (String[] args) throws java.lang.Exception {
        Scanner sc = new Scanner(System.in);
        int t = sc.nextInt();
        while(t-- > 0) {
            // CodeChef style multiple testcases
        }
    }
}`,
    python: `t = int(input())
for _ in range(t):
    # CodeChef style multiple testcases
    pass`,
    c: `#include <stdio.h>
int main() {
    int t; scanf("%d", &t);
    while(t--) {
        // CodeChef style multiple testcases
    }
    return 0;
}`,
  },
  CodingNinjas: {
    cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    // Coding Ninjas style input/output
    return 0;
}`,
    java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        // Coding Ninjas style input/output
    }
}`,
    python: `if __name__ == "__main__":
    # Coding Ninjas style input/output
    pass`,
    c: `#include <stdio.h>
int main() {
    // Coding Ninjas style input/output
    return 0;
}`,
  },
};

/* =========================
   Judge0 API Helper
========================= */
async function runWithJudge0(code: string, lang: Lang, stdin = "") {
  const res = await fetch("/api/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: code,
      language_id: LANG_MAP[lang],
      stdin,
    }),
  });

  const data = await res.json();

  // Normalize outputs (remove trailing spaces/newlines)
  const normalize = (s?: string) =>
    (s || "")
      .replace(/\r\n/g, "\n") // Windows → Unix newlines
      .trim();

  return {
    status: data.status?.description,
    stdout: normalize(data.stdout),
    stderr: normalize(data.stderr),
    compile_output: normalize(data.compile_output),
    time: data.time,
    memory: data.memory,
    error: data.stderr || data.compile_output,
  };
}


/* =========================
   Resize Handle
========================= */
function Handle({ dir }: { dir: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      data-direction={dir}
      className="split-handle"
      title="Drag to resize"
    />
  );
}

/* =========================
   Monaco Zoom + Context Menu
========================= */
function useMonacoZoom(
  setShowAI: (b: boolean) => void,
  setInitialLucienQuery: (q: string) => void
) {
  const editorRef = useRef<any>(null);
  const [fontSize, setFontSize] = useState(14);
  const focused = useRef(false);

  const apply = useCallback((size: number) => {
    const next = Math.max(10, Math.min(36, Math.round(size)));
    setFontSize(next);
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: next,
        lineHeight: Math.round(next * 1.6),
      });
    }
  }, []);

const onMount = (
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
) => {
  editorRef.current = editor;
  editor.updateOptions({ mouseWheelZoom: true, fontSize });

  // Context menu: Ask Lucien
  const actionDisposable: Monaco.IDisposable = editor.addAction({
    id: "ask-lucien",
    label: "Ask Lucien",
    contextMenuGroupId: "navigation",
    run: () => {
      const selection = editor.getModel()?.getValueInRange(editor.getSelection()!);
      if (selection) {
        setShowAI(true);
        setInitialLucienQuery(`Explain this code:\n\n${selection}`);
      }
    },
  });

  // Example quickfix provider (simple double-semicolon check)
  let provider: Monaco.IDisposable | null = null;
  const model = editor.getModel();
  if (model) {
    const langId = model.getLanguageId();
    provider = monaco.languages.registerCodeActionProvider(langId, {
      provideCodeActions: (m) => {
        const text = m.getValue();
        if (text.includes(";;")) {
          // minimal, no-op quickfix just to demonstrate
          return {
            actions: [
              {
                title: "Remove extra semicolon",
                kind: "quickfix",
                edit: { edits: [] },
                diagnostics: [],
                isPreferred: true,
              } as any,
            ],
            dispose: () => {},
          };
        }
        return { actions: [], dispose: () => {} };
      },
    });
  }

  // Track focus
  const d1 = editor.onDidFocusEditorText?.(() => (focused.current = true));
  const d2 = editor.onDidBlurEditorText?.(() => (focused.current = false));

  // Bind zoom keys to the editor (no global window listeners)
  const { KeyMod, KeyCode } = monaco;
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Equal, () => apply(fontSize + 1));  // Ctrl/Cmd + =
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Minus, () => apply(fontSize - 1));  // Ctrl/Cmd + -
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Digit0, () => apply(14));           // Ctrl/Cmd + 0

  // Dispose Monaco-owned disposables only
  editor.onDidDispose?.(() => {
    d1?.dispose?.();
    d2?.dispose?.();
    actionDisposable?.dispose?.();
    provider?.dispose?.();
  });

  apply(fontSize);
};


  return { onMount, fontSize, apply };
}


/* =========================
   Page Component
========================= */
type MaxKey = "desc" | "editor" | "result" | null;

export default function SolveProblemPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const problem = useMemo<Problem | undefined>(
    () => PROBLEMS.find((p) => p.id === unwrappedParams.id),
    [unwrappedParams.id]
  );
  if (!problem) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#0d1117] text-slate-300">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-semibold">Problem not found</h2>
        <p className="text-slate-500 text-sm">The problem &quot;{unwrappedParams.id}&quot; doesn&apos;t exist or was moved.</p>
        <button
          onClick={() => router.push('/problems')}
          className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
        >
          ← Back to Problems
        </button>
      </div>
    );
  }

// State
const [language, setLanguage] = useState<Lang>("cpp");
const [code, setCode] = useState<string>(
  PLATFORM_TEMPLATES["LeetCode"]?.cpp ?? ""
);

// Separate flags for Run and Submit
const [loading, setLoading] = useState(false);        // for Run button
const [submitting, setSubmitting] = useState(false);  // for Submit button

const [runResult, setRunResult] = useState<RunResult | null>(null);
const [showAI, setShowAI] = useState(false);
const [initialLucienQuery, setInitialLucienQuery] = useState("");

  const pristineRef = useRef(true);
  useEffect(() => {
    pristineRef.current = true;
  }, []);
  function onLangChange(next: Lang) {
    if (pristineRef.current)
      setCode(PLATFORM_TEMPLATES["LeetCode"]?.[next] ?? "");
    setLanguage(next);
  }



async function handleRun() {
  setLoading(true);
  setRunResult(null);

  try {
    const tests = problem.statement.examples as Example[]; // [{input, output}, ...]
    const total = tests.length;

    type Case = {
      input: string;
      expected?: string;
      output?: string;
      passed: boolean;
      timeMs?: number;
      memoryMB?: number;
      error?: { line?: number; message: string };
    };

    const cases: Case[] = [];
    let passed = 0;
    let avgTimeAcc = 0;
    let avgMemAcc = 0;

    for (const ex of tests) {
      // Build a runnable program around the user's code
      const harnessed = buildHarness(code, language, ex.input, ex.output);

      // Run via Judge API
      const res = await runWithJudge0(harnessed, language, ex.input ?? "");

      const timeMs = res.time ? Number(res.time) * 1000 : undefined;
      const memoryMB = res.memory ? Number(res.memory) / 1024 : undefined;

      // --- Compilation error ---
      if (res.status === "Compilation Error" || res.compile_output) {
        const err = parseLineNumber(res.compile_output || res.stderr || res.error || "", language);
        cases.push({
          input: ex.input,
          expected: ex.output,
          passed: false,
          timeMs,
          memoryMB,
          error: err || { message: res.compile_output || res.stderr || res.error || "Compilation Error" },
        });

        setRunResult({
          status: "Compilation Error",
          passed: 0,
          total,
          timeMs: 0,
          memoryMB: 0,
          message: err?.message || "Compilation error",
          cases,
          complexity: undefined,
          optimal: undefined,
          isOptimal: false,
        } as any);
        return;
      }

      // --- Runtime error ---
      if ((typeof res.status === "string" && res.status.includes("Runtime Error")) || res.stderr) {
        const err = parseLineNumber(res.stderr || res.error || "", language);
        cases.push({
          input: ex.input,
          expected: ex.output,
          passed: false,
          timeMs,
          memoryMB,
          error: err || { message: res.stderr || res.error || "Runtime Error" },
        });

        setRunResult({
          status: "Runtime Error",
          passed,
          total,
          timeMs: avgTimeAcc,
          memoryMB: avgMemAcc,
          message: err?.message || "Runtime error",
          cases,
          complexity: undefined,
          optimal: undefined,
          isOptimal: false,
        } as any);
        return;
      }

      // --- Compare output (WA vs AC) ---
      const got = (res.stdout || "").trim();
      const expected = (ex.output || "").trim();
      const ok = expected ? got === expected : true;

      cases.push({
        input: ex.input,
        expected,
        output: got,
        passed: ok,
        timeMs,
        memoryMB,
      });

      if (ok) {
        passed++;
        if (typeof timeMs === "number") avgTimeAcc += timeMs;
        if (typeof memoryMB === "number") avgMemAcc += memoryMB;
      } else {
        // Stop at first wrong case (LeetCode behavior)
        break;
      }
    }

// Build complexity series from measured per-case times (simple live chart)
const series = cases
  .map((c, i) => ({
    n: i + 1,
    ops: typeof c.timeMs === "number" ? Math.max(1, Math.round(c.timeMs)) : 1,
  }))
  .filter(Boolean);

// If you store optimal in PROBLEMS (e.g., problem.optimal = { time, space })
const optimal = (problem as any).optimal
  ? { time: (problem as any).optimal.time, space: (problem as any).optimal.space }
  : undefined;

// Final status
const status: "Accepted" | "Wrong Answer" | "Error" =
  passed === total ? "Accepted" : passed < total ? "Wrong Answer" : "Error";

// Prepare measured complexity; we'll fill from Groq on AC
let measured: { time?: string; space?: string; series: { n: number; ops: number }[] } = {
  time: undefined,
  space: undefined,
  series, // keep this so the chart has data
};

// Ask Groq ONLY if all tests passed
if (status === "Accepted") {
  try {
    const r = await fetch("/api/complexity/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });
    const g = await r.json();
    console.log("[UI] groq response", g); // remove after debugging
    if (g?.time) measured.time = String(g.time).toLowerCase();
    if (g?.space) measured.space = String(g.space).toLowerCase();
  } catch (err) {
    console.warn("[UI] groq fetch failed", err);
    // ignore LLM failures; UI will simply show "—"
  }
}

// Compare with optimal; leave undefined when not comparable so Verdict hides
let isOptimal: boolean | undefined = undefined;
if (measured.time && optimal?.time) {
  isOptimal =
    measured.time.replace(/\s+/g, "") === (String(optimal.time) ?? "").toLowerCase().replace(/\s+/g, "");
}

// Averages across passed cases
const avgTime = passed ? Math.round(avgTimeAcc / passed) : 0;
const avgMem = passed ? Math.round(avgMemAcc / passed) : 0;

setRunResult({
  status,
  passed,
  total,
  timeMs: avgTime,
  memoryMB: avgMem,
  message:
    status === "Wrong Answer"
      ? (() => {
          const firstBad = cases.find((c) => !c.passed);
          return firstBad
            ? `Input: ${firstBad.input}\nExpected: ${firstBad.expected}\nGot: ${firstBad.output ?? ""}`
            : "";
        })()
      : "",
  cases,
  complexity: measured, // time/space (from Groq on AC) + series for graph
  optimal, // from metadata/DB if present
  isOptimal,
} as any);

  } finally {
    setLoading(false);
  }
}


// ---------- harness helpers ----------
function hasMainEntry(source: string | null | undefined, lang: Lang): boolean {
  if (!source) return false;
  const s = String(source);
  try {
    if (lang === "cpp" || lang === "c") {
      if (/\bint\s+main\s*\(|\bmain\s*\(/.test(s)) return true;
    } else if (lang === "java") {
      if (/public\s+static\s+void\s+main\s*\(/i.test(s)) return true;
    } else if (lang === "python") {
      if (/if\s+__name__\s*==\s*['"]__main__['"]/i.test(s)) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** infer likely solution method name from user code (LeetCode-style heuristics) */
function inferMethodName(userCode: string | null | undefined, lang: Lang): string | null {
  if (!userCode) return null;
  const s = String(userCode);

  // 1) If class Solution exists, try to find method within that class
  const classBlockMatch = s.match(/class\s+Solution\b[\s\S]*?\{([\s\S]*?)\}\s*;/);
  const classBody = classBlockMatch ? classBlockMatch[1] : s;

  // C++/Java-like method name detection (return-type + name(...))
  const methodMatch = classBody.match(/(?:[\w:<>\s*&]+)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*(?:const)?\s*\{/);
  if (methodMatch) return methodMatch[1];

  // Python: look for def inside class Solution or top-level
  const pyMatch = s.match(/class\s+Solution[\s\S]*?def\s+([a-zA-Z_]\w*)\s*\(/) ||
                  s.match(/def\s+([a-zA-Z_]\w*)\s*\(/);
  if (pyMatch) return pyMatch[1];

  return null;
}

/**
 * Build a LeetCode-style harness:
 * - If user provides entrypoint (main / __main__) -> return userCode unchanged.
 * - If we can infer a method name, generate a harness that:
 *   - parses `nums=[..]` and `target=<num>` from stdin
 *   - calls Solution().<method>(nums, target) and prints the result in a canonical form
 * - Otherwise, return userCode unchanged so the compiler will surface the real error.
 */
function buildHarness(userCode: string, lang: Lang, input: string, expected: string): string {
  // If user provided a main/entrypoint, don't wrap
  if (hasMainEntry(userCode, lang)) return userCode;

  const method = inferMethodName(userCode, lang);

  // If we can't detect a method name, do not inject a LeetCode harness: return user code unchanged.
  // This prevents harness from calling non-existent symbols and producing confusing compile errors.
  if (!method) {
    return userCode;
  }

  // Build language-specific harnesses for the inferred method name.
  switch (lang) {
    case "cpp": {
      // C++ harness: parse nums=[..] and target=<int>, call Solution().<method>(nums, target)
      return `
#include <bits/stdc++.h>
using namespace std;

// ===== USER CODE START =====
${userCode}
// ===== USER CODE END =====

static string _read_all_stdin() {
  ostringstream ss;
  ss << cin.rdbuf();
  return ss.str();
}

static vector<int> _parse_nums(const string &raw) {
  vector<int> out;
  auto l = raw.find('[');
  auto r = raw.find(']');
  if (l == string::npos || r == string::npos || r <= l) return out;
  string inside = raw.substr(l+1, r - l - 1);
  string token;
  stringstream ss(inside);
  while (getline(ss, token, ',')) {
    string t;
    for (char c : token) if ((c >= '0' && c <= '9') || c == '-') t.push_back(c);
    if (!t.empty()) out.push_back(stoi(t));
  }
  return out;
}

static int _parse_target(const string &raw) {
  regex re(\"target\\\\s*=\\\\s*(-?\\\\d+)\", regex_constants::icase);
  smatch m;
  if (regex_search(raw, m, re)) {
    try { return stoi(m[1].str()); } catch(...) {}
  }
  return 0;
}

int main() {
  string raw = _read_all_stdin();
  vector<int> nums = _parse_nums(raw);
  int target = _parse_target(raw);

  Solution sol;
  auto res = sol.${method}(nums, target);

  // print vector-like results
  bool first = true;
  cout << "[";
  for (size_t i = 0; i < res.size(); ++i) {
    if (!first) cout << ",";
    cout << res[i];
    first = false;
  }
  cout << "]\\n";
  return 0;
}
`.trim();
    }

    case "java": {
      return `
import java.io.*;
import java.util.*;
import java.util.regex.*;

// ===== USER CODE START =====
${userCode}
// ===== USER CODE END =====

public class Main {
  public static void main(String[] args) throws Exception {
    StringBuilder sb = new StringBuilder();
    try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
      String line;
      while ((line = br.readLine()) != null) {
        sb.append(line).append("\\n");
      }
    }
    String raw = sb.toString();
    Pattern numsPat = Pattern.compile("nums\\\\s*=\\\\s*\\\\[(.*?)\\\\]", Pattern.CASE_INSENSITIVE);
    Matcher m = numsPat.matcher(raw);
    List<Integer> numsList = new ArrayList<>();
    if (m.find()) {
      String inside = m.group(1);
      for (String tok : inside.split(",")) {
        tok = tok.replaceAll("[^0-9\\\\-]", "");
        if (!tok.isEmpty()) numsList.add(Integer.parseInt(tok));
      }
    }
    int[] nums = numsList.stream().mapToInt(i -> i).toArray();
    Pattern tPat = Pattern.compile("target\\\\s*=\\\\s*(-?\\\\d+)", Pattern.CASE_INSENSITIVE);
    Matcher mt = tPat.matcher(raw);
    int target = 0;
    if (mt.find()) target = Integer.parseInt(mt.group(1));

    Solution sol = new Solution();
    int[] ans = sol.${method}(nums, target);

    System.out.print("[");
    for (int i = 0; i < ans.length; ++i) {
      if (i > 0) System.out.print(",");
      System.out.print(ans[i]);
    }
    System.out.println("]");
  }
}
`.trim();
    }

    case "python": {
      // Python harness: parse nums and target, call Solution().<method>(nums, target)
      return `
# ===== USER CODE START =====
${userCode}
# ===== USER CODE END =====

import sys, re, ast
raw = sys.stdin.read()

m = re.search(r'nums\\s*=\\s*(\\[[^\\]]*\\])', raw, flags=re.IGNORECASE)
nums = ast.literal_eval(m.group(1)) if m else []
mt = re.search(r'target\\s*=\\s*(-?\\d+)', raw, flags=re.IGNORECASE)
target = int(mt.group(1)) if mt else 0

sol = Solution()
res = sol.${method}(nums, target)
# normalize print for lists / tuples / ints
print(res)
`.trim();
    }

    case "c": {
      // For plain C we won't attempt to auto-call arbitrary signatures reliably.
      return `
#include <stdio.h>
#include <stdlib.h>

// ===== USER CODE START =====
${userCode}
// ===== USER CODE END =====

// Please provide a main() or adapt your C code to provide an entrypoint.
// Automatic LeetCode harnesses are not supported for C due to many ABI/input variations.
int main() { return 0; }
`.trim();
    }

    default:
      return userCode;
  }
}

async function handleSubmit() {
  if (submitting) return;
  setSubmitting(true);

  try {
   
    let userId =
      typeof window !== "undefined"
        ? localStorage.getItem("codeelysium_userId")
        : null;
    if (!userId && typeof window !== "undefined") {
    
      userId = `anon-${Math.random().toString(36).slice(2, 9)}`;
      try {
        localStorage.setItem("codeelysium_userId", userId);
      } catch (e) {
       
      }
    }
    userId = userId ?? "anon";

    const payload = {
      userId,
      problemId: problem.id,
      title: problem.title ?? null,
      language,
      code,
      
      result: runResult?.status ?? "NotRun",
      meta: {
        passed: runResult?.passed ?? null,
        total: runResult?.total ?? null,
        timeMs: runResult?.timeMs ?? null,
        memoryMB: runResult?.memoryMB ?? null,
      },
      createdAt: new Date().toISOString(),
    };

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // try to parse JSON response safely
    let json: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        json = await res.json();
      } catch (e) {
        // parsing failed
        json = null;
      }
    } else {
    
      try {
        const txt = await res.text();
        json = { message: txt };
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      const errMsg =
        json?.message || json?.error || `HTTP ${res.status} ${res.statusText}`;
      console.error("Submit failed:", errMsg);
      setRunResult((r) => ({
        ...(r ?? {}),
        message: `Submission failed: ${errMsg}`,
      } as any));
      return;
    }

    // success
    const insertedId = json?.id ?? json?._id ?? json?.insertedId ?? null;
    setRunResult((r) => ({
      ...(r ?? {}),
      message: insertedId
        ? `Submission saved (id: ${insertedId}).`
        : `Submission saved.`,
    } as any));

 
  } catch (err) {
    console.error("Submit error:", err);
    setRunResult((r) => ({
      ...(r ?? {}),
      message: `Submission error: ${(err as any)?.message ?? String(err)}`,
    } as any));
  } finally {
    setSubmitting(false);
  }
}


  const monacoZoom = useMonacoZoom(setShowAI, setInitialLucienQuery);

  const difficultyClass =
    problem.difficulty === "Easy"
      ? "border-emerald-500 text-emerald-300"
      : problem.difficulty === "Medium"
      ? "border-amber-500 text-amber-300"
      : "border-rose-500 text-rose-300";

  const [maximized, setMaximized] = useState<MaxKey>(null);
  const [editorScale, setEditorScale] = useState(1);
  const clampScale = (v: number) =>
    Math.min(1.25, Math.max(0.85, Number(v.toFixed(2))));
  const bumpScale = (dir: 1 | -1) =>
    setEditorScale((s) => clampScale(s + dir * 0.05));
  const resetScale = () => setEditorScale(1);

  const gidH = useId();
  const gidV = useId();

  return (
    <div className="fixed inset-0 bg-app">
      <div className="bg-aurora pointer-events-none" />
      <div className="bg-grid pointer-events-none" />

      <div className="h-full p-3">
        <PanelGroup
          direction="horizontal"
          className="h-full"
          storageKey={`ws-h-${problem.id}-${gidH}`}
        >
          {/* ── Description Panel ── */}
          {maximized !== "editor" && maximized !== "result" && (
            <>
              <Panel minSize={18} defaultSize={36} className="overflow-hidden">
                <div className="panel-card rounded-2xl h-full flex flex-col">
                  {/* Chrome */}
                  <div className="chrome px-4 py-2 flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => router.back()} className="btn-ghost text-xs">← Back</button>
                    <nav className="flex items-center gap-3 text-sm">
                      <span className="tab-active">Description</span>
                      <span className="tab">Editorial</span>
                      <span className="tab">Solutions</span>
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`badge ${difficultyClass}`}>{problem.difficulty}</span>
                      <button className="tool" title={maximized === "desc" ? "Restore" : "Maximize"}
                        onClick={() => setMaximized(m => m === "desc" ? null : "desc")}>⤢</button>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {/* Problem header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h1 className="text-lg font-bold text-white leading-tight">
                          {problem.number}. {problem.title}
                        </h1>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {problem.tags.map((t, i) => (
                            <span key={i} className="text-[10px] text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Platform badge */}
                    {(problem as any).platform && (
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Platform:</span>
                        <span className="text-xs font-semibold text-slate-300 bg-white/5 px-2 py-0.5 rounded">{(problem as any).platform}</span>
                      </div>
                    )}

                    {/* Problem statement */}
                    <div className="text-sm text-slate-300 leading-relaxed mb-6">
                      {problem.statement.content}
                    </div>

                    {/* Examples */}
                    <div className="mb-6 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Examples</h4>
                      {problem.statement.examples.map((ex: Example, i: number) => (
                        <div key={i} className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-4 font-mono text-xs">
                          <div className="mb-2">
                            <span className="text-slate-500">Input: </span>
                            <span className="text-emerald-300">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Output: </span>
                            <span className="text-amber-300">{ex.output}</span>
                          </div>
                          {ex.explanation && (
                            <div className="mt-2 text-slate-500">Explanation: {ex.explanation}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Constraints</h4>
                      <ul className="space-y-1.5">
                        {problem.statement.constraints.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-mono">
                            <span className="text-indigo-500 mt-0.5">▸</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Optimal Solution hint */}
                    {(problem as any).optimalSolution && (
                      <div className="rounded-xl bg-indigo-900/20 border border-indigo-500/20 p-4">
                        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">💡 Optimal Approach</h4>
                        <div className="flex gap-4 text-xs mb-2">
                          <span className="text-slate-500">Time: <span className="text-amber-400 font-mono">{(problem as any).optimalSolution.timeComplexity}</span></span>
                          <span className="text-slate-500">Space: <span className="text-emerald-400 font-mono">{(problem as any).optimalSolution.spaceComplexity}</span></span>
                        </div>
                        <p className="text-xs text-slate-400">{(problem as any).optimalSolution.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <Handle dir="horizontal" />
            </>
          )}

          {/* Right column: Editor / Results */}
          <Panel
            minSize={maximized ? 100 : 24}
            defaultSize={maximized ? 100 : 64}
            className="overflow-hidden"
          >
            <PanelGroup
              direction="vertical"
              className="h-full"
              storageKey={`ws-v-${problem.id}-${gidV}`}
            >
              {/* ===== EDITOR (single panel, no leftover space) ===== */}
              {maximized !== "desc" && (
                <>
                  <Panel
                    minSize={maximized === "editor" ? 100 : 30}
                    defaultSize={maximized === "editor" ? 100 : 62}
                    className="overflow-hidden"
                  >
                    <div
                      className="panel-card rounded-2xl h-full will-change-transform flex flex-col"
                      style={{
                        transform: `scale(${editorScale})`,
                        transformOrigin: "50% 0%",
                      }}
                      onWheel={(e) => {
                        if (e.altKey) {
                          e.preventDefault();
                          const dir: 1 | -1 = e.deltaY < 0 ? 1 : -1;
                          bumpScale(dir);
                        }
                      }}
                    >
                      {/* toolbar */}
                      <div className="chrome px-4 py-2 z-10 flex items-center gap-3">
                        <label className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="opacity-80">Language</span>
                          <select
                            className="select"
                            value={language}
                            onChange={(e) => onLangChange(e.target.value as Lang)}
                          >
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="c">C</option>
                          </select>
                        </label>

                        <div className="ml-3 flex items-center gap-2 text-xs text-slate-400">
                          <span>Font</span>
                          <button className="mini" onClick={() => monacoZoom.apply(monacoZoom.fontSize - 1)}>-</button>
                          <span className="w-8 text-center">{monacoZoom.fontSize}</span>
                          <button className="mini" onClick={() => monacoZoom.apply(monacoZoom.fontSize + 1)}>+</button>
                        </div>

                        <div className="ml-4 flex items-center gap-2 text-xs text-slate-400">
                          <span>Panel</span>
                          <button className="mini" onClick={() => setEditorScale((s) => clampScale(s - 0.05))}>-</button>
                          <span className="w-10 text-center">{Math.round(editorScale * 100)}%</span>
                          <button className="mini" onClick={() => setEditorScale((s) => clampScale(s + 0.05))}>+</button>
                          <button className="mini" onClick={resetScale} title="Reset scale">Reset</button>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={handleRun} disabled={loading} className="btn-primary">
                            {loading ? "Running…" : "Run"}
                          </button>
                          <button onClick={handleSubmit} disabled={loading} className="btn-success">
                            Submit
                          </button>
                          <button
                            onClick={() => setShowAI((v) => !v)}
                            className="btn-outline"
                            aria-pressed={showAI ? "true" : "false"}
                          >
                            AI Assistant
                          </button>
                          <button
                            className="tool"
                            title={maximized === "editor" ? "Restore" : "Maximize"}
                            onClick={() => setMaximized((m) => (m === "editor" ? null : "editor"))}
                          >
                            {maximized === "editor" ? "⤡" : "⤢"}
                          </button>
                        </div>
                      </div>

                      {/* Editor fills ALL remaining height */}
                     <div className="flex-1 min-h-0">
  <Editor
    path={`${unwrappedParams.id}.${language}`}     // ← stable model path per problem+language
    keepCurrentModel                       // ← prevents model churn on re-renders
    height="100%"
    theme="vs-dark"
    language={language}
    value={code}
    onChange={(v) => setCode(v ?? "")}
    onMount={(editor, monaco) => {
      pristineRef.current = true;
      monacoZoom.onMount(editor, monaco);  // ← your zoom hook (uses addCommand)
    }}
    options={{
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      tabSize: 2,
      mouseWheelZoom: false,               // we handle zoom via addCommand
    }}
  />
</div>
                    </div>
                  </Panel>

                  {maximized !== "editor" && <Handle dir="vertical" />}
                </>
              )}

              {/* Results */}
              {maximized !== "desc" && maximized !== "editor" && (
                <Panel minSize={16} defaultSize={38} className="overflow-hidden">
                  <div className="panel-card rounded-2xl h-full">
                    <div className="chrome px-4 py-2 flex items-center gap-4 text-sm text-slate-300">
                      <button onClick={handleRun} disabled={loading} className="btn-primary">
                        {loading ? "Running…" : "Run"}
                      </button>
                      <span className="text-slate-400">Testcase</span>
                      <div className="ml-auto">
                        <button className="tool" title="Maximize" onClick={() => setMaximized("result")}>
                          ⤢
                        </button>
                      </div>
                    </div>

                   

                    <div className="p-4">
                      {runResult ? (
                        <ResultPanel
  result={runResult}
  onAskAI={() => {
    setShowAI(true);
    setInitialLucienQuery(
      `Analyze complexity and improvements.\n\nLanguage: ${language}\n\nCode:\n${code}`
    );
  }}
/>
                      ) : (
                        <div className="text-xs text-slate-400">
                          Click <b>Run</b> to execute your code.
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {showAI && (
        <div className="absolute inset-y-0 right-0 z-20 w-[36%] min-w-[360px] panel-card rounded-l-2xl overflow-hidden">
          <AIDrawer
  problem={problem}
  initialQuery={initialLucienQuery}   // <-- pass selected code here
  onClose={() => setShowAI(false)}
/>

        </div>
      )}

      {/* ===== Styles ===== */}
      <style jsx global>{`
        .bg-app {
          background: radial-gradient(1200px 480px at 70% -8%, rgba(124,58,237,0.12), transparent),
                      radial-gradient(900px 360px at 15% 108%, rgba(59,130,246,0.10), transparent),
                      #070b1a;
        }
        .bg-grid::before {
          content: "";
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px);
          background-size: 36px 36px, 36px 36px;
          mask-image: radial-gradient(ellipse at 60% -20%, black 30%, transparent 70%);
          pointer-events: none;
        }
        .bg-aurora::before {
          content: "";
          position: absolute; inset: -20%;
          background:
            conic-gradient(from 180deg at 60% 40%, rgba(99,102,241,0.18), transparent 40%),
            radial-gradient(40% 30% at 70% 10%, rgba(56,189,248,0.15), transparent 60%),
            radial-gradient(35% 28% at 20% 100%, rgba(16,185,129,0.12), transparent 60%);
          filter: blur(32px);
          animation: floaty 18s linear infinite alternate;
        }
        @keyframes floaty {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          100% { transform: translateY(-24px) translateX(12px) scale(1.05); }
        }

        .panel-card {
          background: rgba(10, 14, 30, 0.92);
          border: 1px solid rgba(71, 85, 105, 0.45);
          box-shadow:
            0 8px 28px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(6px);
          transition: box-shadow 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .panel-card:hover {
          border-color: rgba(129, 140, 248, 0.55);
          box-shadow:
            0 12px 36px rgba(99, 102, 241, 0.12),
            0 8px 22px rgba(0, 0, 0, 0.35);
        }
        .chrome {
          background: rgba(11, 16, 34, 0.78);
          border-bottom: 1px solid rgba(71, 85, 105, 0.55);
          backdrop-filter: blur(8px);
        }
        .tab { color: #94a3b8; }
        .tab-active { color: #e2e8f0; font-weight: 600; }
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 2px 8px; border-radius: 999px; border-width: 1px;
          font-size: 10px; letter-spacing: .02em; text-transform: uppercase;
        }

        .btn-primary {
          background: rgba(99,102,241,0.95);
          color: white; padding: 6px 12px; border-radius: 10px;
          border: 1px solid rgba(129,140,248,.35);
          box-shadow: 0 6px 18px rgba(99,102,241,.28);
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .btn-primary:hover { background: rgba(99,102,241,0.9); box-shadow: 0 8px 22px rgba(99,102,241,.35); }
        .btn-primary:active { transform: translateY(1px) scale(.99); }

        .btn-success {
          background: rgba(16,185,129,.95);
          color: white; padding: 6px 12px; border-radius: 10px;
          border: 1px solid rgba(16,185,129,.35);
          box-shadow: 0 6px 18px rgba(16,185,129,.28);
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .btn-success:hover { background: rgba(16,185,129,.9); box-shadow: 0 8px 22px rgba(16,185,129,.35); }
        .btn-success:active { transform: translateY(1px) scale(.99); }

        .btn-outline {
          background: transparent; color: #e5e7eb; padding: 6px 12px; border-radius: 10px;
          border: 1px solid rgba(71,85,105,.7);
        }
        .btn-ghost {
          padding: 6px 10px; font-size: 12px; color: #c7d2fe;
          border: 1px solid rgba(129,140,248,.25);
          border-radius: 8px; background: rgba(29, 33, 58, 0.35);
        }
        .tool {
          padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(71,85,105,.6);
          color: #94a3b8; background: rgba(15,23,42,.3);
        }
        .mini {
          padding: 2px 8px; border-radius: 8px;
          border: 1px solid rgba(71,85,105,.6);
          background: rgba(2,6,23,.4); color: #cbd5e1;
        }
        .select {
          border: 1px solid rgba(71,85,105,.7);
          background: rgba(2,6,23,.7);
          color: #e2e8f0; border-radius: 8px; padding: 6px 8px;
        }

        .split-handle {
          position: relative;
          background: transparent !important;
          flex: 0 0 8px;
          z-index: 5;
        }
        .split-handle[data-direction="horizontal"] { cursor: col-resize; }
        .split-handle[data-direction="vertical"] { cursor: row-resize; }
        .split-handle:hover::after {
          content: ""; position: absolute; inset: 0;
          box-shadow: 0 0 0 1px rgba(99,102,241,.25) inset;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}


/* ----------------- AI Drawer ----------------- */
function AIDrawer({
  problem,
  initialQuery = "",
  onClose,
}: {
  problem: Problem;
  initialQuery?: string;   // <-- new prop
  onClose: () => void;
}) {
  const [q, setQ] = useState(initialQuery);   // <-- start with initialQuery
  const [msgs, setMsgs] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >(
    initialQuery
      ? [
          { role: "user", text: initialQuery },
          { role: "assistant", text: "Okay, let’s talk about this part of your code." },
        ]
      : [
          { role: "assistant", text: "Hi! Ask me about approach, time/space, or hints for this problem." },
        ]
  );


  function ask() {
    if (!q.trim()) return;
    const lower = q.toLowerCase();
    const answer =
      lower.includes("time") || lower.includes("space")
        ? "Rule of thumb: derive time from loops and DS operations; space from extra containers."
        : "From constraints choose O(n log n) or better; try hashing, two pointers, or binary search.";
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "assistant", text: answer }]);
    setQ("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between chrome p-3">
        <button onClick={onClose} className="btn-ghost">← Back</button>
        <div className="text-sm font-semibold text-slate-200">
          AI Assistant • {problem.title}
        </div>
        <div className="w-[56px]" />
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3 text-sm">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`rounded px-3 py-2 ${
              m.role === "assistant" ? "bg-slate-900/80" : "bg-indigo-900/40"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-800/70 p-3 bg-slate-900/60">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about approach or complexity…"
          className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-700
                     focus:border-indigo-600 text-slate-200"
        />
        <button onClick={ask} className="btn-primary">Ask</button>
      </div>
    </div>
  );
}
