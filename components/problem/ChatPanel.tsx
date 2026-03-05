"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { joinRoom } from "@/lib/socket";

type Msg = { id: string; name: string; text: string; ts: number };

export default function ChatPanel({ problemId, username }: { problemId: string; username: string }) {
  const room = useMemo(() => (problemId ? `problem:${problemId}` : "lobby"), [problemId]);
  const [online, setOnline] = useState(1);
  const [typing, setTyping] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const meId = useMemo(() => `u-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const socket = joinRoom({ room, userId: meId, name: username || "You" });
    if (!socket) return;

    const onHistory = (history: Msg[]) => setMsgs(history);
    const onMessage = (m: Msg) => setMsgs((prev) => [...prev, m]);
    const onPresence = ({ online }: { online: number }) => setOnline(online);
    const onTyping = ({ user, isTyping }: any) => setTyping(isTyping ? user?.name : null);

    socket.on("chat:history", onHistory);
    socket.on("chat:message", onMessage);
    socket.on("chat:presence", onPresence);
    socket.on("chat:typing", onTyping);

    return () => {
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onMessage);
      socket.off("chat:presence", onPresence);
      socket.off("chat:typing", onTyping);
    };
  }, [room, meId, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    const socket = joinRoom({ room, userId: meId, name: username || "You" });
    if (!socket || !text.trim()) return;
    socket.emit("chat:message", { room, text: text.trim() });
    setText("");
  };

  const onTypingChange = (val: string) => {
    setText(val);
    const socket = joinRoom({ room, userId: meId, name: username || "You" });
    socket?.emit("chat:typing", { room, isTyping: !!val });
  };

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      {/* header */}
      <div className="px-3 py-2 border-b border-white/10 text-xs text-slate-400">
        {online} online in this problem
      </div>

      {/* messages */}
      <div className="min-h-0 overflow-y-auto p-3 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className="max-w-[85%] rounded-lg px-3 py-2 bg-white/5">
            <div className="text-[11px] text-slate-400">{m.name}</div>
            <div className="text-sm text-slate-100">{m.text}</div>
          </div>
        ))}
        {typing && <div className="text-xs text-slate-400">{typing} is typing…</div>}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-2 border-t border-white/10 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => onTypingChange(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
          placeholder="Discuss approach (no full solutions during live battles!)…"
          className="flex-1 rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
        />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  );
}
