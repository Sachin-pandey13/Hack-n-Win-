"use client"
import { useEffect, useState } from "react"

export default function CareerTooltip({career, position}: {career:any, position:any}) {
 
 const [coords, setCoords] = useState({ x: -1000, y: -1000 })

 // Calculate safe boundaries
 useEffect(() => {
  if (position) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const boxW = 450;
    const boxH = 400;

    let posX = position.x + 20;
    let posY = position.y + 20;

    // Shift left if overflowing
    if (posX + boxW > W) posX = position.x - boxW - 20;
    // Shift up if overflowing
    if (posY + boxH > H) posY = H - boxH - 20;

    setCoords({ x: posX, y: posY })
  }
 }, [position])

 if(!career) return null

 // Fixed styling bypass for absolute coordinates (bypasses relative scroll container)
 return (
  <div
   className={`fixed max-w-[450px] w-full p-8 rounded-3xl
   bg-black/80 backdrop-blur-3xl border border-white/20
   text-white shadow-[0_0_40px_rgba(255,42,109,0.3)] z-[9999] transition-all duration-75`}
   style={{ left: coords.x, top: coords.y, pointerEvents: 'none' }}
  >

   {/* Header */}
   <div className="mb-6 border-b border-white/10 pb-4">
    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
      {career.name}
    </h3>
    {(career.exam || career.duration) && (
      <p className="text-xs text-gray-300 font-bold mt-1 tracking-wider uppercase">
       {career.exam || "Specialization"} {career.duration ? `• ${career.duration}` : ''}
      </p>
    )}
   </div>

   {/* --- STAGE 3 SUBJECTS --- */}
   {career.subjects && (
   <div className="mb-6">
    <b className="text-xs text-pink-400 uppercase tracking-widest block mb-3">Key Subjects / Pattern</b>
    <div className="flex flex-wrap gap-2">
     {career.subjects.map((sub:string, i:number)=>(
      <span key={i} className="px-3 py-1.5 text-[11px] font-semibold bg-white/10 border border-white/10 rounded-full shadow-sm">
       {sub}
      </span>
     ))}
    </div>
   </div>
   )}

   <div className="grid grid-cols-2 gap-6 text-sm">
     {/* --- STAGE 3 FIELDS --- */}
     {career.fields && (
     <div>
      <b className="text-[11px] text-pink-400 uppercase tracking-widest block mb-2">Broad Fields</b>
      <ul className="space-y-1 text-gray-300 font-medium text-xs">
       {career.fields.map((f:any,i:number)=>(
        <li key={i} className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-pink-500 before:rounded-full before:mr-2">
          {f}
        </li>
       ))}
      </ul>
     </div>
     )}

     {/* --- STAGE 4 CORE SUBJECTS (e.g. OS, DBMS) --- */}
     {career.core && (
     <div>
      <b className="text-[11px] text-pink-400 uppercase tracking-widest block mb-2">Core Engineering</b>
      <ul className="space-y-1 text-gray-300 font-medium text-xs">
       {career.core.map((f:any,i:number)=>(
        <li key={i} className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-pink-500 before:rounded-full before:mr-2">
          {f}
        </li>
       ))}
      </ul>
     </div>
     )}

     {/* --- STAGE 4 SKILLS (e.g. Web Dev) --- */}
     {career.skills && (
     <div className="col-span-1">
      <b className="text-[11px] text-purple-400 uppercase tracking-widest block mb-2">Tech Stack / Skills</b>
      <ul className="space-y-1 text-gray-300 font-medium text-xs">
       {career.skills.map((c:any,i:number)=>(
        <li key={i} className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-purple-500 before:rounded-full before:mr-2">
          {c}
        </li>
       ))}
      </ul>
     </div>
     )}

     {/* --- SHARED CAREERS OUTCOMES --- */}
     {career.career && (
     <div className={`${!career.fields && !career.skills ? "col-span-2" : "col-span-1"}`}>
      <b className="text-[11px] text-orange-400 uppercase tracking-widest block mb-2">Outcome Careers</b>
      <ul className="space-y-1 text-gray-300 font-medium text-xs">
       {career.career.map((c:any,i:number)=>(
        <li key={i} className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-orange-500 before:rounded-full before:mr-2">
          {c}
        </li>
       ))}
      </ul>
     </div>
     )}
   </div>

  </div>
 )
}