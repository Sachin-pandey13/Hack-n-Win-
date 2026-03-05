"use client";
import confetti from "canvas-confetti";

export default function useConfetti() {
  return () => {
    const end = Date.now() + 700;
    const colors = ["#22c55e","#a78bfa","#38bdf8","#f472b6"];
    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };
}
