// app/explore/page.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { PLAYLISTS, TOPICS, PROVIDERS, type Playlist } from "@/lib/playlists";
import { Search, ExternalLink, PieChart as PieIcon, X } from "lucide-react";
import TopicFilter from "@/components/nav/TopicFilter";

import Modal from "@/components/ui/Modal";
import CategoryTiles from "@/components/explore/CategoryTiles";
import StreamSelector from "@/components/explore/StreamSelector";
import SubjectList from "@/components/explore/SubjectList";
import TopicGrid from "@/components/explore/TopicGrid";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#22d3ee",
  "#eab308",
  "#22c55e",
];

const darken = (hex: string, amt = 0.22) => {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amt));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amt));
  const b = Math.max(0, (num & 0xff) * (1 - amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

function PieLabel(props: any & { small?: boolean }) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value, name, small } =
    props;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.72;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const text = `${name}: ${value}m`;
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: small ? 10 : 12, fontWeight: 600 }}
      fill="#e5e7eb"
      stroke="#0b0f22"
      strokeOpacity={0.6}
      strokeWidth={2}
    >
      {text}
    </text>
  );
}

/* -------------------- Main Page -------------------- */

export default function ExplorePage() {
  // base filters
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<"All" | string>("All");
  const [provider, setProvider] = useState<"All" | string>("All");
  const [language, setLanguage] = useState<
    "All" | "English" | "Hindi" | "Mixed"
  >("All");
  const [open, setOpen] = useState<Playlist | null>(null);

  // new explore state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectQ, setSubjectQ] = useState<string>("");
  const [techTopic, setTechTopic] = useState<string | null>(null); // e.g. "DSA", "Languages", "Interview"
  const [selectedClass, setSelectedClass] = useState<string | null>(null); // class selector for STEAM
  const [isSmall, setIsSmall] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [watchData, setWatchData] = useState<Record<string, number>>({});
  const [chartOpen, setChartOpen] = useState(true);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const isPlayingRef = useRef(false);
  const activeTitleRef = useRef<string | null>(null);
  const attachedIframes = useRef<Set<HTMLIFrameElement>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("watchData");
      if (raw) setWatchData(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watchData", JSON.stringify(watchData));
    } catch {}
  }, [watchData]);

  const getIframeTitle = (iframe: HTMLIFrameElement): string => {
    const attr =
      iframe.getAttribute("title") || iframe.getAttribute("aria-label");
    if (attr && attr.trim()) return attr.trim();
    let node: HTMLElement | null = iframe;
    for (let i = 0; i < 8 && node; i++) {
      const h = node.querySelector<HTMLElement>(
        "h3, h2, [data-title], .title, [aria-label]"
      );
      if (h?.textContent) return h.textContent.trim();
      node = node.parentElement as HTMLElement | null;
    }
    return "Unknown Video";
  };

  const attachPlayers = () => {
    const iframes = Array.from(
      document.querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="youtube.com/embed"]'
      )
    );

    const originParam = `origin=${encodeURIComponent(window.location.origin)}`;

    iframes.forEach((iframe) => {
      if (attachedIframes.current.has(iframe)) return;

      const src0 = iframe.getAttribute("src") || "";
      let patchedSrc = src0;
      if (!/enablejsapi=1/i.test(patchedSrc)) {
        patchedSrc += (patchedSrc.includes("?") ? "&" : "?") + "enablejsapi=1";
      }
      if (!/[\?&]origin=/.test(patchedSrc)) {
        patchedSrc += (patchedSrc.includes("?") ? "&" : "?") + originParam;
      }

      const bind = () => {
        // @ts-ignore
        const YTglobal = (window as any).YT;
        if (!(YTglobal && YTglobal.Player)) return;
        // @ts-ignore
        const player = new YTglobal.Player(iframe, {
          events: {
            onStateChange: (event: any) => {
              const t = getIframeTitle(iframe);
              // @ts-ignore
              const S = (window as any).YT.PlayerState;
              if (event.data === S.PLAYING) {
                setActiveTitle(t);
                activeTitleRef.current = t;
                isPlayingRef.current = true;
              } else if (
                event.data === S.PAUSED ||
                event.data === S.ENDED ||
                event.data === S.UNSTARTED
              ) {
                isPlayingRef.current = false;
              }
            },
          },
        });
        attachedIframes.current.add(iframe);
      };

      const needsPatch = patchedSrc !== src0;
      if (needsPatch) {
        iframe.addEventListener("load", bind, { once: true });
        iframe.setAttribute("src", patchedSrc);
      } else {
        bind();
      }
    });
  };

  useEffect(() => {
    const setup = () => {
      attachPlayers();
      const mo = new MutationObserver(() => attachPlayers());
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"],
      });
      return () => mo.disconnect();
    };

    if ((window as any).YT?.Player) {
      const teardown = setup();
      return teardown;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = setup;
  }, [open]);

  useEffect(() => {
    const id = setInterval(() => {
      if (isPlayingRef.current && activeTitleRef.current) {
        const key = activeTitleRef.current;
        setWatchData((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // -------------------- Filtering & Category logic --------------------

  const matchesCategory = (pl: Playlist) => {
    const c = (pl as any).category || null;
    const stream = (pl as any).stream || null;
    const subject = (pl as any).subject || null;
    const grade = (pl as any).grade || null;

    if (!selectedCategory) return true; // no category chosen -> everything eligible

    if (selectedCategory === "Curriculum") {
      if (c !== "Curriculum") return false;
      if (selectedStream && stream !== selectedStream) return false;
      if (selectedSubject && subject !== selectedSubject) return false;
      return true;
    }

    // STEAM: filter by category and optional selectedClass
    if (selectedCategory === "STEAM") {
      if (c !== "STEAM") return false;
      if (selectedClass) {
        // equality check; if your playlists use ranges like "6-8" consider expanding logic
        if (!grade) return false;
        // simple match: grade could be "6", "7" or "6-8". Accept exact or ranges that include selected class.
        if (grade === selectedClass) return true;
        // handle simple ranges like "6-8"
        if (grade.includes("-")) {
          const [a, b] = grade.split("-").map((x: string) => parseInt(x, 10));
          const s = parseInt(selectedClass, 10);
          if (!isNaN(a) && !isNaN(b) && s >= a && s <= b) return true;
        }
        return false;
      }
      return true;
    }

    if (selectedCategory === "Technical") {
      return c === "Technical";
    }

    if (selectedCategory === "Project") {
      return c === "Project";
    }

    if (selectedCategory === "Trending") {
      return c === "Trending";
    }

    return true;
  };

  const filteredBase = useMemo(() => {
    return PLAYLISTS.filter((p: Playlist) => {
      const matchesQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.provider.toLowerCase().includes(q.toLowerCase()) ||
        p.topics.some((t) => t.toLowerCase().includes(q.toLowerCase()));
      const matchesTopic = topic === "All" || p.topics.includes(topic);
      const matchesProvider = provider === "All" || p.provider === provider;
      const matchesLang = language === "All" || p.language === language;
      return matchesQ && matchesTopic && matchesProvider && matchesLang;
    });
  }, [q, topic, provider, language]);

  const displayed = useMemo(() => {
    let list = filteredBase.filter((pl) => matchesCategory(pl));

    if (selectedCategory === "Technical" && techTopic) {
      const t = techTopic.toLowerCase();
      list = list.filter((pl) => {
        const topics = pl.topics.map((x) => x.toLowerCase());
        if (t === "languages") {
          return topics.some((tt) =>
            ["cpp", "c++", "java", "python", "rust", "javascript", "js", "go"].includes(
              tt
            )
          );
        }
        if (t === "dsa") {
          return topics.some(
            (tt) =>
              tt.includes("dsa") || tt.includes("data") || tt.includes("algorithm")
          );
        }
        if (t === "interview") {
          return topics.some(
            (tt) =>
              tt.includes("interview") ||
              tt.includes("problem") ||
              tt.includes("leetcode") ||
              tt.includes("gfg")
          );
        }
        return topics.includes(t);
      });
      list = list.sort((a: any, b: any) => (b.prominence || 0) - (a.prominence || 0));
    }

    return list;
  }, [
    filteredBase,
    selectedCategory,
    selectedStream,
    selectedSubject,
    techTopic,
    selectedClass,
  ]);

  const chartData = useMemo(
    () =>
      Object.entries(watchData).map(([name, seconds]) => ({
        name,
        value: +(seconds / 60).toFixed(2),
      })),
    [watchData]
  );

  const getEmbedUrl = (pl: Playlist) =>
    pl.youtube.kind === "playlist"
      ? `https://www.youtube.com/embed/videoseries?list=${pl.youtube.playlistId}&enablejsapi=1`
      : `https://www.youtube.com/embed/${pl.youtube.videoId}?enablejsapi=1`;

  const getExternalUrl = (pl: Playlist) =>
    pl.youtube.kind === "playlist"
      ? `https://www.youtube.com/playlist?list=${pl.youtube.playlistId}`
      : `https://www.youtube.com/watch?v=${pl.youtube.videoId}`;

  const LabelComp = (p: any) => <PieLabel {...p} small={isSmall} />;

  // Helper for streams list: derive existing streams from PLAYLISTS (Curriculum category)
  const streams = useMemo(() => {
    const s = new Set<string>();
    PLAYLISTS.forEach((pl) => {
      if ((pl as any).category === "Curriculum" && (pl as any).stream) {
        s.add((pl as any).stream);
      }
    });
    // fallback default streams if none present
    return Array.from(s).length ? Array.from(s) : ["CSE", "AI/ML", "CYBER_SECURITY"];
  }, []);

  // Helper: classes for STEAM selector
  const classes = ["6", "7", "8", "9", "10", "11", "12"];

  // Helper to open playlist uniformly
  const handleOpen = (p: Playlist) => {
    setOpen(p);
    setActiveTitle(p.title);
    activeTitleRef.current = p.title;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-3 sm:px-6">
        <div className="mt-4 sm:mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-slate-900/20 p-3 sm:p-4 md:p-6">
          <h1 className="text-[1.6rem] leading-tight sm:text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300">
            Explore Playlists • Learn Faster
          </h1>
          <p className="mt-2 max-w-3xl text-xs sm:text-sm md:text-base text-gray-300">
            Hand-picked playlists arranged by topic. Filter by provider & language. Track your learning with live stats 📊
          </p>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative sm:col-span-2 min-w-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, provider or topic…"
                className="w-full rounded-lg border border-gray-800 bg-white/5 px-9 py-2.5 sm:py-3 text-gray-100 outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-gray-800 bg-[#0b1021] px-3 py-2.5 sm:py-3 text-sm text-gray-100 focus:border-purple-500"
            >
              <option value="All">All Providers</option>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full min-w-0 rounded-lg border border-gray-800 bg-[#0b1021] px-3 py-2.5 sm:py-3 text-sm text-gray-100 focus:border-purple-500"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Mixed">Mixed</option>
            </select>

            {/* Class Selector for STEAM (appears only when STEAM category selected) */}
            {selectedCategory === "STEAM" && (
              <select
                value={selectedClass || ""}
                onChange={(e) =>
                  setSelectedClass(e.target.value ? e.target.value : null)
                }
                className="w-full min-w-0 rounded-lg border border-gray-800 bg-[#0b1021] px-3 py-2.5 sm:py-3 text-sm text-gray-100 focus:border-purple-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Tiles */}
          <CategoryTiles
            selected={selectedCategory}
            onSelect={(c) => {
              setSelectedCategory(c);
              setSelectedStream(null);
              setSelectedSubject(null);
              setSubjectQ("");
              setTechTopic(null);
              setSelectedClass(null);
            }}
          />

          {/* Stats */}
          <div className="mt-3 sm:mt-4">
            <button
              onClick={() => setChartOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-white/5 px-3 py-2 text-xs sm:text-sm text-gray-200 hover:border-purple-500"
            >
              <PieIcon size={16} /> Stats
            </button>

            {chartOpen && (
              <div className="mt-3 rounded-xl border border-white/10 bg-[#0b1021]/95 p-3 sm:p-4 shadow-2xl">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-200">
                    Your study time (minutes)
                    {activeTitle ? ` • Now playing: ${activeTitle}` : ""}
                  </span>
                  <button onClick={() => setChartOpen(false)} className="shrink-0">
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                {chartData.length === 0 ? (
                  <div className="grid h-[clamp(200px,45vw,360px)] place-items-center rounded-lg border border-dashed border-white/10 text-xs sm:text-sm text-gray-400">
                    Start a video (inline or modal). The chart updates only while playing.
                  </div>
                ) : (
                  <div style={{ height: "clamp(220px, 48vw, 400px)" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <filter
                            id="softShadow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                          >
                            <feDropShadow
                              dx="0"
                              dy="6"
                              stdDeviation="8"
                              floodOpacity={0.25}
                            />
                          </filter>
                        </defs>

                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="54%"
                          innerRadius={isSmall ? 44 : 58}
                          outerRadius={isSmall ? 94 : 126}
                          isAnimationActive={false}
                          stroke="none"
                          filter="url(#softShadow)"
                        >
                          {chartData.map((_, i) => (
                            <Cell
                              key={`depth-${i}`}
                              fill={darken(COLORS[i % COLORS.length], 0.36)}
                            />
                          ))}
                        </Pie>

                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={isSmall ? 40 : 52}
                          outerRadius={isSmall ? 90 : 120}
                          label={isSmall ? false : <LabelComp />}
                          labelLine={!isSmall}
                          isAnimationActive
                        >
                          {chartData.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={COLORS[i % COLORS.length]}
                              style={{
                                cursor: "pointer",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e: any) => {
                                (e.target as HTMLElement).style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e: any) => {
                                (e.target as HTMLElement).style.transform = "scale(1)";
                              }}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(v: any, _n: any, p: any) => [`${v} min`, p?.payload?.name]}
                          contentStyle={{
                            background: "rgba(9,12,28,.98)",
                            border: "1px solid rgba(255,255,255,.25)",
                          }}
                          itemStyle={{ color: "#f8fafc" }}
                          labelStyle={{ color: "#cbd5e1" }}
                          wrapperStyle={{ outline: "none" }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{
                            color: "#e5e7eb",
                            fontSize: isSmall ? "0.8rem" : "0.9rem",
                            paddingTop: 8,
                            maxWidth: "100%",
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto mt-5 sm:mt-6 w-full max-w-7xl px-3 sm:px-6">
        <TopicFilter
          topics={["All", ...TOPICS]}
          selected={topic}
          onSelect={setTopic}
        />
      </section>

      {/* CONDITIONAL: Category specific controls */}
      <section className="mx-auto mt-5 sm:mt-6 w-full max-w-7xl px-3 sm:px-6">
        {selectedCategory === "Curriculum" && (
          <div>
            <div className="mt-3">
              <span className="text-sm font-semibold text-gray-200">Select Stream</span>
              <div className="mt-2">
                <StreamSelector
                  streams={streams}
                  selected={selectedStream}
                  onSelect={(s) => {
                    setSelectedStream(s);
                    setSelectedSubject(null);
                    setSubjectQ("");
                  }}
                />
              </div>
            </div>

            {selectedStream && (
              <div className="mt-4">
                <div className="flex gap-3 items-center">
                  <input
                    value={subjectQ}
                    onChange={(e) => setSubjectQ(e.target.value)}
                    placeholder={`Search subjects in ${selectedStream}...`}
                    className="rounded-lg border bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-purple-500"
                  />
                </div>

                <SubjectList
                  stream={selectedStream}
                  query={subjectQ}
                  onSelect={(s) => setSelectedSubject(s)}
                />
              </div>
            )}

            {/* When subject chosen, show playlists for that subject */}
            {selectedSubject && (
              <div className="mt-6">
                <TopicGrid
                  items={displayed}
                  onOpen={handleOpen}
                  emptyMessage="No playlists found for the chosen subject."
                />
              </div>
            )}
          </div>
        )}

        {selectedCategory === "Technical" && (
          <div>
            <div className="mt-2 flex gap-3 items-center">
              {["DSA", "Languages", "Interview"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTechTopic((cur) => (cur === t ? null : t))}
                  className={`px-3 py-1 rounded-md border ${techTopic === t ? "border-purple-500 bg-white/5" : "border-white/6"
                    }`}
                >
                  {t}
                </button>
              ))}
              <div className="ml-auto text-sm text-gray-400">Tip: use search to narrow by language/problem.</div>
            </div>

            <div className="mt-4">
              <TopicGrid
                items={displayed}
                onOpen={handleOpen}
                emptyMessage="No technical playlists match your filters."
              />
            </div>
          </div>
        )}

        {selectedCategory === "Project" && (
          <div>
            <div className="mt-3 text-sm text-gray-300">Project-based learning — grouped project playlists and full courses.</div>
            <div className="mt-4">
              <TopicGrid
                items={displayed}
                onOpen={handleOpen}
                emptyMessage="No project playlists available yet."
              />
            </div>
          </div>
        )}

        {selectedCategory === "Trending" && (
          <div>
            <div className="mt-3 text-sm text-gray-300">Trending topics & industry resources — curated feeds and playlists.</div>
            <div className="mt-4">
              <TopicGrid
                items={displayed}
                onOpen={handleOpen}
                emptyMessage='No trending items yet — seed with "Generative AI", "Cloud", "Cybersecurity".'
              />
            </div>
          </div>
        )}

        {selectedCategory === "STEAM" && (
          <div>
            <div className="mt-3 text-sm text-gray-300">
              STEAM curated lessons (Grades 6–12). Choose a class above to filter packs, or leave "All Classes".
            </div>
            <div className="mt-4">
              <TopicGrid
                items={displayed}
                onOpen={handleOpen}
                emptyMessage="No STEAM packs match your filters."
              />
            </div>
          </div>
        )}

        {!selectedCategory && (
          <div className="mt-4">
            <TopicGrid
              items={displayed}
              onOpen={handleOpen}
              emptyMessage="No playlists found."
            />
          </div>
        )}
      </section>

      {/* Modal */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div>
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full rounded-xl"
                src={getEmbedUrl(open)}
                title={open.title}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-xs sm:text-sm text-gray-400">{open.description}</p>
            <a
              href={getExternalUrl(open)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 sm:px-4 py-2 text-sm text-gray-200 hover:bg-white/20"
            >
              <ExternalLink size={16} /> Open on YouTube
            </a>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        select, select option { color: #e5e7eb; background: #0b1021; }
      `}</style>
    </div>
  );
}
