"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, PlayCircle, XCircle, AlertTriangle, ArrowUpCircle, BadgeCheck } from "lucide-react";
import type { Playlist } from "@/lib/playlists";
import { buildEmbedSrc, buildExternalUrl } from "@/lib/youtube";
import { upvoteTutorUpload } from "@/lib/userUploads";

type PlaylistExt = Playlist & {
  isTutorUpload?: boolean;
  uploaderName?: string;
  upvotes?: number;
};

export default function PlaylistCard({
  item,
  onOpen,
  onUpvoteComplete
}: {
  item: PlaylistExt;
  onOpen: (pl: PlaylistExt) => void;
  onUpvoteComplete?: () => void;
}) {
  const [playInside, setPlayInside] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(item.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const loadTimeout = useRef<number | null>(null);

  const embedUrl = useMemo(() => buildEmbedSrc(item.youtube), [item.youtube]);
  const externalUrl = useMemo(() => buildExternalUrl(item.youtube), [item.youtube]);

  useEffect(() => {
    setLocalUpvotes(item.upvotes || 0);
  }, [item.upvotes]);

  useEffect(() => {
    if (!playInside) return;
    setEmbedReady(false);
    setEmbedError(false);
    loadTimeout.current = window.setTimeout(() => {
      setEmbedError(true);
    }, 3500);
    return () => {
      if (loadTimeout.current) window.clearTimeout(loadTimeout.current);
    };
  }, [playInside, embedUrl]);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUpvoted || !item.isTutorUpload) return;
    upvoteTutorUpload(item.id);
    setLocalUpvotes(prev => prev + 1);
    setHasUpvoted(true);
    if(onUpvoteComplete) onUpvoteComplete();
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className={`group relative rounded-2xl border ${item.isTutorUpload ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-gradient-to-br from-[#120a1f] to-[#0b0614]' : 'border-white/10 bg-gradient-to-br from-gray-900/40 to-black/60'} backdrop-blur-xl p-5 shadow-lg flex flex-col`}
    >
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${item.isTutorUpload ? 'from-purple-600/20' : 'from-blue-600/10'} via-transparent to-transparent`} />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            {item.isTutorUpload ? (
              <span className="flex items-center gap-1 font-semibold text-purple-400">
                <BadgeCheck size={14} /> {item.uploaderName}
              </span>
            ) : (
              <span className="font-semibold text-gray-300">{item.provider}</span>
            )}
            <span>• {item.language}</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
        </div>
        <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-gray-300 font-medium tracking-wide">
          {item.level}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-400 line-clamp-2 min-h-[40px] flex-grow">{item.description}</p>

      {/* Inline Player */}
      {playInside ? (
        <div className="mt-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-black/60 ring-1 ring-white/10">
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => {
                setEmbedReady(true);
                if (loadTimeout.current) window.clearTimeout(loadTimeout.current);
              }}
            />
          </div>

          {!embedReady && embedError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                This video/playlist can’t be embedded directly.
                <div className="mt-2">
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 transition text-gray-100 text-xs"
                  >
                    <ExternalLink size={14} /> Open on YouTube
                  </a>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setPlayInside(false)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 transition text-sm"
          >
            <XCircle size={16} /> Close Player
          </button>
        </div>
      ) : (
        <div className="mt-5 flex items-center flex-wrap gap-2">
          <button
            onClick={() => setPlayInside(true)}
            className="inline-flex flex-1 justify-center items-center gap-2 rounded-xl px-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition text-white text-sm font-semibold shadow-md"
          >
            <PlayCircle size={18} fill="currentColor" className="text-white/20" /> Play Inline
          </button>

          <button
            onClick={() => onOpen(item)}
            className="inline-flex items-center justify-center rounded-xl p-2.5 bg-white/5 hover:bg-white/10 transition text-gray-300"
            title="Open in Modal"
          >
            <ExternalLink size={20} />
          </button>

          {item.isTutorUpload && (
             <button
             onClick={handleUpvote}
             disabled={hasUpvoted}
             className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 transition text-sm font-semibold ${hasUpvoted ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
           >
             <ArrowUpCircle size={18} className={hasUpvoted ? 'fill-green-500/20' : ''} /> 
             {localUpvotes}
           </button>
          )}
        </div>
      )}

      {/* Topics */}
      {item.topics?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.topics.slice(0,3).map(t =>(
             <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5">#{t}</span>
          ))}
          {item.topics.length > 3 && <span className="text-[10px] px-2 py-0.5 text-gray-500">+{item.topics.length - 3}</span>}
        </div>
      )}
    </motion.div>
  );
}
