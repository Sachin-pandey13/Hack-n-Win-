"use client"

export default function CareerTooltip({career}:{career:any}){

 if(!career) return null

 return (
  <div
   className={`absolute top-[45%] right-[65%]
   w-[480px] p-7 rounded-2xl
   bg-slate-900/90 backdrop-blur border border-white/10
   text-white shadow-xl z-[999]`}
  >

   <h3 className="text-xl font-bold mb-3">{career.name}</h3>

   <p className="text-sm text-gray-400 mb-2">
    Exam: {career.exam}
   </p>

   <p className="text-sm text-gray-400 mb-4">
    Duration: {career.duration}
   </p>

   {career.fields && (
   <div className="text-sm mb-4">
    <b>Fields</b>
    <ul className="list-disc ml-5">
     {career.fields.map((f:any,i:number)=>(
      <li key={i}>{f}</li>
     ))}
    </ul>
   </div>
   )}

   {career.career && (
   <div className="text-sm">
    <b>Careers</b>
    <ul className="list-disc ml-5">
     {career.career.map((c:any,i:number)=>(
      <li key={i}>{c}</li>
     ))}
    </ul>
   </div>
   )}

  </div>
 )
}