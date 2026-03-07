"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function RiddleGame() {

const riddles = [
{
question: "I speak without a mouth and hear without ears. What am I?",
answer: "echo"
},
{
question: "The more you take, the more you leave behind. What are they?",
answer: "footsteps"
},
{
question: "What has keys but can't open locks?",
answer: "piano"
},
{
question: "What has hands but cannot clap?",
answer: "clock"
},
{
question: "What gets wetter the more it dries?",
answer: "towel"
},
{
question: "I’m tall when I’m young, and short when I’m old. What am I?",
answer: "candle"
},
{
question: "What month has 28 days?",
answer: "all"
},
{
question: "What has one eye but cannot see?",
answer: "needle"
},
{
question: "What can travel around the world while staying in one corner?",
answer: "stamp"
},
{
question: "What has a neck but no head?",
answer: "bottle"
}
];

const [index,setIndex] = useState(
Math.floor(Math.random()*riddles.length)
);

const [answer,setAnswer] = useState("");
const [result,setResult] = useState("");
const [xp,setXp] = useState<number|null>(null);

function checkAnswer(){

if(answer.toLowerCase().trim() === riddles[index].answer){

const points = Math.floor(Math.random()*6) + 10; // 10-15 XP

setResult("✅ Correct!");
setXp(points);

updateProgress(points);

}else{

setResult(`❌ Wrong! Answer: ${riddles[index].answer}`);
setXp(null);

}

}

function nextRiddle(){

setIndex(Math.floor(Math.random()*riddles.length));
setAnswer("");
setResult("");
setXp(null);

}

return(

<main className="p-8 text-white bg-transparent">

<h1 className="text-2xl font-bold mb-6">
🧠 Riddle Challenge
</h1>

<div className="max-w-xl border border-gray-600 rounded-lg p-6 bg-transparent">

<p className="text-lg mb-4">
{riddles[index].question}
</p>

<input
value={answer}
onChange={(e)=>setAnswer(e.target.value)}
placeholder="Type your answer..."
className="w-full p-2 border border-gray-500 rounded bg-transparent text-white mb-4"
/>

<div className="flex gap-4">

<button
onClick={checkAnswer}
className="px-4 py-2 bg-purple-700 rounded hover:bg-purple-600"
>
Check Answer
</button>

<button
onClick={nextRiddle}
className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600"
>
Next Riddle
</button>

</div>

{result && (
<div className="mt-4">

<p className="text-lg">{result}</p>

{xp && (
<p className="text-green-400">
🎉 You earned {xp} XP!
</p>
)}

</div>
)}

</div>

</main>

);

}