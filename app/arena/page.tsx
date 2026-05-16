"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { PROBLEMS } from "@/lib/problem";
import type { Problem, Example } from "@/types/problem";
import { runCodeOnServerMock } from "@/lib/judge";

// Import your existing multiverse wrapper (assumed to be a 3D background component)
import MultiverseWrapper from "@/components/arena/MultiverseWrapper";

/* ────────────────────────────────────────────────────────────────────────────
   TYPES / DATA / TEMPLATES
──────────────────────────────────────────────────────────────────────────── */
type Phase = "lobby" | "matchmaking" | "rules" | "playing" | "eliminated" | "result";
type Lang = "cpp" | "java" | "python" | "c";
type Locale = "en" | "hi";

const TEMPLATES: Record<Lang, string> = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    // write methods here\n};\n\nint main(){\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}\n`,
  java: `import java.util.*;\n\nclass Solution {\n    // write methods here\n}\n\npublic class Main {\n    public static void main(String[] args){\n    }\n}\n`,
  python: `class Solution:\n    # write methods here\n    pass\n\nif __name__ == "__main__":\n    pass\n`,
  c: `#include <stdio.h>\n\nint main(){\n    // write your C solution here\n    return 0;\n}\n`,
};

const OPPONENT_POOL = [
  { name: "NebulaFox", rating: 1720, avatar: "🦊" },
  { name: "BitWizard", rating: 1612, avatar: "🧙" },
  { name: "StackSamurai", rating: 1890, avatar: "⚔️" },
  { name: "AlgoNinja", rating: 1774, avatar: "🥷" },
];

