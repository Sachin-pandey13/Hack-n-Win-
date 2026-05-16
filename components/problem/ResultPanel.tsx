// components/problem/ResultPanel.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

/* ---------------- types ---------------- */

type CaseResult = {
  input: string;
  expected?: string;
  output?: string;
  passed: boolean;
  timeMs?: number;
  memoryMB?: number;
  error?: { line?: number; message: string };
};

type Complexity = {
  time?: string;
  space?: string;
  series?: { n: number; ops: number }[];
};

type AnalysisError = {
  type?: string;
  message: string;
  line?: number | null;
  snippet?: string | null;
};

type AnalysisResult = {
  summary?: string | null;
  complexity?: {
    time?: string | null;
    space?: string | null;
    series?: { n: number; ops: number }[] | null;
  } | null;
  errors?: AnalysisError[] | null;
  suggestions?: string[] | null;
};

export type RunResult = {
  status:
    | "Accepted"
    | "Wrong Answer"
    | "Compilation Error"
    | "Runtime Error"
    | "Error"
    | "";
  passed: number;
  total: number;
  timeMs?: number;
  memoryMB?: number;
  message?: string;
  cases: CaseResult[];
  complexity?: Complexity;
  optimal?: Complexity;
  isOptimal?: boolean;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  analysis?: AnalysisResult | null;
};

/* ---------------- helpers ---------------- */

function normalizeBigO(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/(?:O|o|Θ|Theta|theta)\s*\(\s*([^)]+)\s*\)/i);
  if (m) return `O(${m[1].replace(/\s+/g, "")})`;
  const plain = t.replace(/\s+/g, " ").replace(/^[\s:]+|[\s.]+$/g, "");
  if (plain.length) return `O(${plain})`;
  return null;
}

function bigOEquals(a?: string | null, b?: string | null) {
  const A = normalizeBigO(a);
  const B = normalizeBigO(b);
  if (!A && !B) return true;
  return A === B;
}

function generateSeriesFromBigO(label?: string | null) {
  const L = normalizeBigO(label);
  if (!L) return [];
  const ns = [8, 16, 32, 64, 128, 256];
  let fn: (n: number) => number;
  if (/n\^3|n\*n\*n/i.test(L)) fn = (n) => Math.pow(n, 3);
  else if (/n\^2|n\*n/i.test(L)) fn = (n) => Math.pow(n, 2);
  else if (/nlogn|n\s*log\s*n|n\*\s*log/i.test(L)) fn = (n) => n * Math.log2(Math.max(2, n));
  else if (/logn|log2n/i.test(L) && !/nlogn/i.test(L)) fn = (n) => Math.log2(Math.max(2, n));
  else if (/2\^n|\^n|exp/i.test(L) || /2\^/i.test(L)) fn = (n) => Math.pow(2, Math.min(n, 20));
  else if (/n/i.test(L)) fn = (n) => n;
  else if (/1|constant/i.test(L)) fn = () => 1;
  else fn = (n) => n;
  const raw = ns.map((n) => ({ n, ops: Math.max(1, fn(n)) }));
  const maxOps = Math.max(...raw.map((r) => r.ops));
  const scale = maxOps > 0 ? Math.pow(maxOps, 0.3) : 1;
  return raw.map((r) => ({ n: r.n, ops: r.ops / scale }));
}

/* Parse common compiler error formats (GCC/Clang/MSVC-ish) to produce line-aware messages.
   This is a best-effort extractor; if it can't find anything, it returns an empty array
   (caller may then call AI analyze endpoint).
*/
function parseCompileOutputForErrors(compileOutput?: string | null): AnalysisError[] {
  if (!compileOutput) return [];
  const lines = String(compileOutput).split(/\r?\n/).slice(0, 300);
  const out: AnalysisError[] = [];
  // patterns:
  // file.cpp:12:34: error: message
  const regex1 = /(?:[^:\n]+):(\d+):(?:(\d+):)?\s*(error|fatal error|warning|note)[:\s-]*(.*)$/i;
  // some MSVC: file.cpp(12): error C2143: ...
  const regex2 = /(?:[^()\r\n]+)\((\d+)\)\s*:\s*(error|warning|note)\s*[:\s-]*(.*)$/i;
  for (const line of lines) {
    let m = line.match(regex1);
    if (m) {
      out.push({ type: m[3] ?? "error", message: (m[4] ?? line).trim(), line: Number(m[1]), snippet: null });
      continue;
    }
    m = line.match(regex2);
    if (m) {
      out.push({ type: m[2] ?? "error", message: (m[3] ?? line).trim(), line: Number(m[1]), snippet: null });
      continue;
    }
    // fallback simple "error: message"
    const simple = line.match(/\b(error|fatal|exception)\b[:\s-]*(.+)$/i);
    if (simple) {
      out.push({ type: simple[1], message: (simple[2] ?? line).trim(), line: null, snippet: null });
      continue;
    }
  }
  return out;
}

