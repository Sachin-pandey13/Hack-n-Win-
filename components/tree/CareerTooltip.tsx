"use client"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const BOX_W = 420;
const OFFSET = 16;

export default function CareerTooltip({
  career,
  position,
}: {
  career: any;
  position: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ left: -9999, top: -9999, visible: false });

  // Only mount portal on client
  useEffect(() => { setMounted(true); }, []);

  // Recalculate position whenever cursor moves
  useLayoutEffect(() => {
    if (!position || !mounted) {
      setPos(p => ({ ...p, visible: false }));
      return;
    }

    const { x: cx, y: cy } = position;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Height is unknown until after render — default to 380
    const boxH = ref.current?.offsetHeight ?? 380;

    // Horizontal: prefer right of cursor, flip left if overflows
    let left = cx + OFFSET;
    if (left + BOX_W > vw - 8) {
      left = cx - BOX_W - OFFSET;
    }
    // Hard clamp so it never goes off either edge
    left = Math.max(8, Math.min(left, vw - BOX_W - 8));

    // Vertical: prefer below cursor, flip above if overflows
    let top = cy + OFFSET;
    if (top + boxH > vh - 8) {
      top = cy - boxH - OFFSET;
    }
    // Hard clamp
    top = Math.max(8, Math.min(top, vh - boxH - 8));

    setPos({ left, top, visible: true });
  }, [position?.x, position?.y, mounted]);

  if (!career || !mounted) return null;

  const tooltip = (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: BOX_W,
        zIndex: 99999,
        pointerEvents: "none",
        opacity: pos.visible ? 1 : 0,
        transition: "left 80ms ease, top 80ms ease, opacity 100ms ease",
      }}
      className="rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20
        shadow-[0_0_40px_rgba(255,42,109,0.4)] text-white"
    >
      {/* Inner scroll wrapper — content never exceeds 70vh */}
      <div
        style={{ maxHeight: "70vh", overflowY: "auto" }}
        className="p-5"
      >
        {/* ── Header ── */}
        <div className="mb-4 border-b border-white/10 pb-3">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 to-orange-400
            bg-clip-text text-transparent leading-tight">
            {career.name}
          </h3>
          {(career.exam || career.duration) && (
            <p className="text-[11px] text-gray-300 font-bold mt-1 tracking-wider uppercase">
              {career.exam || "Specialization"}
              {career.duration ? ` • ${career.duration}` : ""}
            </p>
          )}
        </div>

        {/* ── Key Subjects ── */}
        {career.subjects && (
          <div className="mb-4">
            <b className="text-[10px] text-pink-400 uppercase tracking-widest block mb-2">
              Key Subjects / Pattern
            </b>
            <div className="flex flex-wrap gap-1.5">
              {career.subjects.map((sub: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-white/10
                    border border-white/10 rounded-full"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          {career.fields && (
            <div>
              <b className="text-[10px] text-pink-400 uppercase tracking-widest block mb-1.5">
                Broad Fields
              </b>
              <ul className="space-y-1 text-gray-300">
                {career.fields.map((f: any, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {career.core && (
            <div>
              <b className="text-[10px] text-pink-400 uppercase tracking-widest block mb-1.5">
                Core Engineering
              </b>
              <ul className="space-y-1 text-gray-300">
                {career.core.map((f: any, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {career.skills && (
            <div>
              <b className="text-[10px] text-purple-400 uppercase tracking-widest block mb-1.5">
                Tech Stack / Skills
              </b>
              <ul className="space-y-1 text-gray-300">
                {career.skills.map((c: any, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {career.career && (
            <div className={!career.fields && !career.skills ? "col-span-2" : "col-span-1"}>
              <b className="text-[10px] text-orange-400 uppercase tracking-widest block mb-1.5">
                Outcome Careers
              </b>
              <ul className="space-y-1 text-gray-300">
                {career.career.map((c: any, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ⚠️ Portal: mounts directly under <body> → escapes ALL parent stacking contexts
  // (including will-change:transform from PageTransition which breaks position:fixed)
  return createPortal(tooltip, document.body);
}