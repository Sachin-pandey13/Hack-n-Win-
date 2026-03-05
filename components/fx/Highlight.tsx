"use client";
import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";

export default function Highlight({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const a = annotate(ref.current, { type: "highlight", color: "#7c3aed66", multiline: true, padding: 6 });
    a.show();
  }, []);
  return <span ref={ref}>{children}</span>;
}
