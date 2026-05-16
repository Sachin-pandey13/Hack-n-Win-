"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function TreeRenderer({
 stage,
 onClassClick,
 onStreamClick,
 onCareerClick,
 onSubFieldClick,
 onNodeDoubleClick,
 onCareerHover,
 careers,
 selectedClass,
 selectedStream,
 selectedCareer,
 selectedSubField
}: any) {
 
 // Offset all Y values so the tree fits comfortably in a 1400px tall SVG.
 const Y_OFFSET = 600;

 // --- COORDINATES ---
 // Origin of trunk is at the very bottom
 const trunkStart = { x: 500, y: 720 + Y_OFFSET };
 const trunkEnd = { x: 500, y: 560 + Y_OFFSET };

 const classNodes = [
  { id: "Class 10", x: 280, y: 460 + Y_OFFSET },
  { id: "Class 11", x: 500, y: 430 + Y_OFFSET },
  { id: "Class 12", x: 720, y: 460 + Y_OFFSET },
 ];

 const streamOffsets = [
  { dx: -180, dy: -170 }, // Left
  { dx: 0, dy: -190 },    // Center
  { dx: 180, dy: -170 },  // Right
 ];
 const streamsLists = ["Science", "Commerce", "Arts"];

 // STAGE 1: Selected Class
 const selectedClassNode = classNodes.find((c) => c.id === selectedClass);
 
 // STAGE 2: Stream Nodes
 let streamNodes: any[] = [];
 if (selectedClassNode) {
  streamNodes = streamsLists.map((s, i) => ({
   id: s,
   name: s,
   x: selectedClassNode.x + streamOffsets[i].dx,
   y: selectedClassNode.y + streamOffsets[i].dy,
  }));
 }
 const selectedStreamNode = streamNodes.find((s) => s.id === selectedStream);

 // STAGE 3: Career Nodes
 let careerNodes: any[] = [];
 if (selectedStreamNode && careers && careers.length > 0) {
  const count = careers.length;
  careerNodes = careers.map((c: any, i: number) => {
   const spacing = 160;
   const startDx = -((count - 1) * spacing) / 2;
   const dx = startDx + i * spacing;
   return {
    ...c,
    id: c.name,
    x: selectedStreamNode.x + dx,
    y: selectedStreamNode.y - 180,
   };
  });
 }
 const selectedCareerNode = careerNodes.find((c) => c.id === selectedCareer);

 // STAGE 4: SubField Nodes (e.g. CSE, AI/ML)
 let subFieldNodes: any[] = [];
 if (selectedCareerNode && selectedCareerNode.subBranches && stage >= 4) {
  const subs = selectedCareerNode.subBranches;
  const count = subs.length;
  subFieldNodes = subs.map((sub: any, i: number) => {
   const spacing = 140;
   const startDx = -((count - 1) * spacing) / 2;
   const dx = startDx + i * spacing;
   return {
    ...sub,
    id: sub.name,
    x: selectedCareerNode.x + dx,
    y: selectedCareerNode.y - 160,
   };
  });
 }

 // Path string generator for a TAPERING 2D filled polygon branch
 const drawRealisticBranch = (p1: any, p2: any, w1: number, w2: number) => {
  const left1 = { x: p1.x - w1 / 2, y: p1.y };
  const right1 = { x: p1.x + w1 / 2, y: p1.y };
  const left2 = { x: p2.x - w2 / 2, y: p2.y };
  const right2 = { x: p2.x + w2 / 2, y: p2.y };
  const midY = p1.y - (p1.y - p2.y) / 2;

  return `M${left1.x} ${left1.y} C${left1.x} ${midY} ${left2.x} ${midY} ${left2.x} ${left2.y} L${right2.x} ${right2.y} C${right2.x} ${midY} ${right1.x} ${midY} ${right1.x} ${right1.y} Z`;
 };

 // --- FALLING PETALS ANIMATION ---
 const [ambientPetals, setAmbientPetals] = useState<any[]>([]);
 useEffect(() => {
   const petals = Array.from({ length: 45 }).map((_, i) => ({
     id: i,
     x: Math.random() * 1000,
     y: Math.random() * 1400,
     size: Math.random() * 0.8 + 0.4,
     duration: Math.random() * 4 + 6,
     delay: Math.random() * 5
   }));
   setAmbientPetals(petals);
 }, []);

 // Auto-scroll strictly to keep the selected node centered
 useEffect(() => {
   const container = document.getElementById("tree-container");
   if (!container) return;
   
   if (stage === 1) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
   else if (stage === 2) container.scrollTo({ top: container.scrollHeight - 350, behavior: 'smooth' });
   else if (stage === 3) container.scrollTo({ top: container.scrollHeight - 650, behavior: 'smooth' });
   else if (stage >= 4) container.scrollTo({ top: container.scrollHeight - 850, behavior: 'smooth' });
 }, [stage]);

 // ── DYNAMIC VIEWBOX ──────────────────────────────────────────────────────────
 // Gather all currently-rendered node X positions so we can shift the viewBox
 // to keep everything centred, even when branches grow heavily to one side.
 const PADDING = 200; // extra breathing room on each side
 const VIEW_H  = 1400;

 const allXCoords: number[] = [
   ...classNodes.map(c => c.x),
   ...(stage >= 2 ? streamNodes.map(s => s.x) : []),
   ...(stage >= 3 ? careerNodes.map(c => c.x) : []),
   ...(stage >= 4 ? subFieldNodes.map(s => s.x) : []),
   trunkStart.x, trunkEnd.x,
 ];

 const minX = Math.min(...allXCoords) - PADDING;
 const maxX = Math.max(...allXCoords) + PADDING;
 const viewW = Math.max(maxX - minX, 900); // never narrower than 900 units
 // Re-centre: if content is narrower than viewW, shift so it's centred
 const contentCx = (minX + maxX) / 2;
 const vbX = contentCx - viewW / 2;
 const dynamicViewBox = `${vbX} 0 ${viewW} ${VIEW_H}`;

 return (
  <svg viewBox={dynamicViewBox} className="w-full h-[1400px] pointer-events-none" style={{ transition: 'viewBox 0.6s ease' }}>
   <defs>
    <linearGradient id="bark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1e120d" />
      <stop offset="25%" stopColor="#3d261b" />
      <stop offset="50%" stopColor="#513628" />
      <stop offset="75%" stopColor="#3d261b" />
      <stop offset="100%" stopColor="#1e120d" />
    </linearGradient>

    <filter id="glow">
     <feGaussianBlur stdDeviation="4" result="coloredBlur" />
     <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    
    <filter id="neon_glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>

    <clipPath id="clip-trunk">
      <motion.circle cx={trunkStart.x} cy={trunkStart.y} initial={{ r: 0 }} animate={{ r: 500 }} transition={{ duration: 1.2, ease: "easeOut" }} />
    </clipPath>

    {/* Stage 1 Clips */}
    {classNodes.map((c, i) => (
      <clipPath key={`clip-${c.id.replace(/\s+/g, '-')}`} id={`clip-${c.id.replace(/\s+/g, '-')}`}>
        <motion.circle cx={trunkEnd.x} cy={trunkEnd.y} initial={{ r: 0 }} animate={{ r: stage >= 1 ? 500 : 0 }} transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }} />
      </clipPath>
    ))}
    
    {/* Stage 2 Clips */}
    {selectedClassNode && streamNodes.map((s, i) => (
      <clipPath key={`clip-${s.id.replace(/\s+/g, '-')}`} id={`clip-${s.id.replace(/\s+/g, '-')}`}>
        <motion.circle cx={selectedClassNode.x} cy={selectedClassNode.y} initial={{ r: 0 }} animate={{ r: stage >= 2 ? 500 : 0 }} transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }} />
      </clipPath>
    ))}

    {/* Stage 3 Clips */}
    {selectedStreamNode && careerNodes.map((c, i) => (
      <clipPath key={`clip-${c.id.replace(/\s+/g, '-')}`} id={`clip-${c.id.replace(/\s+/g, '-')}`}>
        <motion.circle cx={selectedStreamNode.x} cy={selectedStreamNode.y} initial={{ r: 0 }} animate={{ r: stage >= 3 ? 500 : 0 }} transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }} />
      </clipPath>
    ))}

    {/* Stage 4 Clips */}
    {selectedCareerNode && subFieldNodes.map((sub, i) => (
      <clipPath key={`clip-${sub.id.replace(/\s+/g, '-')}`} id={`clip-${sub.id.replace(/\s+/g, '-')}`}>
        <motion.circle cx={selectedCareerNode.x} cy={selectedCareerNode.y} initial={{ r: 0 }} animate={{ r: stage >= 4 ? 500 : 0 }} transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }} />
      </clipPath>
    ))}
   </defs>

   {/* --- GROUND HORIZON --- */}
   <g id="ground">
     <path d="M-400 1400 Q500 1280 1400 1400 L1400 1500 L-400 1500 Z" fill="#1e120d" />
     <path d="M-200 1400 Q500 1310 1200 1400 L1200 1500 L-200 1500 Z" fill="#2d1b13" />
     {/* Pile of collected leaves scattered precisely around the trunk base */}
     {Array.from({ length: 40 }).map((_, i) => (
       <path
        key={`ground-leaf-${i}`}
        d={`M0 0 Q5 -5 10 0 C5 10 0 0 0 0`}
        fill={i % 3 === 0 ? "#ff2a6d" : "#ff91a4"}
        transform={`translate(${500 + (Math.random() * 400 - 200)} ${1330 + Math.random() * 40}) rotate(${Math.random() * 360}) scale(${Math.random() * 0.8 + 0.5})`}
       />
     ))}
   </g>

   {/* --- BRANCHES LAYER (Rendered First to fix overlap) --- */}
   <g id="branches">
    {/* Trunk */}
    <path d={drawRealisticBranch(trunkStart, trunkEnd, 40, 24)} fill="url(#bark)" clipPath="url(#clip-trunk)" />

    {/* Stage 1 branches */}
    {stage >= 1 && classNodes.map((c) => (
      <path key={`branch-${c.id}`} d={drawRealisticBranch(trunkEnd, c, 24, 16)} fill="url(#bark)" clipPath={`url(#clip-${c.id.replace(/\s+/g, '-')})`} />
    ))}

    {/* Stage 2 branches */}
    {stage >= 2 && selectedClassNode && streamNodes.map((s) => (
      <path key={`branch-${s.id}`} d={drawRealisticBranch(selectedClassNode, s, 16, 10)} fill="url(#bark)" clipPath={`url(#clip-${s.id.replace(/\s+/g, '-')})`} />
    ))}

    {/* Stage 3 branches */}
    {stage >= 3 && selectedStreamNode && careerNodes.map((c) => (
      <path key={`branch-${c.id}`} d={drawRealisticBranch(selectedStreamNode, c, 10, 6)} fill="url(#bark)" clipPath={`url(#clip-${c.id.replace(/\s+/g, '-')})`} />
    ))}

    {/* Stage 4 branches */}
    {stage >= 4 && selectedCareerNode && subFieldNodes.map((sub) => (
      <path key={`branch-${sub.id}`} d={drawRealisticBranch(selectedCareerNode, sub, 6, 2)} fill="url(#bark)" clipPath={`url(#clip-${sub.id.replace(/\s+/g, '-')})`} />
    ))}
   </g>

   {/* --- NODES LAYER (Rendered Last over branches) --- */}
   <g id="nodes">
     {stage >= 1 && classNodes.map((c, i) => (
       <CherryBlossomNode
        key={`node-${c.id}`}
        node={c}
        delay={0.8 + i * 0.2}
        label={c.id}
        isSelected={selectedClass === c.id}
        isDimmed={selectedClass !== null && selectedClass !== c.id}
        onClick={() => onClassClick(c.id)}
        onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(1, c.id)}
       />
     ))}

     {stage >= 2 && selectedClassNode && streamNodes.map((s, i) => (
       <CherryBlossomNode
        key={`node-${s.id}`}
        node={s}
        delay={0.6 + i * 0.2}
        label={s.id}
        isSelected={selectedStream === s.id}
        isDimmed={selectedStream !== null && selectedStream !== s.id}
        onClick={() => onStreamClick(s.id)}
        onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(2, s.id)}
       />
     ))}

     {stage >= 3 && selectedStreamNode && careerNodes.map((c, i) => (
       <CherryBlossomNode
        key={`node-${c.id}`}
        node={c}
        delay={0.6 + i * 0.2}
        label={c.name}
        isSelected={selectedCareer === c.name}
        isDimmed={selectedCareer !== null && selectedCareer !== c.name}
        isCareer
        onHoverInfo={c}
        onHoverCallback={onCareerHover}
        onClick={() => onCareerClick(c.id)}
        onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(3, c.id)}
       />
     ))}

     {stage >= 4 && selectedCareerNode && subFieldNodes.map((sub, i) => (
       <CherryBlossomNode
        key={`node-${sub.id}`}
        node={sub}
        delay={0.2 + i * 0.2}
        label={sub.name}
        isSelected={selectedSubField === sub.name}
        isDimmed={selectedSubField !== null && selectedSubField !== sub.name}
        isCareer
        onHoverInfo={sub}
        onHoverCallback={onCareerHover}
        onClick={() => onSubFieldClick(sub.id)}
        onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(4, sub.id)}
       />
     ))}
   </g>

   {/* --- AMBIENT FALLING PETALS --- */}
   {ambientPetals.map(p => (
     <motion.path
       key={`ambient-${p.id}`}
       d={`M0 0 Q5 -5 10 0 C5 10 0 0 0 0`}
       fill={p.id % 2 === 0 ? "#ff2a6d" : "#ff91a4"}
       filter="url(#neon_glow)"
       initial={{ x: p.x, y: -50, opacity: 0, rotate: 0 }}
       animate={{ 
        y: [ -50, 1370 + Math.random()*20 ],  
        x: [ p.x, p.x + (Math.random() > 0.5 ? 150 : -150) ],
        rotate: [0, 360],
        opacity: [0, 1, 0.8, 0] 
       }}
       transition={{
         duration: p.duration,
         delay: p.delay,
         repeat: Infinity,
         ease: "linear"
       }}
       style={{ scale: p.size }}
     />
   ))}
  </svg>
 );
}

