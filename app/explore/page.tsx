"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { PLAYLISTS, TOPICS, PROVIDERS, type Playlist } from "@/lib/playlists";
import { Search, ExternalLink, UploadCloud, Rocket } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import CategoryTiles from "@/components/explore/CategoryTiles";
import StreamSelector from "@/components/explore/StreamSelector";
import SubjectList from "@/components/explore/SubjectList";
import TopicGrid from "@/components/explore/TopicGrid";
import UploadModal from "@/components/explore/UploadModal";
import PlaylistCard from "@/components/cards/PlaylistCard";
import { getTutorUploads, type TutorUpload } from "@/lib/userUploads";
import { motion } from "framer-motion";

export default function ExplorePage() {
  // base filters
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState<"All" | string>("All");
  const [language, setLanguage] = useState<"All" | "English" | "Hindi" | "Mixed">("All");
  const [open, setOpen] = useState<Playlist | TutorUpload | null>(null);

  // new explore state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectQ, setSubjectQ] = useState<string>("");
  const [techTopic, setTechTopic] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Preference derived overrides
  const [userCareer, setUserCareer] = useState<string | null>(null);
  const [userSubField, setUserSubField] = useState<string | null>(null);

  // Tutor Uploads
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tutorUploads, setTutorUploads] = useState<TutorUpload[]>([]);

  // Refs for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);

  const isCseTargeted = userCareer === "Engineering" && userSubField === "CSE" && !selectedCategory;

  useEffect(() => {
    if (!isCseTargeted && (selectedSubject || techTopic)) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [selectedSubject, techTopic, isCseTargeted]);

  useEffect(() => {
    async function loadPreference() {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "user_preferences", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const pref = snap.data();
      setUserCareer(pref.career || null);
      setUserSubField(pref.subField || null);
      setSelectedStream(pref.stream || null);

      if (pref.career === "Engineering") {
        setSelectedCategory("Technical");
        setTechTopic("DSA");
      } else if (pref.career === "Medical") {
        setSelectedCategory("Curriculum");
        setSelectedSubject("Biology");
      } else if (pref.career === "Architecture") {
        setSelectedCategory("Project");
      }
    }
    loadPreference();
    setTutorUploads(getTutorUploads());
  }, []);

  const refreshUploads = () => {
    setTutorUploads(getTutorUploads());
  };

  const matchesCategory = (pl: Playlist | TutorUpload) => {
    const c = pl.category || null;
    const stream = pl.stream || null;
    const subject = pl.subject || null;
    const grade = pl.grade || null;

    if (!selectedCategory) return true;
    if (selectedCategory === "Curriculum") {
      if (selectedStream) {
        if (stream !== selectedStream) return false;
        if (selectedSubject && subject !== selectedSubject) return false;
        return true;
      }
      return c === "Curriculum";
    }
    if (selectedCategory === "STEAM") {
      if (c !== "STEAM") return false;
      if (selectedClass) {
        if (!grade) return false;
        if (grade === selectedClass) return true;
        if (grade.includes("-")) {
          const [a, b] = grade.split("-").map((x: string) => parseInt(x, 10));
          const s = parseInt(selectedClass, 10);
          if (!isNaN(a) && !isNaN(b) && s >= a && s <= b) return true;
        }
        return false;
      }
      return true;
    }
    if (selectedCategory === "Technical") return c === "Technical";
    if (selectedCategory === "Project") return c === "Project";
    if (selectedCategory === "Trending") return c === "Trending";
    return true;
  };

  const allItems = useMemo(() => [...tutorUploads, ...PLAYLISTS], [tutorUploads]);

  const filteredBase = useMemo(() => {
    return allItems.filter((p) => {
      const matchesQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.provider.toLowerCase().includes(q.toLowerCase()) ||
        p.topics.some((t) => t.toLowerCase().includes(q.toLowerCase()));
      const matchesProvider = provider === "All" || p.provider === provider;
      const matchesLang = language === "All" || p.language === language;
      return matchesQ && matchesProvider && matchesLang;
    });
  }, [q, provider, language, allItems]);

  const displayed = useMemo(() => {
    let list = filteredBase.filter((pl) => matchesCategory(pl));

    if (selectedCategory === "Technical" && techTopic) {
      const t = techTopic.toLowerCase();
      list = list.filter((pl) => {
        const topics = pl.topics.map((x) => x.toLowerCase());
        if (t === "languages") {
          return topics.some((tt) =>
            ["cpp", "c++", "java", "python", "rust", "javascript", "js", "go"].includes(tt)
          );
        }
        if (t === "dsa") {
          return topics.some(
            (tt) => tt.includes("dsa") || tt.includes("data") || tt.includes("algorithm")
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
      list = list.sort((a, b) => (b.prominence || 0) - (a.prominence || 0));
    }
    return list;
  }, [filteredBase, selectedCategory, selectedStream, selectedSubject, techTopic, selectedClass]);

  // Derived curated sections for CSE
  const csePlacementUploads = useMemo(() => tutorUploads.filter(t => t.subject === "CSE" || t.topics.includes("Placement")), [tutorUploads]);
  const cseDSA = useMemo(() => filteredBase.filter(p => p.category === "Technical" && p.topics.some(t => t.toLowerCase().includes("dsa"))), [filteredBase]);
  const cseCore = useMemo(() => filteredBase.filter(p => p.category === "Curriculum" && (p.stream === "CSE" || (!p.stream && Object.values(p.topics).some(t => ["dbms","os","compiler design", "computer networks"].includes(t.toLowerCase()))))), [filteredBase]);
  const cseTrending = useMemo(() => filteredBase.filter(p => !p.isTutorUpload && p.topics.some(t => t.toLowerCase().includes("web") || t.toLowerCase().includes("ai"))), [filteredBase]);

  const getEmbedUrl = (pl: Playlist | TutorUpload) =>
    pl.youtube.kind === "playlist"
      ? `https://www.youtube.com/embed/videoseries?list=${pl.youtube.playlistId}&enablejsapi=1`
      : `https://www.youtube.com/embed/${pl.youtube.videoId}?enablejsapi=1`;

  const getExternalUrl = (pl: Playlist | TutorUpload) =>
    pl.youtube.kind === "playlist"
      ? `https://www.youtube.com/playlist?list=${pl.youtube.playlistId}`
      : `https://www.youtube.com/watch?v=${pl.youtube.videoId}`;

  const streams = useMemo(() => {
    const s = new Set<string>();
    PLAYLISTS.forEach((pl) => {
      if (pl.category === "Curriculum" && pl.stream) {
        s.add(pl.stream);
      }
    });
    const arr = Array.from(s);
    ["CSE", "IT", "ECE", "EE", "ME", "CE"].forEach(st => {
      if(!arr.includes(st)) arr.push(st);
    });
    return arr;
  }, []);

  const classes = ["6", "7", "8", "9", "10", "11", "12"];

  const handleOpen = (p: Playlist | TutorUpload) => setOpen(p);

  const RenderSection = ({ title, items, icon: Icon }: { title: string, items: any[], icon: any }) => {
    if(!items || items.length === 0) return null;
    return (
      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
          <Icon className="text-purple-400" size={24} /> {title}
        </h2>
        <div className="flex overflow-x-auto pb-6 gap-5 snap-x hide-scrollbar" style={{ scrollbarWidth: "none" }}>
          {items.map((item) => (
            <div key={item.id} className="snap-start min-w-[300px] sm:min-w-[380px] w-full shrink-0">
               <PlaylistCard item={item} onOpen={handleOpen} onUpvoteComplete={refreshUploads} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95 overflow-x-hidden text-gray-100 selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        {/* Premium Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-[#050505] -z-10" />
          
          <div className="max-w-2xl">
            {isCseTargeted && (
               <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 tracking-wide text-xs font-bold uppercase mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 Tailored for CSE Placement
               </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 leading-tight">
              Elysium Community & Courses
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-400 max-w-xl">
              Elevate your learning with premium curated paths, community tutor uploads, and a highly focused placement roadmap.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-start md:justify-end">
            <button
               onClick={() => setIsUploadModalOpen(true)}
               className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-4 font-bold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
            >
               <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
               <UploadCloud size={24} className="group-hover:-translate-y-1 transition-transform" />
               <span className="text-left">
                  <div className="text-sm font-semibold tracking-wide text-purple-100">STARTUP PROGRAM</div>
                  <div className="text-lg leading-none">Share Your Knowledge</div>
               </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-20">
            <div className="relative sm:col-span-2 min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, tutor or topic…"
                className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-11 py-3.5 text-gray-100 outline-none focus:border-purple-500/80 focus:bg-white/10 transition shadow-inner"
              />
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b0b14] px-4 py-3.5 text-sm text-gray-200 focus:border-purple-500/80 transition"
            >
              <option value="All">All Providers</option>
              <option value="Tutor">Community Tutors</option>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b0b14] px-4 py-3.5 text-sm text-gray-200 focus:border-purple-500/80 transition"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Mixed">Mixed</option>
            </select>
        </div>

        {/* Categories */}
        <div className="relative z-20 mt-2">
            <CategoryTiles selected={selectedCategory} onSelect={(c) => {
              setSelectedCategory(c);
              setSelectedStream(null);
              setSelectedSubject(null);
              setSubjectQ("");
              setTechTopic(null);
              setSelectedClass(null);
            }} />
        </div>

        {/* CONTENT RENDERER */}
        <section className="mt-8 relative z-20">
          
          {/* Default CSE Targeted view */}
          {isCseTargeted && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <RenderSection title="Top Tutor Uploads" items={Object.values(tutorUploads)} icon={Rocket} />
                <RenderSection title="Placement Preparation (DSA)" items={cseDSA} icon={Rocket} />
                <RenderSection title="Core CSE Subjects" items={cseCore} icon={Rocket} />
                <RenderSection title="Trending Technologies" items={cseTrending} icon={Rocket} />
             </motion.div>
          )}

          {/* User Manually Selected Filters */}
          {!isCseTargeted && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                
                {/* Curriculum Sub-filters */}
                {selectedCategory === "Curriculum" && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                    <span className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3 block">Select Stream</span>
                    <StreamSelector streams={streams} selected={selectedStream} onSelect={(s) => { setSelectedStream(s); setSelectedSubject(null); setSubjectQ(""); }} />
                    {selectedStream && (
                      <div className="mt-5 pt-5 border-t border-white/10">
                        <SubjectList stream={selectedStream} query={subjectQ} onQueryChange={setSubjectQ} onSelect={(s) => setSelectedSubject(s)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Sub-filters */}
                {selectedCategory === "Technical" && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                    <span className="text-sm font-bold text-gray-300 uppercase tracking-widest block mb-3">Focus Area</span>
                    <div className="flex flex-wrap gap-3">
                      {["DSA", "Languages", "Interview"].map((t) => (
                        <button key={t} onClick={() => setTechTopic((cur) => (cur === t ? null : t))} className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${techTopic === t ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 scroll-mt-24" ref={resultsRef}>
                  {selectedSubject || techTopic || (!["Curriculum", "Technical"].includes(selectedCategory!)) ? (
                    <TopicGrid items={displayed} onOpen={handleOpen} emptyMessage="No playlists match your current filters." columns={{ base: 1, sm: 2, lg: 3 }} />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-gray-500">
                       Select deeper filters above to view content.
                    </div>
                  )}
                </div>
             </motion.div>
          )}
        </section>

      </div>

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={refreshUploads}
        defaultSubField={userSubField}
      />

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div>
            <div className="aspect-video w-full rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black">
              <iframe
                className="h-full w-full"
                src={getEmbedUrl(open)}
                title={open.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-4 text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{open.description}</p>
            <div className="mt-5 flex justify-end">
              <a
                href={getExternalUrl(open)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600/20 px-5 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-600/40 hover:text-white transition"
              >
                <ExternalLink size={16} /> Open externally
              </a>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
