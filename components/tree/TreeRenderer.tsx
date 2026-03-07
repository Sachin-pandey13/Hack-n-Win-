"use client"

import { motion } from "framer-motion"

export default function TreeRenderer({
 stage,
 onClassClick,
 onStreamClick,
 onCareerClick,
 onCareerHover,
 careers,
 selectedClass,
 selectedStream,
 selectedCareer
}: any){

 const center = 500
 const classLevel = 470
 const streamLevel = 310
 const careerLevel = 140

 return(

<svg viewBox="0 0 1000 720" className="w-full h-full pointer-events-none">

<defs>
<linearGradient id="branch" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor="#a855f7"/>
<stop offset="50%" stopColor="#ec4899"/>
<stop offset="100%" stopColor="#ef4444"/>
</linearGradient>
</defs>


{/* TREE TRUNK */}

<motion.path
d={`M480 700 C460 620 460 540 480 470 C500 400 510 350 500 310 C490 250 480 200 495 140`}
stroke="url(#branch)"
strokeWidth="14"
fill="none"
/>

<motion.path
d={`M520 700 C540 620 540 540 520 470 C500 400 490 350 500 310 C510 250 520 200 505 140`}
stroke="url(#branch)"
strokeWidth="14"
fill="none"
/>


{/* ---------------- CLASSES ---------------- */}

{stage >= 1 && (

<>

<motion.path
d={`M${center} ${classLevel} C420 450 370 440 320 420`}
stroke="url(#branch)"
strokeWidth="6"
/>

<motion.path
d={`M${center} ${classLevel} C580 450 630 440 680 420`}
stroke="url(#branch)"
strokeWidth="6"
/>

{leaf(320,420,"10","Class 10",onClassClick,selectedClass)}
{leaf(540,405,"11","Class 11",onClassClick,selectedClass)}
{leaf(680,420,"12","Class 12",onClassClick,selectedClass)}

</>

)}


{/* ---------------- STREAM ---------------- */}

{stage >= 2 && (

<>

<motion.path
d={`M${center} ${streamLevel} C420 290 380 270 340 250`}
stroke="url(#branch)"
strokeWidth="6"
/>

<motion.path
d={`M${center} ${streamLevel} C580 290 620 270 660 250`}
stroke="url(#branch)"
strokeWidth="6"
/>

{leaf(340,250,"PCM","PCM",onStreamClick,selectedStream)}
{leaf(660,250,"PCB","PCB",onStreamClick,selectedStream)}

</>

)}


{/* ---------------- CAREERS ---------------- */}

{stage >= 3 && careers.map((c:any,i:number)=>{

 const spacing = 180
 const start = center - ((careers.length-1)*spacing)/2
 const x = start + i*spacing
 const side = x < center ? "left" : "right"

 return(

<g
 key={i}
 className="pointer-events-auto"
 onMouseEnter={()=>onCareerHover && onCareerHover({career:c,x,y:careerLevel-40,side})}
 onMouseLeave={()=>onCareerHover && onCareerHover(null)}
>

<motion.path
d={`M${center} ${careerLevel} C${center+(x-center)/2} 170 ${x} 160 ${x} ${careerLevel-40}`}
stroke="url(#branch)"
strokeWidth="5"
/>

{careerLeaf(x,careerLevel-40,c.name,selectedCareer,onCareerClick)}

</g>

 )

})}

 </svg>

 )
}



/* ---------- CLASS / STREAM LEAF ---------- */

function leaf(
x:number,
y:number,
value:string,
label:string,
onClick:any,
selected:any
){

const isSelected = selected === value

return(

<g
onClick={()=>onClick && onClick(value)}
style={{cursor:"pointer"}}
className="pointer-events-auto"
>

<circle cx={x} cy={y} r="36" fill="transparent"/>

{/* SELECTION RING */}

{isSelected && (

<motion.circle
cx={x}
cy={y}
stroke="#ff2a6d"
strokeWidth="4"
fill="transparent"
initial={{r:36,opacity:0.6}}
animate={{r:[36,46,36],opacity:[0.7,1,0.7]}}
transition={{duration:1.4,repeat:Infinity}}
style={{filter:"drop-shadow(0 0 10px #ff2a6d)"}}
/>

)}

<motion.path
d={`M${x} ${y}
C ${x-14} ${y-24}, ${x-30} ${y-12}, ${x} ${y+16}
C ${x+30} ${y-12}, ${x+14} ${y-24}, ${x} ${y}`}
fill={isSelected ? "#ff2a6d" : "url(#branch)"}
whileHover={{scale:1.2}}
/>

<text
x={x}
y={y-32}
fill={isSelected ? "#ff2a6d" : "white"}
fontSize="15"
textAnchor="middle"
fontWeight={isSelected ? "bold" : "normal"}
>
{label}
</text>

</g>

)
}



/* ---------- CAREER LEAF ---------- */

function careerLeaf(
x:number,
y:number,
label:string,
selectedCareer:string,
onCareerClick:any
){

const isSelected = selectedCareer === label

return(

<g
className="pointer-events-auto"
style={{cursor:"pointer"}}
onClick={(e)=>{
 e.stopPropagation()
 if(onCareerClick) onCareerClick(label)
}}
>

<circle cx={x} cy={y} r="38" fill="transparent"/>

{isSelected && (

<motion.circle
cx={x}
cy={y}
stroke="#ff2a6d"
strokeWidth="4"
fill="transparent"
initial={{r:38,opacity:0.6}}
animate={{r:[38,50,38],opacity:[0.7,1,0.7]}}
transition={{duration:1.4,repeat:Infinity}}
style={{filter:"drop-shadow(0 0 12px #ff2a6d)"}}
/>

)}

<motion.path
d={`M${x} ${y}
C ${x-14} ${y-24}, ${x-30} ${y-12}, ${x} ${y+16}
C ${x+30} ${y-12}, ${x+14} ${y-24}, ${x} ${y}`}
fill={isSelected ? "#ff2a6d" : "url(#branch)"}
whileHover={{scale:1.2}}
/>

<text
x={x}
y={y-32}
fill={isSelected ? "#ff2a6d" : "white"}
fontSize="15"
textAnchor="middle"
fontWeight={isSelected ? "bold" : "normal"}
>
{label}
</text>

</g>

)
}