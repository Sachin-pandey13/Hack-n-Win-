"use client";

import React from "react";

type Phase =
  | "lobby"
  | "matchmaking"
  | "rules"
  | "playing"
  | "eliminated"
  | "result";

export default function Multiverse3D({ phase }: { phase: Phase }) {
  const speed =
    phase === "matchmaking" ? "20s" : phase === "playing" ? "35s" : "50s";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* star layer */}
      <div className="stars" style={{ animationDuration: speed }} />

      {/* glow nebula */}
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />

      {/* rings */}
      <div className="ring ring-a" />
      <div className="ring ring-b" />

      <style jsx global>{`
        .stars {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
              2px 2px at 20% 30%,
              rgba(255, 255, 255, 0.6),
              transparent
            ),
            radial-gradient(
              2px 2px at 80% 60%,
              rgba(255, 255, 255, 0.6),
              transparent
            ),
            radial-gradient(
              1px 1px at 50% 80%,
              rgba(255, 255, 255, 0.5),
              transparent
            );
          animation: drift linear infinite;
        }

        @keyframes drift {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-120px);
          }
        }

        .nebula {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
        }

        .nebula-a {
          top: -200px;
          left: -150px;
          background: #4f46e5;
        }

        .nebula-b {
          bottom: -200px;
          right: -150px;
          background: #22d3ee;
        }

        .ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: spin 40s linear infinite;
        }

        .ring-a {
          width: 500px;
          height: 500px;
          top: 10%;
          left: 20%;
        }

        .ring-b {
          width: 700px;
          height: 700px;
          bottom: 5%;
          right: 10%;
          animation-duration: 70s;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}