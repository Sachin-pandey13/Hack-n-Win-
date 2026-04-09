"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

import { PROBLEMS } from "@/lib/problem";
import type { Problem, Example } from "@/types/problem";
import { runCodeOnServerMock } from "@/lib/judge";

// --- responsive helpers ---
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}


import MultiverseWrapper from "@/components/arena/MultiverseWrapper";


/* ────────────────────────────────────────────────────────────────────────────
   TYPES / DATA / TEMPLATES
──────────────────────────────────────────────────────────────────────────── */
type Phase = "lobby" | "matchmaking" | "rules" | "playing" | "eliminated" | "result";
type Lang = "cpp" | "java" | "python" | "c";
type Locale = "en" | "hi";

const TEMPLATES: Record<Lang, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // write methods here
};

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // read input and call Solution().method(...)
    return 0;
}
`,
  java: `import java.util.*;

class Solution {
    // write methods here
}

public class Main {
    public static void main(String[] args){
        // read input and call new Solution().method(...)
    }
}
`,
  python: `class Solution:
    # write methods here
    pass

if __name__ == "__main__":
    # read input and call Solution().method(...)
    pass
`,
  c: `#include <stdio.h>

int main(){
    // write your C solution here
    return 0;
}
`,
};

const OPPONENT_POOL = [
  { name: "NebulaFox", rating: 1720 },
  { name: "BitWizard", rating: 1612 },
  { name: "StackSamurai", rating: 1890 },
  { name: "AlgoNinja", rating: 1774 },
  { name: "LazyProp", rating: 1659 },
  { name: "MonoidMage", rating: 1833 },
  { name: "CacheQueen", rating: 1711 },
  { name: "PointerPirate", rating: 1688 },
];

/* i18n strings (EN + HI) */
const STR: Record<Locale, Record<string, string>> = {
  en: {
    arena: "Arena",
    lobby: "Lobby",
    battle: "Battle",
    playersOnline: "players online",
    startMatchmaking: "Start Matchmaking",
    leaderboard: "Leaderboard",
    liveStats: "Live Stats",
    avgQueue: "Avg queue time",
    regions: "Regions",
    integrity: "Integrity",
    onevone: "1v1",
    teamsSoon: "Teams (soon)",
    searching: "Searching for worthy opponent…",
    pairing: "Pairing across regions",
    opponentFound: "Opponent Found",
    startNow: "Start Now",
    live: "Live 1v1",
    matchTimer: "Match Timer",
    problems: "Problems",
    you: "You",
    editor: "Editor",
    maximize: "Maximize",
    restore: "Restore",
    run: "Run",
    submit: "Submit",
    language: "Language",
    zoom: "Zoom",
    statement: "Statement",
    discussion: "Discussion (soon)",
    submissions: "Submissions (soon)",
    comingSoon: "Coming soon — live discussions and submission history.",
    eliminated: "Eliminated: Window/tab switched during battle.",
    backToArena: "Back to Arena",
  },
  hi: {
    arena: "एरीना",
    lobby: "लॉबी",
    battle: "बैटल",
    playersOnline: "ऑनलाइन खिलाड़ी",
    startMatchmaking: "मैचमे‍किंग शुरू करें",
    leaderboard: "लीडरबोर्ड",
    liveStats: "लाइव आँकड़े",
    avgQueue: "औसत कतार समय",
    regions: "क्षेत्र",
    integrity: "नैतिकता",
    onevone: "1v1",
    teamsSoon: "टीमें (जल्द)",
    searching: "प्रतिद्वंद्वी खोज रहे हैं…",
    pairing: "क्षेत्रों के बीच पेयरिंग",
    opponentFound: "प्रतिद्वंद्वी मिला",
    startNow: "अभी शुरू करें",
    live: "लाइव 1v1",
    matchTimer: "मैच टाइमर",
    problems: "समस्याएँ",
    you: "आप",
    editor: "एडिटर",
    maximize: "मैक्सिमाइज़",
    restore: "रीस्टोर",
    run: "चलाएँ",
    submit: "सबमिट",
    language: "भाषा",
    zoom: "ज़ूम",
    statement: "स्टेटमेंट",
    discussion: "चर्चा (जल्द)",
    submissions: "सबमिशन (जल्द)",
    comingSoon: "जल्द आ रहा है — लाइव चर्चा और सबमिशन इतिहास।",
    eliminated: "एलिमिनेटेड: बैटल के दौरान टैब/विंडो स्विच।",
    backToArena: "एरीना पर लौटें",
  },
};

/* ────────────────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────────────────── */
export default function ArenaPage() {
  const [locale, setLocale] = useState<Locale>("en");

  // Phases
  const [phase, setPhase] = useState<Phase>("lobby");
  const [online, setOnline] = useState<number | null>(null);
  useEffect(() => setOnline(2500 + Math.floor(Math.random() * 1800)), []);

  // Battle state
  const [language, setLanguage] = useState<Lang>("cpp");
  const [code, setCode] = useState<string>(TEMPLATES.cpp);
  const [fontSize, setFontSize] = useState(14);
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [countdown, setCountdown] = useState<number>(6);
  const [opponent, setOpponent] = useState<{ name: string; rating: number } | null>(null);

  // Problems
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(new Array(10).fill(false));
  const [opponentSolved, setOpponentSolved] = useState<boolean[]>(new Array(10).fill(false));

  // UX & guards
  const [resultMsg, setResultMsg] = useState<string>("");
  const eliminatedRef = useRef(false);
  const pristine = useRef(true);
  const [tab, setTab] = useState<"statement" | "discussion" | "submissions">("statement");
  const [editorMax, setEditorMax] = useState(false);

  // Live-ish leaderboard (for lobby)
  const [leaderboard, setLeaderboard] = useState([
    { name: "StackSamurai", rating: 1890 },
    { name: "MonoidMage", rating: 1833 },
    { name: "NebulaFox", rating: 1720 },
    { name: "BitWizard", rating: 1612 },
  ]);
  useEffect(() => {
    const id = setInterval(() => {
      setLeaderboard((prev) =>
        prev
          .map((u) => ({ ...u, rating: u.rating + Math.floor(Math.random() * 7 - 3) }))
          .sort((a, b) => b.rating - a.rating),
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Draw 10 problems
  const drawProblems = useCallback(() => {
    const pool = PROBLEMS && PROBLEMS.length ? [...PROBLEMS] : [];
    const picks: Problem[] = [];
    for (let i = 0; i < 10; i++) {
      if (pool.length) {
        const k = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(k, 1)[0]);
      } else {
        picks.push({
          id: `ph-${i}`,
          title: `Placeholder Problem ${i + 1}`,
          number: 1000 + i,
          difficulty: i < 3 ? "Easy" : i < 7 ? "Medium" : "Hard",
          tags: ["arrays", "strings", "math"],
          statement: {
            content: "Solve the placeholder challenge.",
            examples: [],
            constraints: ["n ≤ 1e5"],
          },
        } as unknown as Problem);
      }
    }
    setProblems(picks);
  }, []);

  const startMatchmaking = () => {
    drawProblems();
    setPhase("matchmaking");
    setTimeout(() => {
      const pick = OPPONENT_POOL[Math.floor(Math.random() * OPPONENT_POOL.length)];
      setOpponent(pick);
      setPhase("rules");
    }, 1200 + Math.random() * 1200);
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

  // Match timer
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

  // Simulated opponent solves
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setOpponentSolved((prev) => {
        const arr = [...prev];
        if (Math.random() < 0.25) {
          const pending = arr.map((v, i) => (!v ? i : -1)).filter((i) => i >= 0);
          if (pending.length) arr[pending[Math.floor(Math.random() * pending.length)]] = true;
        }
        return arr;
      });
    }, 12000);
    return () => clearInterval(id);
  }, [phase]);

  // Anti-tab-switch elimination
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden" && phase === "playing" && !eliminatedRef.current) {
        eliminatedRef.current = true;
        setPhase("eliminated");
        setResultMsg(STR[locale].eliminated);
      }
    };
    const onBlur = () => {
      if (phase === "playing" && !eliminatedRef.current) {
        eliminatedRef.current = true;
        setPhase("eliminated");
        setResultMsg(STR[locale].eliminated);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase, locale]);

  const solvedCount = useMemo(() => solved.filter(Boolean).length, [solved]);
  const oppSolvedCount = useMemo(() => opponentSolved.filter(Boolean).length, [opponentSolved]);

  function endGame() {
    if (phase === "result" || phase === "eliminated") return;
    const msg =
      solvedCount > oppSolvedCount ? "You win!" : solvedCount < oppSolvedCount ? "You lose." : "Draw: equal solves.";
    setResultMsg(msg);
    setPhase("result");
  }

  async function handleSubmitSolution() {
  const p = problems[currentIdx];
  try {
    await runCodeOnServerMock(p, code, language);
    // replace mock with real call
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: language === "python" ? 71 : language === "cpp" ? 54 : 62, // map to Judge0 IDs
        source_code: code,
        stdin: "custom input here"
      }),
    });
    const result = await response.json();

    // ⬇️ push this result into ResultPanel
    setResultMsg(JSON.stringify(result, null, 2));

    if (result?.status === "Accepted") {
      setSolved((arr) => {
        const next = [...arr];
        next[currentIdx] = true;
        return next;
      });
    }
  } catch (err) {
    console.error("❌ Submission failed", err);
  }
}

  // Editor handlers
  const onEditorChange = (v?: string) => {
    if (pristine.current) pristine.current = false;
    setCode(v ?? "");
  };
  const onLangChange = (next: Lang) => {
    if (pristine.current) setCode(TEMPLATES[next]);
    setLanguage(next);
  };

  const t = STR[locale];

  return (
    <div className="relative min-h-screen bg-arena text-slate-200">
      {/* New: Multiverse 3D canvas (Three.js) */}
      <MultiverseWrapper phase={phase} />

      {/* Fallback decorative layers (kept subtle) */}
      <div className="arena-grid pointer-events-none" />
      <div className="particles pointer-events-none" />

      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-6 flex flex-col">
        {/* Top nav / i18n */}
        <TopBar phase={phase} locale={locale} onLocale={(loc) => setLocale(loc)} />

        <main className="mt-3 sm:mt-4 flex-1 min-h-0">
          {phase === "lobby" && (
            <Lobby locale={locale} online={online} onStart={startMatchmaking} leaderboard={leaderboard} />
          )}

          {phase === "matchmaking" && <Matchmaking t={t} />}

          {phase === "rules" && (
            <RulesScreen t={t} opponent={opponent} countdown={countdown} onSkip={() => setPhase("playing")} />
          )}

          {(phase === "playing" || phase === "result" || phase === "eliminated") && (
            <BattleRoom
              t={t}
              phase={phase}
              opponent={opponent}
              timeLeft={timeLeft}
              problems={problems}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              solved={solved}
              opponentSolved={opponentSolved}
              language={language}
              onLangChange={onLangChange}
              code={code}
              onCodeChange={onEditorChange}
              onRun={() => {}}
              onSubmit={handleSubmitSolution}
              onEnd={endGame}
              resultMsg={resultMsg}
              fontSize={fontSize}
              setFontSize={setFontSize}
              editorMax={editorMax}
              setEditorMax={setEditorMax}
              tab={tab}
              setTab={setTab}
            />
          )}
        </main>
      </div>

      <DesignTokens />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MULTIVERSE 3D BACKGROUND (Three.js via @react-three/fiber)
   - full-screen Canvas behind UI
   - starfield + floating rings + reactive parallax
   - speed/intensity react to current phase (lobby vs matchmaking vs battle)
──────────────────────────────────────────────────────────────────────────── */


// subtle camera parallax driven by mouse (without capturing pointer events)


/* ────────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM PRIMITIVES
──────────────────────────────────────────────────────────────────────────── */
function Button({
  children,
  variant = "ghost",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" }) {
  return (
    <button {...props} className={`btn ${variant === "primary" ? "btn-primary" : ""} ${className}`}>
      {children}
    </button>
  );
}
const Chip = ({ children, on = false, className = "", ...rest }: any) => (
  <span {...rest} className={`chip ${on ? "on" : ""} ${className}`}>
    {children}
  </span>
);
const Card = ({ children, className = "", ...rest }: any) => (
  <section
    {...rest}
    className={`rounded-2xl border border-white/10 bg-[rgba(12,16,34,.86)] backdrop-blur-xl
    transition-all duration-300 ease-out
    hover:-translate-y-2
    hover:backdrop-blur-2xl
    hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)]
    ${className}`}
  >
    {children}
  </section>
);
const CardHeader = ({ children, className = "" }: any) => (
  <div className={`px-4 py-3 border-b border-white/10 flex items-center justify-between ${className}`}>{children}</div>
);
const CardBody = ({ children, className = "" }: any) => <div className={`p-4 ${className}`}>{children}</div>;
const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-3
transition-all duration-300
hover:-translate-y-1
hover:bg-white/10
hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);
const Badge = ({ children }: any) => <span className="pill easy">{children}</span>;
const Skeleton = ({ className = "" }: { className?: string }) => <div className={`animate-pulse bg-white/10 rounded ${className}`} />;

/* ────────────────────────────────────────────────────────────────────────────
   TOP BAR
──────────────────────────────────────────────────────────────────────────── */
function TopBar({
  phase,
  locale,
  onLocale,
}: {
  phase: Phase;
  locale: Locale;
  onLocale: (l: Locale) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[rgba(12,16,34,.85)] backdrop-blur px-3 sm:px-4 py-2 flex items-center justify-between"
      role="navigation"
      aria-label="Arena header"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" aria-hidden />
        <span className="font-semibold">Arena</span>
        <span className="text-slate-400">/ {phase === "lobby" ? "Lobby" : "Battle"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Chip className={`cursor-pointer ${locale === "en" ? "on" : ""}`} onClick={() => onLocale("en")}>
          EN
        </Chip>
        <Chip className={`cursor-pointer ${locale === "hi" ? "on" : ""}`} onClick={() => onLocale("hi")}>
          हिं
        </Chip>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LOBBY
──────────────────────────────────────────────────────────────────────────── */
function Lobby({
  locale,
  online,
  onStart,
  leaderboard,
}: {
  locale: Locale;
  online: number | null;
  onStart: () => void;
  leaderboard: Array<{ name: string; rating: number }>;
}) {
  const t = STR[locale];
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(40%_30%_at_60%_0%,rgba(99,102,241,0.16),transparent_60%)]" />
      <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full">
        {/* Left: Leaderboard */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="col-span-12 md:col-span-4 lg:col-span-3"
        >
          <Card aria-label="Leaderboard">
            <CardHeader>
              <h3 className="text-sm font-semibold">🏆 {t.leaderboard}</h3>
              <Chip className="text-xs">Live</Chip>
            </CardHeader>
            <CardBody>
              <ul className="text-sm space-y-2">
                {leaderboard.length === 0 &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <li key={i}>
                      <Skeleton className="h-6 w-full" />
                    </li>
                  ))}
                {leaderboard.map((u, i) => (
  <li
    key={u.name}
    className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/5
    transition-all duration-300 ease-out
    hover:-translate-y-1
    hover:bg-white/10
    hover:backdrop-blur-lg
    hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
  >
    <span className="truncate">
      {i + 1}. {u.name}
    </span>
    <span className="text-slate-300">{u.rating}</span>
  </li>
))}
              </ul>
            </CardBody>
          </Card>
        </motion.div>

        {/* Center: Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="col-span-12 md:col-span-8 lg:col-span-6 flex"
        >
          <Card className="w-full">
            <CardBody className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">⚔️ {STR[locale].arena}</h1>
                  <p className="text-slate-400 mt-1">
                    <span suppressHydrationWarning>{online ?? "— — —"}</span> {STR[locale].playersOnline}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Chip on className="select-none">
                    {STR[locale].onevone}
                  </Chip>
                  <Chip className="select-none">{STR[locale].teamsSoon}</Chip>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Stat label="Anti-cheat" value="Tab switch detector" />
                <Stat label="Integrity" value="Rate limits + server judge" />
                <Stat label="Scaling" value="Cloud ready" />
                <Stat label="A11y" value="WCAG AA" />
              </div>

              <div className="mt-6 flex items-center justify-end">
                <Button variant="primary" onClick={onStart} aria-label={STR[locale].startMatchmaking}>
                  {STR[locale].startMatchmaking}
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Right: Live stats */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="col-span-12 lg:col-span-3 md:col-span-4"
        >
          <Card aria-label="Live stats">
            <CardHeader>
              <h3 className="text-sm font-semibold">📊 {STR[locale].liveStats}</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="text-xs text-slate-400 flex justify-between">
                <span>{STR[locale].avgQueue}</span>
                <span>3–6s</span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>{STR[locale].regions}</span>
                <span>IN • EU • US • SG</span>
              </div>
              <div className="text-xs text-slate-400">
                {STR[locale].integrity}: Tab switch detection • Throttle limits
              </div>
              <div className="pt-2 border-t border-white/10">
                <Badge>New</Badge> <span className="text-sm">Daily Streaks & XP</span>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MATCHMAKING + RULES
──────────────────────────────────────────────────────────────────────────── */
function Matchmaking({ t }: { t: Record<string, string> }) {
  return (
    <div className="h-full grid place-items-center">
      <Card className="w-[860px] max-w-[96vw] text-center">
        <CardBody>
          <div className="text-sm text-slate-400">{t.searching}</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Spinner /> <span className="text-slate-300">{t.pairing}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
function Spinner() {
  return (
    <motion.div
      className="h-10 w-10 rounded-full border-2 border-indigo-400/60 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 1.1 }}
      role="img"
      aria-label="Loading"
    />
  );
}
function RulesScreen({
  t,
  opponent,
  countdown,
  onSkip,
}: {
  t: Record<string, string>;
  opponent: { name: string; rating: number } | null;
  countdown: number;
  onSkip: () => void;
}) {
  return (
    <div className="h-full grid place-items-center">
      <Card className="w-[960px] max-w-[96vw]">
        <CardHeader>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{t.opponentFound}</div>
            <div className="text-lg font-semibold">
              {opponent?.name ?? "Opponent"}{" "}
              <span className="text-slate-400 font-normal">• {opponent?.rating ?? 0}</span>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Starting in <span className="text-slate-100 font-semibold">{countdown}s</span>
          </div>
        </CardHeader>
        <CardBody className="flex justify-end">
          <Button onClick={onSkip}>{t.startNow}</Button>
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   BATTLE ROOM (LeetCode-style 3 panels, no nested panels)
──────────────────────────────────────────────────────────────────────────── */
function BattleRoom({
  t,
  phase,
  opponent,
  timeLeft,
  problems,
  currentIdx,
  setCurrentIdx,
  solved,
  opponentSolved,
  language,
  onLangChange,
  code,
  onCodeChange,
  onRun,
  onSubmit,
  onEnd,
  resultMsg,
  fontSize,
  setFontSize,
  editorMax,
  setEditorMax,
  tab,
  setTab,
}: any) {
  const isMobile = useIsMobile(); // < 1024px → stacked layout
  const mm = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const problem = problems[currentIdx];
  const diffClass =
    (problem?.difficulty || "Easy") === "Easy"
      ? "easy"
      : problem?.difficulty === "Medium"
      ? "medium"
      : "hard";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden bg-[rgba(12,16,34,.9)] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col">
      {/* HUD */}
      <motion.div
        className="chrome px-3 sm:px-4 py-2 flex items-center justify-between"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full h-2.5 w-2.5 bg-emerald-400" />
          <span className="text-sm">{t.live}</span>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-slate-400">{t.matchTimer}</div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">
            <span suppressHydrationWarning>{mm(timeLeft)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PlayerTag you label={t.you} />
          <div className="text-slate-500">vs</div>
          <PlayerTag name={opponent?.name ?? "Opponent"} rating={opponent?.rating ?? 0} />
        </div>
      </motion.div>

      {/* Global Toolbar (Run/Submit outside panels, LeetCode-style) */}
      <div className="px-3 sm:px-4 py-2 border-b border-white/10 bg-[rgba(10,14,30,.75)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-400">{t.language}</span>
            <select
              className="chip bg-transparent"
              value={language}
              onChange={(e) => onLangChange(e.target.value as Lang)}
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="c">C</option>
            </select>
          </label>
          {/* Zoom control hidden on tiny screens, shows on >=sm */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400">{t.zoom}</span>
            <div className="chip flex items-center gap-2">
              <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} aria-label="Zoom out">−</button>
              <span className="tabular-nums">{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} aria-label="Zoom in">+</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onRun}>{t.run}</Button>
          <Button variant="primary" onClick={onSubmit}>{t.submit}</Button>
        </div>
      </div>

      {/* Desktop: 3 resizable panels | Mobile: stacked, editor-first */}
      {!isMobile ? (
        /* ── DESKTOP (>= lg) ───────────────────────── */
        <PanelGroup direction="horizontal" className="flex-1 h-full">
          {/* Left: Problems */}
          <Panel minSize={15} defaultSize={20} className="border-r border-white/10">
            <div className="h-full flex flex-col backdrop-blur-xl bg-[rgba(20,25,50,0.60)]">
              <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">{t.problems}</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2" role="listbox" aria-label="Problems list">
                {problems.map((p: Problem, i: number) => (
                 <button
                  key={`${p.id}-${i}`}
                    onClick={() => setCurrentIdx(i)}
                    role="option"
                    aria-selected={i === currentIdx}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
                      i === currentIdx
                        ? "bg-indigo-600/40 border border-indigo-400/40 text-white"
                        : "bg-white/5 hover:bg-white/10 text-slate-300"
                    }`}
                  >
                    {i + 1}. {p.title}
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 text-xs text-slate-400 border-t border-white/10">
                {t.you}: {solved.filter(Boolean).length}/10 &nbsp; • &nbsp; Rival: {opponentSolved.filter(Boolean).length}/10
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="split-handle" />

          {/* Middle: Statement */}
          <Panel minSize={25} defaultSize={35} className="border-r border-white/10">
            <div className="h-full flex flex-col backdrop-blur-xl bg-[rgba(25,30,60,0.65)]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {problem?.number}. {problem?.title ?? "Problem"}
                </span>
                <span className={`pill ${diffClass}`}>{problem?.difficulty}</span>
                <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
                  {problem?.tags?.slice(0, 4).map((tg: string) => (
                    <span key={tg} className="chip">{tg}</span>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-5">
                <div className="flex items-center gap-2 mb-3">
                  <button className={`tab ${tab === "statement" ? "active" : ""}`} onClick={() => setTab("statement")}>{t.statement}</button>
                  <button className={`tab ${tab === "discussion" ? "active" : ""}`} onClick={() => setTab("discussion")}>{t.discussion}</button>
                  <button className={`tab ${tab === "submissions" ? "active" : ""}`} onClick={() => setTab("submissions")}>{t.submissions}</button>
                </div>

                {tab === "statement" ? (
                  <article className="prose prose-invert max-w-none">
                    <p className="leading-7">{problem?.statement?.content}</p>
                    {problem?.statement?.examples?.length ? (
                      <>
                        <h4>Examples</h4>
                        <ul>
                          {problem.statement.examples.map((ex: Example, i: number) => (
                            <li key={i}><b>Input:</b> {ex.input} &nbsp; <b>Output:</b> {ex.output}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {problem?.statement?.constraints?.length ? (
                      <>
                        <h4>Constraints</h4>
                        <ul>{problem.statement.constraints.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
                      </>
                    ) : null}
                  </article>
                ) : (
                  <div className="py-8 text-sm text-slate-400">{t.comingSoon}</div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="split-handle" />

          {/* Right: Editor */}
          <Panel minSize={35} defaultSize={45}>
            <div className="h-full flex flex-col backdrop-blur-xl bg-[rgba(15,20,45,0.70)]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm text-slate-300">{t.editor}</span>
                {!editorMax ? (
                  <Chip className="cursor-pointer" onClick={() => setEditorMax(true)}>⛶ {t.maximize}</Chip>
                ) : (
                  <Chip className="cursor-pointer" onClick={() => setEditorMax(false)}>↩ {t.restore}</Chip>
                )}
              </div>

              <div className="flex-1 min-h-0">
                {mounted ? (
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language}
                    value={code}
                    onChange={onCodeChange}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      mouseWheelZoom: true,
                      fontSize,
                      smoothScrolling: true,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                ) : (
                  <div className="h-full grid place-items-center text-xs text-slate-400">Loading editor…</div>
                )}
              </div>

              <div className="border-t border-white/10 bg-black/25 p-3 text-sm text-slate-300">
                <span className="font-semibold">Test Results</span>
                <div className="mt-2 rounded-lg bg-slate-900/60 p-2">No tests executed yet.</div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      ) : (
        /* ── MOBILE (< lg): stacked, editor-first ─────────────── */
        <div className="flex-1 min-h-0 grid grid-rows-[auto_auto_1fr] gap-2 p-2">
          {/* Problems (collapsible feel via max-height) */}
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,25,50,0.60)]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-semibold">{t.problems}</div>
              <div className="text-xs text-slate-400">
                {t.you}: {solved.filter(Boolean).length}/10 • Rival: {opponentSolved.filter(Boolean).length}/10
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto p-3 space-y-2">
              {problems.map((p: Problem, i: number) => (
                <button
                 key={`${p.id}-${i}`}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    i === currentIdx ? "bg-indigo-600/40 border border-indigo-400/40" : "bg-white/5"
                  }`}
                >
                  {i + 1}. {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Statement (compact) */}
          <div className="rounded-2xl border border-white/10 bg-[rgba(25,30,60,0.65)]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <span className="text-sm font-semibold truncate">
                {problem?.number}. {problem?.title ?? "Problem"}
              </span>
              <span className={`pill ${diffClass}`}>{problem?.difficulty}</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-4 text-sm">
              <p className="leading-7">{problem?.statement?.content}</p>
            </div>
          </div>

          {/* Editor (full remaining height) */}
          <div className="rounded-2xl border border-white/10 bg-[rgba(15,20,45,0.70)] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm text-slate-300">{t.editor}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 hidden xs:inline">{t.zoom}</span>
                <div className="chip flex items-center gap-2">
                  <button onClick={() => setFontSize(Math.max(10, fontSize - 1))}>−</button>
                  <span className="tabular-nums">{fontSize}</span>
                  <button onClick={() => setFontSize(Math.min(24, fontSize + 1))}>+</button>
                </div>
              </div>
            </div>
            <div className="min-h-0 h-full">
              {mounted ? (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={language}
                  value={code}
                  onChange={onCodeChange}
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    mouseWheelZoom: true,
                    fontSize,
                    smoothScrolling: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              ) : (
                <div className="h-full grid place-items-center text-xs text-slate-400">Loading editor…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {phase === "result" && <ResultOverlay msg={resultMsg} btn={t.backToArena} onClose={onEnd} />}
        {phase === "eliminated" && <EliminatedOverlay msg={resultMsg} btn={t.backToArena} />}
      </AnimatePresence>
    </div>
  );
}

function PlayerTag({
  you,
  name = "You",
  rating = 1700,
  label,
}: {
  you?: boolean;
  name?: string;
  rating?: number;
  label?: string;
}) {
  return (
    <span className="chip on flex items-center gap-2" aria-label={you ? (label ?? "You") : name}>
      <span className={`h-2.5 w-2.5 rounded-full ${you ? "bg-emerald-400" : "bg-indigo-400"}`} />
      <span>{you ? (label ?? "You") : name}</span>
      <span className="text-slate-400">• {rating}</span>
    </span>
  );
}
function ResultOverlay({ msg, btn, onClose }: { msg: string; btn: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 grid place-items-center bg-black/60">
      <Card className="w-[560px] max-w-[92vw] text-center">
        <CardBody>
          <div className="text-2xl font-semibold mb-2">{msg}</div>
          <div className="text-slate-400 text-sm">Great battle! Queue again to climb the ranks.</div>
          <div className="mt-5">
            <a href="/arena" className="btn btn-primary" onClick={onClose}>
              {btn}
            </a>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
function EliminatedOverlay({ msg, btn }: { msg: string; btn: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 grid place-items-center bg-black/70">
      <Card className="w-[600px] max-w-[92vw] text-center">
        <CardBody>
          <div className="text-2xl font-semibold text-rose-300 mb-2">{msg}</div>
          <div className="text-slate-400 text-sm">Keep the battle tab focused next time.</div>
          <div className="mt-5">
            <a href="/arena" className="btn">{btn}</a>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS / UTILITIES
──────────────────────────────────────────────────────────────────────────── */
function DesignTokens() {
  return (
    <style jsx global>{`
      :root{
        --card: rgba(12,16,34,.88);
        --muted: rgba(148,163,184,0.08);
        --ring: rgba(129,140,248,.35);
        --primary: #6366f1;
        --primary-2: #3b82f6;
      }

      .bg-arena{
        background:
          radial-gradient(1200px 480px at 70% -8%, rgba(124,58,237,0.12), transparent),
          radial-gradient(900px 360px at 15% 108%, rgba(59,130,246,0.10), transparent),
          #070b1a;
        overflow:hidden;
      }
      .arena-grid,.particles{position:absolute; inset:0; z-index:0;}
      .arena-grid::before{
        content:""; position:absolute; inset:-2px;
        background-image:
          linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px);
        background-size: 48px 48px, 48px 48px;
        mask-image: radial-gradient(ellipse at 60% -20%, black 30%, transparent 70%);
      }
      .particles::before, .particles::after{
        content:""; position:absolute; inset:0;
        background:
          radial-gradient(6px 6px at 20% 30%, rgba(255,255,255,0.06), transparent 60%),
          radial-gradient(8px 8px at 80% 60%, rgba(255,255,255,0.06), transparent 60%),
          radial-gradient(5px 5px at 50% 80%, rgba(255,255,255,0.05), transparent 60%);
        animation: drift 28s linear infinite;
      }
      @keyframes drift{0%{transform:translateY(0)}100%{transform:translateY(-80px)}}

      .chrome{
        background: linear-gradient(0deg, rgba(14,18,38,.85), rgba(14,18,38,.85));
        border-bottom: 1px solid rgba(129,140,248,.2);
        backdrop-filter: blur(10px);
      }

      .btn{
        border-radius: 12px; padding: 10px 14px;
        border: 1px solid var(--ring);
        background: rgba(15,23,42,.5); color: #e5e7eb;
        transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
      }
      .btn:hover{ background: rgba(15,23,42,.65); box-shadow: 0 8px 20px rgba(99,102,241,.18); transform: translateY(-1px); }
      .btn:active{ transform: translateY(0); }
      .btn-primary{
  background: linear-gradient(90deg, var(--primary), var(--primary-2));
  color: white;
  border-color: rgba(129,140,248,.45);
  box-shadow: 0 10px 24px rgba(99,102,241,.32);
  transition: transform .25s ease, box-shadow .25s ease;
}

.btn-primary:hover{
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 20px 45px rgba(99,102,241,.45);
}
      .btn-primary:hover{ filter: brightness(1.05); }

      .chip{
        padding: 6px 10px; border-radius: 999px;
        border: 1px solid var(--ring);
        font-size: 12px; color: #d0d7ee; background: rgba(2,6,23,.35);
        transition: box-shadow .15s ease, transform .15s ease;
      }
      .chip.on{ background: rgba(99,102,241,.22); box-shadow: 0 0 0 1px var(--ring) inset; }
      .chip:hover{ transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,.12); }

      .pill{ padding: 3px 8px; border-radius: 999px; font-size: 11px; border: 1px solid; }
      .pill.easy{ border-color: rgba(16,185,129,.6); color: #a7f3d0; background: rgba(16,185,129,.12); }
      .pill.medium{ border-color: rgba(245,158,11,.6); color: #fed7aa; background: rgba(245,158,11,.12); }
      .pill.hard{ border-color: rgba(239,68,68,.6); color: #fecaca; background: rgba(239,68,68,.12); }

      .tab{ padding: 8px 12px; border-bottom: 2px solid transparent; color: #9fb3ff; }
      .tab.active{ color: #e9edff; border-color: #7c8cff; }

      .split-handle{ position: relative; flex: 0 0 12px; cursor: col-resize; }
      .split-handle::after{
        content:""; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        width: 22px; height: 22px; border-radius: 999px;
        background: rgba(99,102,241,.18); border: 1px solid rgba(129,140,248,.35);
      }
      .split-handle:hover::after{ background: rgba(99,102,241,.28); }

      /* Monaco: remove focus outline */
      .monaco-editor, .overflow-guard{ outline: none !important; }
    `}</style>
  );
}
