"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaCompass,
  FaTasks,
  FaGamepad,
  FaCloudDownloadAlt,
} from "react-icons/fa";
import type { ReactNode } from "react";
import PageTransition from "@/components/transitions/PageTransition";
import {
  LanguageProvider,
  useLang,
  supportedLangs,
} from "@/components/LanguageProvider";

// ✅ new imports for PWA + sync
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import UseSync from "../components/UseSync";

function TopBar() {
  const { lang, setLang } = useLang();

  return (
    <header className="flex justify-end items-center p-6 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* 🌐 Language Selector */}
        <select
          onChange={(e) => setLang(e.target.value)}
          value={lang}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
        >
          {supportedLangs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=CodeElysium"
            alt="profile"
            className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-lg"
          />
          <span className="text-gray-300 font-medium">Sachin</span>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isWorkspace =
    pathname.startsWith("/problems/") && pathname.split("/").length > 3;

  const showSidebar = !isHome;
  const showTopBar = !isWorkspace;

  return (
    <html lang="en">
      <body className="h-screen min-h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* ✅ global singletons for PWA + sync */}
        <ServiceWorkerRegister />
        <UseSync />

        {/* 🌐 Wrap everything in LanguageProvider */}
        <LanguageProvider>
          <div className="h-full flex">
            {showSidebar ? (
              <aside className="w-64 bg-gray-950/60 backdrop-blur-lg border-r border-gray-800 p-6 hidden lg:flex flex-col">
                <h1 className="text-2xl font-extrabold mb-10 text-purple-400">
                  ⚡ CodeElysium
                </h1>
                <nav className="flex flex-col gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-3 text-gray-300 hover:text-purple-400 transition"
                  >
                    <FaHome /> Home
                  </Link>
                  <Link
                    href="/explore"
                    className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition"
                  >
                    <FaCompass /> Explore
                  </Link>
                  <Link
                    href="/problems"
                    className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition"
                  >
                    <FaTasks /> Problems
                  </Link>
                  <Link
                    href="/arena"
                    className="flex items-center gap-3 text-gray-300 hover:text-red-400 transition"
                  >
                    <FaGamepad /> Arena
                  </Link>
                  <Link
                    href="/offline"
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition"
                  >
                    <FaCloudDownloadAlt /> Offline
                  </Link>
                  {/* 🎮 New Games Link */}
                  <Link
                    href="/offline/games"
                    className="flex items-center gap-3 text-gray-300 hover:text-indigo-400 transition"
                  >
                    🎮 Games
                  </Link>
                  {/* 🏆 Progress Link */}
                  <Link
                    href="/progress"
                    className="flex items-center gap-3 text-gray-300 hover:text-pink-400 transition"
                  >
                    🏆 Progress
                  </Link>
                </nav>
              </aside>
            ) : null}

            <div className="flex-1 flex flex-col h-full">
              {/* 🌐 Top Bar with language switcher */}
              {showTopBar ? <TopBar /> : null}

              <main
                className={
                  isWorkspace
                    ? "flex-1 flex overflow-hidden h-full"
                    : isHome
                    ? "flex-1 p-8 md:p-12 overflow-auto"
                    : "flex-1 p-6 md:p-10 overflow-auto"
                }
              >
                <div className="flex-1 min-h-0">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
