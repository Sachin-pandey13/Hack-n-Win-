"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

type Mode = "vanta-net" | "particles";

export default function AnimatedBackground({ mode = "vanta-net" as Mode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [vanta, setVanta] = useState<any>(null);

  // Vanta (Three.js) — client only
  useEffect(() => {
    if (mode !== "vanta-net") return;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = (await import("three")).default;
      const NET = (await import("vanta/dist/vanta.net.min")).default;

      if (!elRef.current) return;
      const v = NET({
        el: elRef.current,
        THREE,
        color: 0x5b21b6,       // purple
        backgroundColor: 0x0a1020,
        points: 10.0,
        maxDistance: 20.0,
        spacing: 16.0,
        mouseControls: true,
        touchControls: true,
      });
      setVanta(v);
      cleanup = () => v?.destroy?.();
    })();

    return () => cleanup?.();
  }, [mode]);

  // Particles fallback/option
  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine);
  };

  if (mode === "particles") {
    return (
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="pointer-events-none fixed inset-0 -z-10"
        options={{
          background: { color: "#0a1020" },
          fullScreen: { enable: false },
          fpsLimit: 60,
          interactivity: {
            events: { onHover: { enable: true, mode: "repulse" } },
            modes: { repulse: { distance: 120 } }
          },
          particles: {
            color: { value: "#7c3aed" },
            links: { enable: true, color: "#475569", distance: 140, opacity: 0.35 },
            move: { enable: true, speed: 0.6 },
            number: { density: { enable: true, area: 800 }, value: 60 },
            opacity: { value: 0.6 },
            size: { value: { min: 1, max: 2 } }
          }
        }}
      />
    );
  }

  return <div ref={elRef} className="pointer-events-none fixed inset-0 -z-10" />;
}
