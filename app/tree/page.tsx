"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import TreeRenderer from "@/components/tree/TreeRenderer"
import CareerTooltip from "@/components/tree/CareerTooltip"
import { saveUserPreference } from "../../lib/savePreference"
import { careerTree } from "@/data/careerTree"

export default function TreePage(){

const router = useRouter()

const [stage,setStage] = useState<number>(1)

const [selectedClass,setSelectedClass] = useState<string | null>(null)
const [selectedStream,setSelectedStream] = useState<string | null>(null)
const [selectedCareer,setSelectedCareer] = useState<string | null>(null)

const [hoverCareer,setHoverCareer] = useState<any>(null)

/* -------- derive careers from stream -------- */

const careers = selectedStream ? careerTree[selectedStream] : []


/* ---------------- CLASS ---------------- */

function handleClassClick(c:string){
 setSelectedClass(c)
 setSelectedStream(null)
 setSelectedCareer(null)
 setStage(2)
}


/* ---------------- STREAM ---------------- */

function handleStreamClick(s:string){
 setSelectedStream(s)
 setSelectedCareer(null)
 setStage(3)
}


/* ---------------- CAREER ---------------- */

function handleCareerClick(c:string){
 setSelectedCareer(c)
}


/* ---------------- CONTINUE ---------------- */

async function handleContinue(){

 if(!selectedClass || !selectedStream || !selectedCareer) return

 try{

  await saveUserPreference({
   class:selectedClass,
   stream:selectedStream,
   career:selectedCareer
  })

  console.log("Preference saved")

 }catch(err){
  console.error("Failed saving preference",err)
 }

 router.push("/explore")
}


/* ---------------- BUTTON VISIBILITY ---------------- */

const canContinue =
 selectedClass !== null &&
 selectedStream !== null &&
 selectedCareer !== null


return(

<div className="relative w-full h-[720px]">

<TreeRenderer
 stage={stage}
 careers={careers}
 onClassClick={handleClassClick}
 onStreamClick={handleStreamClick}
 onCareerClick={handleCareerClick}
 onCareerHover={setHoverCareer}
 selectedClass={selectedClass}
 selectedStream={selectedStream}
 selectedCareer={selectedCareer}
/>

{/* ---------------- TOOLTIP ---------------- */}

{hoverCareer && (
 <CareerTooltip career={hoverCareer.career} />
)}

{/* ---------------- CONTINUE BUTTON ---------------- */}

{canContinue && (

<button
 onClick={handleContinue}
 className="absolute bottom-10 left-1/2 -translate-x-1/2
 px-8 py-3 rounded-xl
 bg-gradient-to-r from-purple-500 to-red-500
 text-white font-semibold shadow-lg
 hover:scale-105 transition
 z-[999]"
>

Continue →

</button>
)}

</div>

)

}