"use client"

import { useState, useRef, useEffect } from "react"
import Draggable from "react-draggable"
import { Resizable } from "re-resizable"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function Chatbot({ open, setOpen }: any) {

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")

  const [size, setSize] = useState({ width: 420, height: 520 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const messagesEndRef = useRef<any>(null)

  async function sendMessage(){

    if(!input.trim()) return

    const userMessage = { role:"user", content:input }

    setMessages(prev => [...prev, userMessage])

    setInput("")

    const res = await fetch("/api/chat",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body:JSON.stringify({
    message: input,
    history: messages
  })
})

if(!res.ok){
  console.error("API error")
  return
}

const text = await res.text()

if(!text){
  console.error("Empty response from server")
  return
}

const data = JSON.parse(text)

    const botMessage = { role:"bot", content:data.reply }

    setMessages(prev => [...prev, botMessage])
  }

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" })
  },[messages])

  function handleKey(e:any){

    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault()
      sendMessage()
    }

  }

  if(!open) return null

  return (

<Draggable
 handle=".chat-header"
 position={position}
 onStop={(e,data)=>setPosition({ x:data.x, y:data.y })}
>

<div style={{ position:"fixed", zIndex:50 }}>

<Resizable
 size={size}
 minWidth={320}
 minHeight={420}
 maxWidth={700}
 maxHeight={700}
 onResizeStop={(e,direction,ref,delta)=>{

   setSize({
     width: size.width + delta.width,
     height: size.height + delta.height
   })

   if(direction.includes("left")){
     setPosition(prev => ({
       ...prev,
       x: prev.x - delta.width
     }))
   }

   if(direction.includes("top")){
     setPosition(prev => ({
       ...prev,
       y: prev.y - delta.height
     }))
   }

 }}
 enable={{
  top:true,
  right:true,
  bottom:true,
  left:true,
  topRight:true,
  bottomRight:true,
  bottomLeft:true,
  topLeft:true
 }}
>

<div
className="bg-[#0c0f1a] border border-purple-500 rounded-xl flex flex-col shadow-xl"
style={{ width:size.width, height:size.height }}
>

{/* Header */}

<div className="chat-header flex justify-between items-center p-3 border-b border-purple-500 cursor-move">

<span className="font-semibold">AI Tutor</span>

<button
onClick={()=>setOpen(false)}
className="hover:text-red-400"
>
✕
</button>

</div>

{/* Messages */}

<div
className="flex-1 overflow-y-auto p-3 space-y-3 text-sm"
style={{ scrollbarWidth:"none" }}
>

{messages.map((m,i)=>(

<div
key={i}
className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap break-words select-text ${
m.role==="user"
? "ml-auto bg-purple-600"
: "bg-gray-800"
}`}
>

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {m.content}
</ReactMarkdown>

</div>

))}

<div ref={messagesEndRef} />

</div>

{/* Input */}

<div className="p-3 border-t border-purple-500 flex gap-2">

<textarea
value={input}
onChange={(e)=>setInput(e.target.value)}
onKeyDown={handleKey}
rows={1}
placeholder="Ask anything..."
className="flex-1 bg-black p-2 rounded resize-none outline-none"
/>

<button
onClick={sendMessage}
className="bg-purple-600 px-4 rounded hover:bg-purple-700"
>
Send
</button>

</div>

</div>

</Resizable>

</div>

</Draggable>

  )

}