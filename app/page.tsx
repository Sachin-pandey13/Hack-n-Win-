"use client";

import React, { useEffect, useState } from "react";
import { RoughNotation } from "react-rough-notation";
import { useRouter } from "next/navigation";
import { useUsersStore } from "@/store/useUsersStore";

export default function HomePage() {
  const [show3D, setShow3D] = useState<boolean | null>(null);
  const [forceLite, setForceLite] = useState(false);

  const router = useRouter();

  const user = useUsersStore((s) => s.user);
  const setupComplete = useUsersStore((s) => s.setupComplete);

  /* 🔹 Auth redirect logic */
  useEffect(() => {
    if (user && !setupComplete) {
      router.push("/setup");
    }

    if (user && setupComplete) {
      router.push("/explore");
    }
  }, [user, setupComplete, router]);

  useEffect(() => {
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqSmall = window.matchMedia("(max-width: 640px)");

    const compute = () => {
      const prefersReduced = mqReduced.matches;
      const isSmall = mqSmall.matches;
      setShow3D(!prefersReduced && !isSmall);
    };

    compute();
    mqReduced.addEventListener?.("change", compute);
    mqSmall.addEventListener?.("change", compute);

    return () => {
      try {
        mqReduced.removeEventListener?.("change", compute);
        mqSmall.removeEventListener?.("change", compute);
      } catch {}
    };
  }, []);

  if (show3D === null) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-28">
          <div className="welcome-center-panel w-full max-w-4xl text-center">
            <h1 className="text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-400">
              <RoughNotation type="underline" show color="#a855f7" animationDelay={500} animationDuration={1200}>
                Welcome to CodeElysium 🚀
              </RoughNotation>
            </h1>
            <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Loading hero…
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setForceLite((v) => !v)}
          className="rounded-full bg-white/6 px-3 py-1 text-sm text-white/90 backdrop-blur-sm"
        >
          {forceLite ? "Lite" : "Cinematic"}
        </button>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none r3f-static-fallback flex items-end justify-center pb-8">
        <div className="w-48 max-w-[36vw] opacity-60 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 p-4">
          <p className="text-center text-sm text-gray-300">3D hero removed</p>
        </div>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-28">
        <div className="welcome-center-panel w-full max-w-4xl text-center">

          <h1 className="text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-400">
            <RoughNotation type="underline" show color="#a855f7" animationDelay={500} animationDuration={1200}>
              Welcome to CodeElysium 🚀
            </RoughNotation>
          </h1>

          <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Practice <span className="text-purple-400 font-semibold">coding challenges</span>, explore{" "}
            <span className="text-pink-400 font-semibold">curated problems</span>, and battle in the{" "}
            <span className="text-red-400 font-semibold">arena</span>.
          </p>

          {/* 🔹 If user NOT logged in show Login / Signup */}
          {!user && (
            <div className="mt-8 flex gap-6 justify-center">

              <a
                href="/login"
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition transform hover:scale-105"
              >
                🔐 Login
              </a>

              <a
                href="/signup"
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/30 transition transform hover:scale-105"
              >
                ✨ Sign Up
              </a>

            </div>
          )}

          {/* 🔹 If logged in show normal buttons */}
          {user && (
            <div className="mt-8 flex gap-6 justify-center">

              <a
                href="/explore"
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition transform hover:scale-105"
              >
                🔍 Explore
              </a>

              <a
                href="/problems"
                className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-lg shadow-pink-500/30 transition transform hover:scale-105"
              >
                🧩 Problems
              </a>

              <a
                href="/arena"
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-500/30 transition transform hover:scale-105"
              >
                ⚔️ Arena
              </a>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}