"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { nanoid } from "nanoid";

type ChatMsg = { id: string; user: string; text: string; ts: number };

export default function ChatPanel({
  problemId,
  displayName, // pass current user's display name (fallback provided)
}: {
  problemId: string | number | undefined;
  displayName?: string;
}) {
  const room = useMemo(
    () => (problemId ? `problem-${problemId}` : "problem-unknown"),
    [problemId]
  );

  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const me = displayName?.trim() || useMemo(() => {
    // lightweight anonymous name
    const animals = ["Falcon", "Panda", "Wolverine", "Orca", "Cobra", "Lynx", "Viper", "Mantis"];
    return `Guest-${animals[Math.floor(Math.random() * animals.length)]}-${(Math.random() * 100 | 0)}`;
  }, []);

  useEffect(() => {
    // Ping the API route so Socket.IO server is created (dev-friendly)
    fetch("/api/socket").finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const socket = getSocket();

    const onHistory = (history: ChatMsg[]) => setMsgs(history);
    const onMessage = (msg: ChatMsg) => setMsgs((m) => [...m, msg]);
    const onTyping = ({ user }: { user: string }) => {
      setTyping(user);
      const id = setTimeout(() => setTyping(null), 1500);
      return () => clearTimeout(id);
    };

    socket.emit("joinRoom", room);
    socket.on("chat:history", onHistory);
    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);

    return () => {
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [ready, room]);

  useEffect(() => {
    // autoscroll
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    const textTrim = text.trim();
    if (!textTrim) return;
    const msg: ChatMsg = { id: nanoid(), user: me, text: textTrim, ts: Date.now() };
    getSocket().emit("chat:message", { room, msg });
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
    else {
      getSocket().emit("chat:typing", { room, user: me });
    }
  };

  return (
    <div className="h-[calc(100%-2px)] grid grid-rows-[1fr_auto] rounded-xl border border-white/10 bg-[rgba(9,12,24,.6)]">
      {/* Messages */}
      <div ref={listRef} className="overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && (
          <div className="text-xs text-slate-400">
            Be the first to discuss this problem. Keep hints subtle; no full solutions during live matches.
          </div>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[90%] sm:max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.user === me ? "ml-auto bg-indigo-600/30 border border-indigo-400/30" : "bg-white/5 border border-white/10"
            }`}
          >
            <div className="text-[11px] text-slate-400 mb-0.5">
              {m.user} • {new Date(m.ts).toLocaleTimeString()}
            </div>
            <div className="whitespace-pre-wrap break-words">{m.text}</div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 p-2">
        {typing && typing !== me && (
          <div className="text-[11px] text-slate-400 px-1 pb-1">{typing} is typing…</div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Discuss approaches (no full solutions)…"
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
          <button
            onClick={send}
            className="btn btn-primary text-sm"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
