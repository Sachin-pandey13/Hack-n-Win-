"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import CareerTooltip from "@/components/tree/CareerTooltip"
import { saveUserPreference } from "../../lib/savePreference"
import { careerTree } from "@/data/careerTree"

// Dynamically load TreeRenderer to fix "late loading" issue and avoid SSR hydration mismatches for complex SVGs
const TreeRenderer = dynamic(() => import("@/components/tree/TreeRenderer"), {
 ssr: false,
 loading: () => <div className="absolute inset-0 flex items-center justify-center text-pink-400 font-semibold animate-pulse text-lg">Growing your cherry blossom tree...</div>
})

export default function TreePage(){

const router = useRouter()

const [stage,setStage] = useState<number>(1)

const [selectedClass,setSelectedClass] = useState<string | null>(null)
const [selectedStream,setSelectedStream] = useState<string | null>(null)
const [selectedCareer,setSelectedCareer] = useState<string | null>(null)
const [selectedSubField, setSelectedSubField] = useState<string | null>(null) // NEW STAGE 4

const [hoverCareer,setHoverCareer] = useState<any>(null)

/* -------- derive careers from stream -------- */

const careers = selectedStream ? careerTree[selectedStream] : []

/* ---------------- CLASS ---------------- */
function handleClassClick(c:string){
 setSelectedClass(c)
 setSelectedStream(null)
 setSelectedCareer(null)
 setSelectedSubField(null)
 setStage(2)
}

/* ---------------- STREAM ---------------- */
function handleStreamClick(s:string){
 setSelectedStream(s)
 setSelectedCareer(null)
 setSelectedSubField(null)
 setStage(3)
}

/* ---------------- CAREER (STAGE 3) ---------------- */
function handleCareerClick(c:string){
 setSelectedCareer(c)
 // Check if this career has subbranches, if so advance stage, else keep stage 3
 const currentCareerData = careers?.find((car:any) => car.name === c)
 if(currentCareerData && currentCareerData.subBranches) {
   setStage(4)
 }
 setSelectedSubField(null)
}

/* ---------------- SUBFIELD (STAGE 4) ---------------- */
function handleSubFieldClick(s:string){
 setSelectedSubField(s)
}

/* ---------------- CONTINUE OR SAVE ---------------- */
async function triggerSave(classVal: string|null, streamVal: string|null, careerVal: string|null, subFieldVal: string|null) {
 if(!classVal || !streamVal || !careerVal) return

 try {
  await saveUserPreference({
   class: classVal,
   stream: streamVal,
   career: careerVal,
   subField: subFieldVal
  })
  console.log("Preference saved dynamically")
 } catch(err) {
  console.error("Failed saving preference", err)
 }
}

async function handleContinue(){
 if(!selectedClass || !selectedStream || !selectedCareer) return
 await triggerSave(selectedClass, selectedStream, selectedCareer, selectedSubField)
 router.push("/explore")
}

// Double click instantly saves current selection up to that node and routes to explore
async function handleNodeDoubleClick(level: number, value: string) {
 let c = selectedClass, s = selectedStream, car = selectedCareer, sub = selectedSubField;
 if (level === 1) c = value;
 if (level === 2) s = value;
 if (level === 3) car = value;
 if (level === 4) sub = value;

 if(!c || !s || !car) {
  alert("Need at least a Class, Stream, and Career to define your schedule!");
  return;
 }

 alert(`Learning Schedule set to: ${c} ➔ ${s} ➔ ${car} ${sub ? "➔ " + sub : ""}\nRedirecting to explore section...`);
 await triggerSave(c, s, car, sub);
 router.push("/explore")
}

/* ---------------- BUTTON VISIBILITY ---------------- */
const canContinue =
 selectedClass !== null &&
 selectedStream !== null &&
 selectedCareer !== null

return(
<div id="tree-container" className="relative w-full h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">

<TreeRenderer
 stage={stage}
 careers={careers}
 onClassClick={handleClassClick}
 onStreamClick={handleStreamClick}
 onCareerClick={handleCareerClick}
 onSubFieldClick={handleSubFieldClick}
 onNodeDoubleClick={handleNodeDoubleClick}
 onCareerHover={setHoverCareer}
 selectedClass={selectedClass}
 selectedStream={selectedStream}
 selectedCareer={selectedCareer}
 selectedSubField={selectedSubField}
/>

{/* ---------------- TOOLTIP ---------------- */}

{hoverCareer && (
 <CareerTooltip career={hoverCareer.career} position={hoverCareer.position} />
)}

{/* ---------------- CONTINUE BUTTON ---------------- */}

{canContinue && (
<button
 onClick={handleContinue}
 className="absolute bottom-10 left-1/2 -translate-x-1/2
 px-8 py-3 rounded-xl
 bg-gradient-to-r from-pink-500 to-red-500
 text-white font-semibold shadow-[0_0_20px_rgba(236,72,153,0.6)]
 hover:scale-105 transition
 z-[999]
 sticky"
>
Continue →
</button>
)}

</div>
)

}