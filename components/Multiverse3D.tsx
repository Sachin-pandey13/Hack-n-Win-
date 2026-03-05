// components/Multiverse3D.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import * as THREE from "three";

type Phase = "lobby" | "matchmaking" | "rules" | "playing" | "eliminated" | "result";

export default function Multiverse3D({ phase }: { phase: Phase }) {
  const isMobile = useIsMobile(1024);

  // renderer props compatibility guard
  const glProps: any = { antialias: !isMobile, alpha: true };
  try {
    const ColorSpace = (THREE as any).ColorSpace;
    if (ColorSpace && ColorSpace.SRGB !== undefined) glProps.outputColorSpace = ColorSpace.SRGB;
    else if ((THREE as any).sRGBEncoding !== undefined) glProps.outputEncoding = (THREE as any).sRGBEncoding;
  } catch {
    /* ignore */
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Canvas
        gl={glProps}
        dpr={isMobile ? [1, 1.25] : [1, 2]}
        camera={{ fov: isMobile ? 60 : 55, position: [0, 0, 9] }}
        frameloop={isMobile ? "demand" : "always"}
      >
        <color attach="background" args={["#070b1a"]} />
        {!isMobile && <fog attach="fog" args={["#070b1a", 12, 28]} />}
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />
        <directionalLight position={[-6, -2, -4]} intensity={0.4} />

        <ParallaxRig phase={phase} />

        <Starfield phase={phase} />
        {!isMobile && <NebulaSheets phase={phase} />}
        {!isMobile && <FloatingRings phase={phase} />}
      </Canvas>
    </div>
  );
}

/* ---------- small helpers ---------- */
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ---------- Camera parallax rig ---------- */
function ParallaxRig({ phase }: { phase: Phase }) {
  const group = useRef<THREE.Group | null>(null);
  const target = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // typed params to silence TS implicit any
  useFrame((state: any, dt: number) => {
    const k = phase === "matchmaking" ? 0.7 : phase === "playing" ? 0.5 : 0.35;
    if (group.current) {
      group.current.rotation.y += (target.current.x * 0.15 - group.current.rotation.y) * (4 * dt);
      group.current.rotation.x += (-target.current.y * 0.12 - group.current.rotation.x) * (4 * dt);
      group.current.position.z += ((phase === "matchmaking" ? -0.6 : -0.3) - group.current.position.z) * (2 * dt);
      group.current.scale.setScalar(1 + k * 0.05);
    }

    // gentle camera lerp using state.camera (safer in TS)
    try {
      const cam: THREE.Camera = state.camera as THREE.Camera;
      const to = new THREE.Vector3(0, 0, phase === "playing" ? 6.8 : 9);
      cam.position.lerp(to, 0.02);
      // camera.lookAt exists on PerspectiveCamera; cast for safety
      if ((cam as any).lookAt) (cam as any).lookAt(0, 0, 0);
    } catch {
      // ignore camera issues in weird environments
    }
  });

  return <group ref={group} />;
}

/* ---------- Starfield ---------- */
function Starfield({ phase }: { phase: Phase }) {
  const speed = phase === "matchmaking" ? 0.6 : phase === "playing" ? 0.35 : 0.2;
  return <Stars radius={90} depth={40} count={7000} factor={3} saturation={0} fade speed={speed} />;
}

/* ---------- Nebula sheets ---------- */
function NebulaSheets({ phase }: { phase: Phase }) {
  const speed = phase === "matchmaking" ? 1.4 : 0.9;
  const opacity = phase === "playing" ? 0.22 : 0.28;

  return (
    <>
      <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh position={[0, 0, -4]}>
          <planeGeometry args={[40, 26, 32, 32]} />
          <meshStandardMaterial
            transparent
            opacity={opacity}
            color={"#4f46e5"}
            roughness={0.9}
            metalness={0.1}
            emissive={"#4338ca"}
            emissiveIntensity={0.45}
          />
        </mesh>
      </Float>

      <Float speed={speed * 1.1} rotationIntensity={0.25} floatIntensity={0.5}>
        <mesh position={[0, 0, -8]} rotation={[0, Math.PI / 8, 0]}>
          <planeGeometry args={[60, 36, 16, 16]} />
          <meshStandardMaterial
            transparent
            opacity={opacity * 0.7}
            color={"#22d3ee"}
            roughness={1}
            metalness={0.05}
            emissive={"#0ea5e9"}
            emissiveIntensity={0.25}
          />
        </mesh>
      </Float>
    </>
  );
}

/* ---------- Floating rings ---------- */
function FloatingRings({ phase }: { phase: Phase }) {
  const speed = phase === "matchmaking" ? 1.8 : phase === "playing" ? 1.2 : 0.8;

  return (
    <>
      <Float speed={speed} rotationIntensity={0.6} floatIntensity={0.9}>
        <mesh position={[-2.6, 1.1, -1.2]} rotation={[0.4, 0.2, 0]}>
          <torusKnotGeometry args={[0.9, 0.24, 220, 16]} />
          <meshPhysicalMaterial
            transparent
            color={"#a78bfa"}
            opacity={0.45}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1}
            clearcoatRoughness={0.2}
          />
        </mesh>
      </Float>

      <Float speed={speed * 0.9} rotationIntensity={0.4} floatIntensity={0.7}>
        <mesh position={[2.4, -1.2, -0.6]} rotation={[-0.3, 0.4, 0.1]}>
          <torusKnotGeometry args={[0.7, 0.18, 180, 12]} />
          <meshPhysicalMaterial
            transparent
            color={"#34d399"}
            opacity={0.35}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </Float>
    </>
  );
}