/* ────────────────────────────────────────────────────────────────────────────
   PAGE COMPONENT
──────────────────────────────────────────────────────────────────────────── */
export default function ArenaPage() {
  const [locale, setLocale] = useState<Locale>("en");

  // Phases
  const [phase, setPhase] = useState<Phase>("lobby");
  // Hardcoded online count to avoid fake jumping numbers
  const online = 1240;

  // Battle state
  const [language, setLanguage] = useState<Lang>("cpp");
  const [code, setCode] = useState<string>(TEMPLATES.cpp);
  const [fontSize, setFontSize] = useState(14);
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [countdown, setCountdown] = useState<number>(6);
  const [opponent, setOpponent] = useState<{ name: string; rating: number, avatar: string } | null>(null);

  // Problems
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(new Array(10).fill(false));
  const [opponentSolved, setOpponentSolved] = useState<boolean[]>(new Array(10).fill(false));

  // UX & guards
  const [resultMsg, setResultMsg] = useState<string>("");
  const eliminatedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Static leaderboard (no fake jumping data)
  const [leaderboard] = useState([
    { name: "StackSamurai", rating: 1890 },
    { name: "MonoidMage", rating: 1833 },
    { name: "AlgoNinja", rating: 1774 },
    { name: "NebulaFox", rating: 1720 },
    { name: "BitWizard", rating: 1612 },
  ]);

  const drawProblems = useCallback(() => {
    const pool = PROBLEMS && PROBLEMS.length ? [...PROBLEMS] : [];
    const picks: Problem[] = [];
    for (let i = 0; i < 3; i++) {
      if (pool.length) {
        const k = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(k, 1)[0]);
      }
    }
    setProblems(picks);
  }, []);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen denied", err);
    }
  };

  const startMatchmaking = async () => {
    await requestFullscreen();
    drawProblems();
    setPhase("matchmaking");
    setTimeout(() => {
      const pick = OPPONENT_POOL[Math.floor(Math.random() * OPPONENT_POOL.length)];
      setOpponent(pick);
      setPhase("rules");
    }, 2000 + Math.random() * 1500);
  };

  // Rules -> playing countdown
  useEffect(() => {
    if (phase !== "rules") return;
    setCountdown(6);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase("playing");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Deterministic opponent solves to avoid 'fake' random behavior. 
  // Opponent solves problem 0 at 3 mins remaining, and problem 1 at 1 min remaining.
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft === 3 * 60) {
      setOpponentSolved(prev => { const n = [...prev]; n[0] = true; return n; });
    }
    if (timeLeft === 1 * 60) {
      setOpponentSolved(prev => { const n = [...prev]; n[1] = true; return n; });
    }
  }, [timeLeft, phase]);
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Anti-Cheat Mechanisms
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && phase === "playing" && !eliminatedRef.current) {
        setWarnings(prev => [...prev, "Exited Fullscreen!"]);
        eliminate("You exited fullscreen mode.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && phase === "playing" && !eliminatedRef.current) {
        setWarnings(prev => [...prev, "Tab switched!"]);
        eliminate("Window/Tab switched during the battle.");
      }
    };

    const handleBlur = () => {
      if (phase === "playing" && !eliminatedRef.current) {
        setWarnings(prev => [...prev, "Focus lost!"]);
        eliminate("Window focus was lost.");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      if (phase === "playing") {
        e.preventDefault();
        setWarnings(prev => [...prev, "Copy/Paste is blocked!"]);
        // Flash warning
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [phase]);

  function eliminate(reason: string) {
    eliminatedRef.current = true;
    setPhase("eliminated");
    setResultMsg(`Eliminated: ${reason}`);
  }

  const solvedCount = useMemo(() => solved.filter(Boolean).length, [solved]);
  const oppSolvedCount = useMemo(() => opponentSolved.filter(Boolean).length, [opponentSolved]);

  function endGame() {
    if (phase === "result" || phase === "eliminated") return;
    const msg =
      solvedCount > oppSolvedCount ? "VICTORY!" : solvedCount < oppSolvedCount ? "DEFEAT." : "DRAW.";
    setResultMsg(msg);
    setPhase("result");
  }

  async function handleSubmitSolution() {
    const p = problems[currentIdx];
    try {
      // Mock validation
      setTimeout(() => {
        setSolved((arr) => {
          const next = [...arr];
          next[currentIdx] = true;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Submission failed", err);
    }
  }

  // Clear warnings after 3s
  useEffect(() => {
    if (warnings.length > 0) {
      const timer = setTimeout(() => setWarnings(w => w.slice(1)), 3000);
      return () => clearTimeout(timer);
    }
  }, [warnings]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-200 overflow-hidden font-sans select-none">
      {/* 3D Multiverse Background */}
      <MultiverseWrapper phase={phase} />

      {/* Cyberpunk Vignette & Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_100%)] opacity-80 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0 mix-blend-overlay" />

      {/* Warnings HUD */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {warnings.map((w, i) => (
            <motion.div 
              key={i + w}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-6 py-2 bg-red-600/90 backdrop-blur-md text-white font-bold rounded-lg border-2 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.8)] text-center tracking-wider uppercase"
            >
              ⚠️ {w}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col p-4 lg:p-6">
        
        <main className="flex-1 min-h-0 flex items-center justify-center">
          {phase === "lobby" && (
            <Lobby online={online} onStart={startMatchmaking} leaderboard={leaderboard} />
          )}

          {phase === "matchmaking" && <Matchmaking />}

          {phase === "rules" && (
            <RulesScreen opponent={opponent} countdown={countdown} onSkip={() => setPhase("playing")} />
          )}

          {(phase === "playing" || phase === "result" || phase === "eliminated") && (
            <BattleRoom
              phase={phase}
              opponent={opponent}
              timeLeft={timeLeft}
              problems={problems}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              solved={solved}
              opponentSolved={opponentSolved}
              language={language}
              onLangChange={setLanguage}
              code={code}
              onCodeChange={setCode}
              onSubmit={handleSubmitSolution}
              resultMsg={resultMsg}
              onExit={() => { setPhase("lobby"); document.exitFullscreen?.(); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   UI COMPONENTS
──────────────────────────────────────────────────────────────────────────── */

function Lobby({ online, onStart, leaderboard }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl grid lg:grid-cols-3 gap-8 items-center"
    >
      {/* Hero Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {online} Fighters Online
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-500 drop-shadow-sm uppercase tracking-tighter">
          Code Arena
        </h1>
        
        <p className="text-lg text-indigo-200/60 max-w-lg leading-relaxed">
          Enter the ultimate proving grounds. Real-time 1v1 coding battles with strict anti-cheat enforcement. Prove your worth.
        </p>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            ENTER MATCHMAKING
          </button>
        </div>
      </div>

      {/* Leaderboard Panel */}
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Rated</h3>
        <div className="space-y-3">
          {leaderboard.map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 text-center text-slate-500 font-mono text-sm">{i+1}</div>
                <div className="font-semibold text-slate-200">{u.name}</div>
              </div>
              <div className="text-indigo-400 font-mono font-bold">{u.rating}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Matchmaking() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center text-center"
    >
      <div className="relative w-32 h-32 mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-4 border-l-4 border-indigo-500"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border-b-4 border-r-4 border-purple-500"
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">⚔️</div>
      </div>
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">Searching...</h2>
      <p className="text-indigo-300/60 font-mono">Calibrating skill rating / Regional pairing</p>
    </motion.div>
  );
}

function RulesScreen({ opponent, countdown, onSkip }: any) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-black/60 backdrop-blur-2xl border border-indigo-500/30 p-10 rounded-3xl text-center max-w-2xl w-full shadow-[0_0_100px_rgba(79,70,229,0.15)]"
    >
      <div className="text-indigo-400 font-bold tracking-widest uppercase mb-8">Match Found</div>
      
      <div className="flex items-center justify-center gap-8 mb-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] border-2 border-slate-600">👤</div>
          <div className="font-bold text-lg">YOU</div>
        </div>
        
        <div className="text-4xl font-black text-slate-700 italic">VS</div>
        
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-900/50 rounded-full flex items-center justify-center text-4xl mb-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] border-2 border-indigo-500">
            {opponent?.avatar}
          </div>
          <div className="font-bold text-lg text-indigo-300">{opponent?.name}</div>
          <div className="text-sm font-mono text-indigo-500/80">{opponent?.rating} LP</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 text-left">
        <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm">
          <div className="font-bold mb-1">NO TAB SWITCH</div>
          Leaving the page results in instant elimination.
        </div>
        <div className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-xl text-amber-200 text-sm">
          <div className="font-bold mb-1">NO PASTE</div>
          Copy-pasting code is strictly prohibited.
        </div>
        <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl text-indigo-200 text-sm">
          <div className="font-bold mb-1">FULLSCREEN</div>
          You must remain in fullscreen mode.
        </div>
      </div>

      <div className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
        {countdown}
      </div>
    </motion.div>
  );
}

function BattleRoom({
  phase, opponent, timeLeft, problems, currentIdx, setCurrentIdx,
  solved, opponentSolved, language, onLangChange, code, onCodeChange, onSubmit, resultMsg, onExit
}: any) {
  const p = problems[currentIdx];
  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const isGameOver = phase === "result" || phase === "eliminated";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-[90vh] flex flex-col bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
    >
      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <h1 className={`text-6xl font-black uppercase tracking-tighter mb-4 ${phase === 'eliminated' ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]' : resultMsg.includes('VICTORY') ? 'text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'text-slate-300'}`}>
              {resultMsg}
            </h1>
            <button onClick={onExit} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold transition">
              RETURN TO LOBBY
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle HUD */}
      <header className="h-16 border-b border-white/10 bg-black/40 flex items-center justify-between px-6 shrink-0">
        <div className="flex gap-2">
          {problems.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentIdx(i)}
              className={`w-10 h-10 rounded font-mono font-bold transition-all flex items-center justify-center border
                ${currentIdx === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}
              `}
            >
              {solved[i] ? '✓' : i+1}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">Time Remaining</div>
          <div className={`font-mono text-2xl font-black ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-bold uppercase">YOU</div>
            <div className="font-mono text-lg">{solved.filter(Boolean).length} / 3</div>
          </div>
          <div className="text-2xl font-black italic text-slate-700">VS</div>
          <div className="text-left">
            <div className="text-xs text-rose-400 font-bold uppercase">{opponent?.name}</div>
            <div className="font-mono text-lg">{opponentSolved.filter(Boolean).length} / 3</div>
          </div>
        </div>
      </header>

      {/* Work Area */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* Problem Statement */}
          <Panel defaultSize={40} minSize={25} className="border-r border-white/10 bg-[#0a0a0f] flex flex-col relative">
            <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-5">
              <span className="text-9xl font-black">0{currentIdx + 1}</span>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 relative z-10 no-scrollbar">
              <h2 className="text-2xl font-black text-white mb-2">{p?.title}</h2>
              <div className="flex gap-2 mb-8">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {p?.difficulty}
                </span>
              </div>
              
              <div className="prose prose-invert prose-slate max-w-none text-slate-300 text-sm leading-relaxed mb-8">
                {p?.statement?.content}
              </div>

              {p?.statement?.examples?.map((ex: any, i: number) => (
                <div key={i} className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Example {i+1}</div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 font-mono text-xs space-y-2">
                    <div><span className="text-slate-500">Input:</span> <span className="text-emerald-300">{ex.input}</span></div>
                    <div><span className="text-slate-500">Output:</span> <span className="text-amber-300">{ex.output}</span></div>
                  </div>
                </div>
              ))}

              {p?.statement?.constraints && p.statement.constraints.length > 0 && (
                <div className="mt-8 mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Constraints</div>
                  <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400 font-mono text-[12px]">
                    {p.statement.constraints.map((c: string, i: number) => (
                      <li key={i}>
                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-indigo-300">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-black hover:bg-indigo-500/50 transition-colors cursor-col-resize flex items-center justify-center">
            <div className="h-8 w-0.5 bg-slate-700 rounded-full" />
          </PanelResizeHandle>

          {/* Editor & Console Area */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col bg-[#0d0d12]">
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30} className="flex flex-col relative">
                <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 shrink-0">
                  <select 
                    value={language}
                    onChange={e => onLangChange(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded px-3 py-1 text-xs text-indigo-300 font-mono outline-none focus:border-indigo-500"
                  >
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="c">C</option>
                  </select>

                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded transition-all shadow-sm border border-slate-700"
                    >
                      RUN
                    </button>
                    <button 
                      onClick={onSubmit}
                      className="px-6 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                    >
                      SUBMIT
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language}
                    value={code}
                    onChange={v => onCodeChange(v)}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                      scrollBeyondLastLine: false,
                      padding: { top: 16 },
                      contextmenu: false, // Prevents right-click (anti-cheat)
                    }}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-black hover:bg-indigo-500/50 transition-colors cursor-row-resize flex items-center justify-center">
                <div className="w-8 h-0.5 bg-slate-700 rounded-full" />
              </PanelResizeHandle>

              {/* Testcases Console */}
              <Panel defaultSize={30} minSize={15} className="flex flex-col bg-[#111116] border-t border-white/10">
                <div className="h-10 border-b border-white/5 bg-black/20 flex items-center px-4 gap-4 shrink-0">
                  <button className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b-2 border-indigo-500 h-full flex items-center">
                    Testcases
                  </button>
                  <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 h-full flex items-center transition-colors">
                    Result
                  </button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
                  <div className="flex gap-2 mb-4">
                    {p?.statement?.examples?.map((_: any, i: number) => (
                      <button key={i} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${i === 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        Case {i + 1}
                      </button>
                    ))}
                  </div>

                  {p?.statement?.examples?.[0] && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Input</div>
                        <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-xs text-emerald-300">
                          {p.statement.examples[0].input}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Expected Output</div>
                        <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-xs text-amber-300">
                          {p.statement.examples[0].output}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </motion.div>
  );
}