/* ---------------------------------------------------- */
/* --- CHERRY BLOSSOM NODE / LEAF COMPONENT --- */

function CherryBlossomNode({
 node,
 delay,
 label,
 isSelected,
 isDimmed,
 onClick,
 onDoubleClick,
 onHoverInfo,
 onHoverCallback,
 isCareer = false,
}: any) {
 const size = isSelected ? 1.4 : 1;

 const petals = [
  { dx: -20, dy: -20, rot: -30, delay: 0.1 },
  { dx: 25, dy: -15, rot: 45, delay: 0.2 },
  { dx: 0, dy: 25, rot: 180, delay: 0.3 },
  { dx: -25, dy: 10, rot: -120, delay: 0.4 },
  { dx: 20, dy: 20, rot: 120, delay: 0.5 },
 ];

 return (
  <g
   className="pointer-events-auto cursor-pointer"
   onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
   onDoubleClick={(e) => { e.stopPropagation(); if (onDoubleClick) onDoubleClick(); }}
   onMouseMove={(e) => {
     if(onHoverCallback && onHoverInfo) {
       onHoverCallback({
         career: onHoverInfo,
         position: { x: e.clientX, y: e.clientY }
       })
     }
   }}
   onMouseLeave={() => { if(onHoverCallback) onHoverCallback(null) }}
  >
   {/* Interactive hit area */}
   <circle cx={node.x} cy={node.y} r="35" fill="transparent" />

   <motion.g
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: size, opacity: isDimmed ? 0.4 : 1 }}
    transition={{ duration: 0.6, delay, type: "spring", bounce: 0.5 }}
    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
    whileHover={{ scale: 1.1 + (isSelected ? 0.4 : 0) }}
   >
    <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}>
      {/* Base Flower / Cluster */}
      <circle cx={node.x} cy={node.y} r="18" fill="#ffb7c5" filter="url(#glow)" />
      <circle cx={node.x} cy={node.y} r="12" fill="#ff91a4" />

      {/* Scattered Petals */}
      {petals.map((p, i) => (
       <motion.path
        key={i}
        d={`M${node.x + p.dx} ${node.y + p.dy} Q${node.x + p.dx + 10} ${node.y + p.dy - 10} ${node.x + p.dx + 15} ${node.y + p.dy} C${node.x + p.dx + 5} ${node.y + p.dy + 10} ${node.x + p.dx} ${node.y + p.dy}`}
        fill={i % 2 === 0 ? "#ffb7c5" : "#ff91a4"}
        transform={`rotate(${p.rot} ${node.x + p.dx} ${node.y + p.dy})`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + p.delay }}
       />
      ))}

      {/* Highlight Ring for Selected Node */}
      {isSelected && (
       <motion.circle
        cx={node.x} cy={node.y} r="28" stroke="#ff2a6d" strokeWidth="3" fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
       />
      )}

      {/* Text Label */}
      <text
       x={node.x} y={node.y - 45}
       fill={isSelected ? "#ff2a6d" : "white"}
       fontSize={isCareer ? "14" : "16"}
       fontWeight={isSelected ? "bold" : "600"}
       textAnchor="middle"
       style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
      >
       {label}
      </text>
    </motion.g>
   </motion.g>
  </g>
 );
}