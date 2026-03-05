"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, PlayCircle, XCircle, AlertTriangle } from "lucide-react";
import type { Playlist } from "@/lib/playlists";
import { buildEmbedSrc, buildExternalUrl } from "@/lib/youtube";

export default function PlaylistCard({
  item,
  onOpen,
}: {
  item: Playlist;
  onOpen: (pl: Playlist) => void;
}) {
  const [playInside, setPlayInside] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const loadTimeout = useRef<number | null>(null);

  const embedUrl = useMemo(() => buildEmbedSrc(item.youtube), [item.youtube]);
  const externalUrl = useMemo(() => buildExternalUrl(item.youtube), [item.youtube]);

  useEffect(() => {
    if (!playInside) return;
    // If the iframe doesn't onLoad within N ms, show fallback (most “owner disallowed” cases)
    setEmbedReady(false);
    setEmbedError(false);
    loadTimeout.current = window.setTimeout(() => {
      setEmbedError(true);
    }, 3500);
    return () => {
      if (loadTimeout.current) window.clearTimeout(loadTimeout.current);
    };
  }, [playInside, embedUrl]);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/70 to-gray-950/70 backdrop-blur-xl p-5 shadow-lg"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-transparent to-transparent" />

      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400">
            {item.provider} • {item.language}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-gray-300">
          {item.level}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-400 line-clamp-2">{item.description}</p>

      {/* Inline Player */}
      {playInside ? (
        <div className="mt-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-black/60">
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

          {/* Fallback if owner disallows embedding or invalid ID */}
          {!embedReady && embedError && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-700/50 bg-amber-900/20 p-3 text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                This video/playlist can’t be embedded (owner restrictions or an invalid ID).
                You can still watch it on YouTube.
                <div className="mt-2">
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 transition text-gray-100 text-sm"
                  >
                    <ExternalLink size={16} /> Open on YouTube
                  </a>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setPlayInside(false)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-red-600/80 hover:bg-red-500 transition text-white text-sm"
          >
            <XCircle size={18} /> Close Player
          </button>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setPlayInside(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-purple-600/80 hover:bg-purple-500 transition text-white text-sm"
          >
            <PlayCircle size={18} /> Play Inside
          </button>

          <button
            onClick={() => onOpen(item)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-green-600/80 hover:bg-green-500 transition text-white text-sm"
          >
            <PlayCircle size={18} /> Open in Modal
          </button>

          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 transition text-gray-200 text-sm"
          >
            <ExternalLink size={16} /> Open on YouTube
          </a>
        </div>
      )}

      {/* Topics */}
      {item.topics?.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">{item.topics.join(", ")}</div>
      )}
    </motion.div>
  );
}