/* ---------------- Component ---------------- */

export default function ResultPanel({
  result,
  onAskAI,
  problemId: propProblemId,
}: {
  result?: RunResult | null;
  onAskAI?: () => void;
  problemId?: string | null;
}) {
  const r = result ?? null;

  // derive problem id if not passed (helpful)
  const [derivedProblemId, setDerivedProblemId] = useState<string | null>(null);
  useEffect(() => {
    if (propProblemId) {
      setDerivedProblemId(null);
      return;
    }
    try {
      if (typeof window !== "undefined" && window.location?.pathname) {
        const parts = window.location.pathname.split("/").filter(Boolean);
        const i = parts.indexOf("problems");
        if (i >= 0 && parts.length > i + 1) setDerivedProblemId(parts[parts.length - 1]);
        else if (parts.length > 0) setDerivedProblemId(parts[parts.length - 1]);
        else setDerivedProblemId(null);
      }
    } catch {
      setDerivedProblemId(null);
    }
  }, [propProblemId]);

  const effectiveProblemId = propProblemId ?? derivedProblemId ?? null;

  // fetch problem (used as fallback for examples/testcases)
  const [problem, setProblem] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!effectiveProblemId) {
      setProblem(null);
      return;
    }
    fetch(`/api/problems/${encodeURIComponent(effectiveProblemId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((j) => {
        if (mounted) setProblem(j);
      })
      .catch(() => {
        if (mounted) setProblem(null);
      });
    return () => {
      mounted = false;
    };
  }, [effectiveProblemId]);

  // wrapper ref for scrolling
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // compute a bottom offset so panel height = viewport - offset (keeps height consistent with editor)
  const [bottomOffset, setBottomOffset] = useState<number>(160);
  useEffect(() => {
    function compute() {
      try {
        let topH = 0;
        const header = document.querySelector("header");
        const editor = document.querySelector(".monaco-editor, .editor-container");
        if (header instanceof HTMLElement) topH += header.getBoundingClientRect().height;
        if (editor instanceof HTMLElement) topH += editor.getBoundingClientRect().height;
        if (topH < 100) topH = 300;
        if (topH > window.innerHeight - 140) topH = Math.max(220, window.innerHeight - 140);
        setBottomOffset(Math.round(topH));
      } catch {
        setBottomOffset(160);
      }
    }
    compute();
    window.addEventListener("resize", compute);
    const t = setTimeout(compute, 450);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", compute);
    };
  }, []);

  // If no run yet:
  if (!r) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-slate-300">
        <h3 className="text-lg font-semibold mb-1">Result</h3>
        <p className="text-sm text-slate-400">Run your code to see results here.</p>
      </div>
    );
  }

  // Build graph data (priority: r.complexity.series -> r.analysis.complexity.series -> generated)
  const graphData = useMemo(() => {
    if (Array.isArray(r.complexity?.series) && r.complexity.series.length > 0) {
      return r.complexity.series.map((s) => ({ n: Number(s.n), ops: Number(s.ops) }));
    }
    if (Array.isArray(r.analysis?.complexity?.series) && r.analysis!.complexity!.series!.length > 0) {
      return r.analysis!.complexity!.series!.map((s: any) => ({ n: Number(s.n), ops: Number(s.ops) }));
    }
    if (r.complexity?.time) return generateSeriesFromBigO(r.complexity.time);
    if (r.analysis?.complexity?.time) return generateSeriesFromBigO(r.analysis.complexity!.time ?? null);
    return [];
  }, [r]);

  // measured complexities prefer analysis
  const fetchedTime = r.analysis?.complexity?.time ?? r.complexity?.time ?? null;
  const fetchedSpace = r.analysis?.complexity?.space ?? r.complexity?.space ?? null;

  // optimal comparison
  const optimalTime = r.optimal?.time ?? null;
  const optimalSpace = r.optimal?.space ?? null;
  const timeMatches = bigOEquals(fetchedTime, optimalTime);
  const spaceMatches = bigOEquals(fetchedSpace, optimalSpace);
  const isOptimal = typeof r.isOptimal === "boolean" ? r.isOptimal : timeMatches && spaceMatches;
  const hasOptimalInDb = !!(r.optimal && (r.optimal.time || r.optimal.space));
  const showVerdictOnlyWhenMismatch = hasOptimalInDb && !isOptimal;

  // Build display cases: priority r.cases -> problem examples -> none (no hard-coded fallback)
  const displayCases: CaseResult[] = useMemo(() => {
    if (Array.isArray(r.cases) && r.cases.length > 0) return r.cases;
    if (problem?.statement?.examples && Array.isArray(problem.statement.examples) && problem.statement.examples.length > 0) {
      return problem.statement.examples.map((ex: any) => ({
        input: ex.input ?? ex.stdin ?? "",
        expected: ex.output ?? ex.expected ?? "",
        output: undefined,
        passed: false,
      }));
    }
    return [];
  }, [r.cases, problem]);

  // local parse of compile output
  const parsedCompileErrors = useMemo(() => {
    const out: AnalysisError[] = [];
    if (r.compile_output) out.push(...parseCompileOutputForErrors(r.compile_output));
    if (r.stderr) out.push(...parseCompileOutputForErrors(r.stderr));
    // include any analysis.errors returned by server
    if (r.analysis?.errors) out.push(...(r.analysis.errors as AnalysisError[]));
    return out;
  }, [r.compile_output, r.stderr, r.analysis]);

  // Y-domain for chart
  const yDomain = useMemo(() => {
    if (!graphData || graphData.length === 0) return undefined;
    const ops = graphData.map((d) => Number(d.ops) || 0);
    const maxOps = Math.max(...ops, 1);
    const minOps = Math.min(...ops, 0);
    const pad = Math.max(1, Math.round((maxOps - minOps) * 0.08));
    return [Math.max(0, minOps - pad), maxOps + pad];
  }, [graphData]);

  // ------------------ Automatic AI analyze on compile/runtime output ------------------
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // If compile_output or stderr exists AND no analysis provided by server, call /api/analyze
  useEffect(() => {
    let aborted = false;
    async function runAnalyze() {
      if (isAnalyzing) return;
      // don't re-run if server already returned analysis
      if (r.analysis && (r.analysis.errors || r.analysis.suggestions || r.analysis.complexity)) return;
      // only call analyze when we have some runner output to explain
      if (!r.compile_output && !r.stderr && !r.stdout) return;
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
        const payload = {
          compile_output: r.compile_output ?? "",
          stderr: r.stderr ?? "",
          stdout: r.stdout ?? "",
          problemId: effectiveProblemId ?? null,
        };
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          // fail gracefully and keep parsed local errors
          const text = await res.text().catch(() => "");
          if (!aborted) setAnalysisError(`Analyze API error: ${res.status} ${text}`);
          setIsAnalyzing(false);
          return;
        }
        const json = await res.json().catch(() => null);
        if (!json || aborted) {
          setIsAnalyzing(false);
          return;
        }
        // Expected response shape: { analysis: { errors: [...], suggestions: [...], complexity: {...} } }
        // We'll merge it into an ephemeral area by setting r.analysis if server returned it.
        // BUT since result object is external and likely immutable, we cannot mutate it here safely.
        // Instead, we store analysis into local state and display it (fall back to r.analysis if present).
        if (!aborted && json.analysis) {
          // merge: if r.analysis is empty use returned value, else prefer r.analysis
          // We'll copy into local state by calling setLocalAnalysis below
          setLocalAnalysis(json.analysis as AnalysisResult);
        }
      } catch (err: any) {
        if (!aborted) setAnalysisError(String(err?.message ?? err ?? "Analyze request failed"));
      } finally {
        if (!aborted) setIsAnalyzing(false);
      }
    }

    runAnalyze();
    return () => {
      aborted = true;
    };
    // we intentionally only rerun when compile_output/stderr/stdout changes
  }, [r.compile_output, r.stderr, r.stdout, effectiveProblemId]);

  const [localAnalysis, setLocalAnalysis] = useState<AnalysisResult | null>(null);
  // prefer server-provided r.analysis, then localAnalysis
  const effectiveAnalysis = r.analysis ?? localAnalysis ?? null;

  // make sure scrollbar works after heavy content changes: attempt to repair overflow and reset minor style issues
  useEffect(() => {
    try {
      if (wrapRef.current) {
        wrapRef.current.style.overflowY = "auto";
        // ensure scrollable if content taller than container
        // don't force scrollTop reset for usability, but ensure scrollbars are usable
        // small hack: trigger reflow on the wrapper to ensure browser updates scrollbar
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        wrapRef.current.getBoundingClientRect();
      }
    } catch {
      // no-op
    }
  }, [r, effectiveAnalysis, displayCases.length]);

  /* ---------------- Render ---------------- */
  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-200 shadow-xl" style={{ perspective: 1400 }}>
      <style>{`
        .result-scroll { overflow:auto; -webkit-overflow-scrolling: touch; }
        .result-scroll::-webkit-scrollbar { width:10px; height:10px; }
        .result-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius:6px; }
        .complex-label { font-family: monospace; font-weight: bold; font-size: 18px; text-align:center; margin-bottom:6px; color: #a78bfa; }
        pre.compact { max-height: 300px; overflow:auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
        @media (max-width: 900px) {
          .result-grid { grid-template-columns: 1fr; }
          .chart-h { height: 220px; }
        }
        
        .syntax-error-block {
          background: #1e1e2e;
          border-left: 4px solid #f43f5e;
          border-radius: 6px;
          overflow: hidden;
        }
        .syntax-error-header {
          background: rgba(244, 63, 94, 0.1);
          padding: 8px 12px;
          border-bottom: 1px solid rgba(244, 63, 94, 0.2);
          font-weight: 600;
          color: #fca5a5;
        }
        .syntax-error-body {
          padding: 12px;
          color: #e2e8f0;
        }
      `}</style>

      <div style={{ height: `calc(100vh - ${bottomOffset}px)`, display: "flex", flexDirection: "column" }}>
        <div ref={wrapRef} className="result-scroll rounded-lg pr-2" style={{ flex: 1, paddingRight: 8 }}>
          {/* top status line */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${
              r.status === "Accepted" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
              r.status === "Wrong Answer" ? "bg-rose-500/20 text-rose-300 border-rose-500/40" :
              "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}>{r.status || "—"}</span>

            <span className="text-xs text-slate-400">{r.passed}/{r.total} test(s) passed</span>

            <div className="ml-auto text-xs text-slate-400" style={{ display: "flex", gap: 16 }}>
              {typeof r.timeMs === "number" && <span>Time: {Math.round(r.timeMs)} ms</span>}
              {typeof r.memoryMB === "number" && <span>Memory: {Math.round(r.memoryMB)} MB</span>}
            </div>
          </div>

          {/* Testcases */}
          <div className="mb-4">
            <div className="text-xs uppercase text-slate-400 mb-2">Testcases</div>
            {displayCases.length === 0 ? (
              <div className="rounded border p-3 text-sm border-slate-700 bg-slate-900/20 text-slate-400">
                <div className="font-medium">No testcases available</div>
                <div className="mt-1 text-xs">The run returned no testcases and no examples were found for this problem.</div>
                {effectiveProblemId && <div className="mt-1 text-xs">Tried fetching: <code>{effectiveProblemId}</code></div>}
              </div>
            ) : (
              <div className="space-y-3">
                {displayCases.map((c, i) => {
                  const ok = !!c.passed;
                  return (
                    <div key={i} className={`rounded border p-3 text-sm ${
                      ok ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-200" : "border-rose-700/40 bg-rose-900/20 text-rose-200"
                    }`}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div className="font-medium">Case {i + 1}</div>
                        <div className="text-xs opacity-80" style={{ textAlign: "right" }}>
                          {typeof c.timeMs === "number" && <div style={{ marginBottom: 6 }}>⏱ {Math.round(c.timeMs)} ms</div>}
                          {typeof c.memoryMB === "number" && <div>🧠 {Math.round(c.memoryMB)} MB</div>}
                        </div>
                      </div>

                      <div className="mt-1 text-slate-300/90">
                        <div><span className="text-slate-400">Input:</span> {c.input}</div>
                        {"expected" in c && <div><span className="text-slate-400">Expected:</span> {` ${c.expected}`}</div>}
                        {"output" in c && <div><span className="text-slate-400">Output:</span> {` ${c.output ?? ""}`}</div>}
                      </div>

                      {!ok && c.error && <div className="mt-2 text-rose-200/90">{typeof c.error.line === "number" && <b>Line {c.error.line}:</b>} {c.error.message}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Runner / Compile output + parsed errors */}
          {(parsedCompileErrors.length > 0 || r.compile_output || r.stderr || r.stdout) && (
            <div className="mb-4">
              <div className="text-xs uppercase text-slate-400 mb-2">Runner / Compile Output</div>
              <div className="space-y-2">
                {parsedCompileErrors.map((e, idx) => (
                  <div key={idx} className="syntax-error-block text-sm mb-3">
                    <div className="syntax-error-header flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="capitalize">{e.type ?? "Compilation Error"}</span>
                      </div>
                      {e.line != null && <span className="font-mono text-xs bg-rose-950 px-2 py-0.5 rounded text-rose-300">Line {e.line}</span>}
                    </div>
                    <div className="syntax-error-body">
                      <div className="font-mono text-xs mb-2 leading-relaxed">{e.message}</div>
                      {e.snippet && (
                        <div className="mt-3 bg-black/40 rounded-md p-3 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/60 border-r border-white/5 rounded-l-md flex items-center justify-center text-xs text-slate-600 font-mono">
                            {e.line}
                          </div>
                          <pre className="text-xs pl-8 font-mono text-rose-200 overflow-x-auto">{e.snippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {r.compile_output && (
                  <div className="rounded border border-rose-700/40 bg-rose-900/10 p-3 text-sm text-rose-200">
                    <div style={{ fontWeight: 600 }}>Compile output</div>
                    <pre className="mt-1 text-xs bg-slate-800 p-2 rounded text-slate-200 compact">{r.compile_output}</pre>
                  </div>
                )}

                {r.stderr && (
                  <div className="rounded border border-rose-700/40 bg-rose-900/10 p-3 text-sm text-rose-200">
                    <div style={{ fontWeight: 600 }}>Stderr</div>
                    <pre className="mt-1 text-xs bg-slate-800 p-2 rounded text-slate-200 compact">{r.stderr}</pre>
                  </div>
                )}

                {r.stdout && (
                  <div className="rounded border border-slate-700/40 bg-slate-900/10 p-3 text-sm text-slate-200">
                    <div style={{ fontWeight: 600 }}>Stdout</div>
                    <pre className="mt-1 text-xs bg-slate-800 p-2 rounded text-slate-200 compact">{r.stdout}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI analysis (from server / localAnalysis) */}
          {isAnalyzing && (
            <div className="mb-4 rounded border border-slate-700/30 bg-slate-900/10 p-3 text-sm text-slate-300">
              Running AI analysis...
            </div>
          )}

          {analysisError && (
            <div className="mb-4 rounded border border-rose-700/40 bg-rose-900/10 p-3 text-sm text-rose-200">
              <div style={{ fontWeight: 600 }}>Analysis Error</div>
              <div className="mt-1 text-xs">{analysisError}</div>
            </div>
          )}

          {effectiveAnalysis && (
            <div className="mb-4">
              <div className="text-xs uppercase text-slate-400 mb-2">AI Analysis</div>

              {effectiveAnalysis.summary && (
                <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200 mb-2">
                  <div style={{ fontWeight: 600 }}>Summary</div>
                  <div className="mt-1 text-slate-300">{effectiveAnalysis.summary}</div>
                </div>
              )}

              {effectiveAnalysis.errors && effectiveAnalysis.errors.length > 0 && (
                <div className="space-y-2 mb-2">
                  {effectiveAnalysis.errors.map((e, idx) => (
                    <div key={idx} className="rounded border border-rose-700/40 bg-rose-900/10 p-3 text-sm text-rose-200">
                      <div style={{ fontWeight: 600 }}>{e.type ?? "Issue"}{typeof e.line === "number" ? ` — line ${e.line}` : ""}</div>
                      <div className="mt-1 text-slate-300">{e.message}</div>
                      {e.snippet && <pre className="mt-2 text-xs bg-slate-800 p-2 rounded text-slate-200">{e.snippet}</pre>}
                    </div>
                  ))}
                </div>
              )}

              {effectiveAnalysis.suggestions && effectiveAnalysis.suggestions.length > 0 && (
                <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200 mb-2">
                  <div style={{ fontWeight: 600 }}>Suggestions</div>
                  <ul className="mt-1 text-slate-300 list-disc pl-5">
                    {effectiveAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {effectiveAnalysis.complexity && (effectiveAnalysis.complexity.time || effectiveAnalysis.complexity.space) && (
                <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200">
                  <div style={{ fontWeight: 600 }}>AI Estimated Complexity</div>
                  <div className="mt-1 text-slate-300">Time: {effectiveAnalysis.complexity.time ?? "—"}</div>
                  <div className="text-slate-300">Space: {effectiveAnalysis.complexity.space ?? "—"}</div>
                </div>
              )}
            </div>
          )}

          {/* Measured complexity + verdict */}
          <div className="grid result-grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
            <div className="rounded border border-slate-800 bg-slate-900/40 p-3">
              <div className="text-xs text-slate-400 mb-1">Measured Complexity</div>
              <div>Time: {fetchedTime ?? "—"}</div>
              <div>Space: {fetchedSpace ?? "—"}</div>
            </div>

            {showVerdictOnlyWhenMismatch ? (
              <div className="rounded border p-3 border-amber-700/40 bg-amber-900/20 text-amber-200">
                <div className="text-xs text-slate-400 mb-1">Verdict</div>
                <div>⚠️ You can optimize the solution.</div>
                <div className="text-xs mt-1 text-slate-300">
                  {!timeMatches && <div>- Time: measured {fetchedTime ?? "—"}, optimal {optimalTime ?? "—"}</div>}
                  {!spaceMatches && <div>- Space: measured {fetchedSpace ?? "—"}, optimal {optimalSpace ?? "—"}</div>}
                </div>
              </div>
            ) : hasOptimalInDb ? (
              <div className="rounded border p-3 border-emerald-700/40 bg-emerald-900/20 text-emerald-200">
                <div className="text-xs text-slate-400 mb-1">Verdict</div>
                <div>✅ Measured complexity matches stored optimal complexity.</div>
              </div>
            ) : (
              <div className="rounded border p-3 border-slate-700/20 bg-slate-900/20 text-slate-300">
                <div className="text-xs text-slate-400 mb-1">Verdict</div>
                <div>ℹ️ No optimal complexity stored in DB for this problem.</div>
              </div>
            )}
          </div>

          {/* Graph */}
          {graphData.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#0f141e] p-5 mb-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-300">Time Complexity Analysis</div>
                  <div className="text-xs text-slate-500 mt-0.5">Estimated performance over n inputs</div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  {normalizeBigO(r.complexity?.time ?? r.analysis?.complexity?.time) ?? "O(n)"}
                </div>
              </div>
              
              <div className="chart-h relative z-10" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis 
                      dataKey="n" 
                      stroke="#64748b" 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickFormatter={(val) => `n=${val}`}
                    />
                    <YAxis 
                      domain={yDomain} 
                      stroke="#64748b" 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      formatter={(value: any) => [Math.round(value), 'Operations']}
                      labelFormatter={(label: any) => `Input Size (n) = ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ops" 
                      stroke="#818cf8" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorOps)" 
                      activeDot={{ r: 6, fill: "#818cf8", stroke: "#1e293b", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {onAskAI && (
            <div style={{ paddingTop: 8 }}>
              <button onClick={onAskAI} className="mt-2 w-full rounded-lg bg-purple-600 px-3 py-2 font-medium hover:bg-purple-500" type="button">
                Ask AI to Analyze (manual)
              </button>
            </div>
          )}

          <div style={{ height: 12 }} />
        </div>
      </div>
    </div>
  );
}
