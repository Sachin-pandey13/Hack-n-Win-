"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function GeographyQuiz() {

const questionSets = [

[
{question:"Capital of Japan?", options:["Tokyo","Seoul","Beijing","Bangkok"], answer:"Tokyo"},
{question:"Largest desert?", options:["Sahara","Gobi","Thar","Kalahari"], answer:"Sahara"},
{question:"Mount Everest is in?", options:["Andes","Himalayas","Alps","Rockies"], answer:"Himalayas"},
{question:"Longest river?", options:["Amazon","Nile","Yangtze","Mississippi"], answer:"Nile"},
{question:"Country with most population?", options:["USA","India","China","Russia"], answer:"India"},
{question:"Capital of France?", options:["Paris","Rome","Madrid","Berlin"], answer:"Paris"},
{question:"Largest ocean?", options:["Atlantic","Pacific","Indian","Arctic"], answer:"Pacific"},
{question:"Country with pyramids?", options:["Mexico","Egypt","Peru","Greece"], answer:"Egypt"},
{question:"Capital of Australia?", options:["Sydney","Melbourne","Canberra","Perth"], answer:"Canberra"},
{question:"Smallest continent?", options:["Europe","Australia","Antarctica","Africa"], answer:"Australia"},
],

[
{question:"Capital of Canada?", options:["Toronto","Ottawa","Montreal","Vancouver"], answer:"Ottawa"},
{question:"Largest island?", options:["Greenland","Madagascar","Borneo","Sumatra"], answer:"Greenland"},
{question:"River in London?", options:["Seine","Thames","Danube","Rhine"], answer:"Thames"},
{question:"Highest waterfall?", options:["Niagara","Victoria","Angel","Iguazu"], answer:"Angel"},
{question:"Capital of Italy?", options:["Rome","Milan","Naples","Venice"], answer:"Rome"},
{question:"Country famous for tulips?", options:["Belgium","Netherlands","Denmark","Sweden"], answer:"Netherlands"},
{question:"Biggest continent?", options:["Africa","Asia","Europe","America"], answer:"Asia"},
{question:"Capital of Brazil?", options:["Rio","Brasilia","Sao Paulo","Salvador"], answer:"Brasilia"},
{question:"Mount Kilimanjaro is in?", options:["Kenya","Ethiopia","Tanzania","Uganda"], answer:"Tanzania"},
{question:"Capital of Germany?", options:["Munich","Berlin","Hamburg","Frankfurt"], answer:"Berlin"},
],

[
{question:"Capital of Spain?", options:["Madrid","Barcelona","Seville","Valencia"], answer:"Madrid"},
{question:"River through Egypt?", options:["Nile","Amazon","Yangtze","Danube"], answer:"Nile"},
{question:"Largest country?", options:["USA","China","Russia","Canada"], answer:"Russia"},
{question:"Capital of China?", options:["Shanghai","Beijing","Guangzhou","Shenzhen"], answer:"Beijing"},
{question:"Colosseum is in?", options:["Rome","Athens","Paris","Istanbul"], answer:"Rome"},
{question:"Country shaped like boot?", options:["Spain","Italy","Portugal","France"], answer:"Italy"},
{question:"Capital of India?", options:["Delhi","Mumbai","Kolkata","Chennai"], answer:"Delhi"},
{question:"Amazon rainforest mainly in?", options:["Brazil","Peru","Bolivia","Colombia"], answer:"Brazil"},
{question:"Capital of Russia?", options:["Moscow","St Petersburg","Kazan","Sochi"], answer:"Moscow"},
{question:"Great Barrier Reef near?", options:["Australia","USA","Indonesia","Philippines"], answer:"Australia"},
],

[
{question:"Capital of Thailand?", options:["Bangkok","Phuket","Chiang Mai","Krabi"], answer:"Bangkok"},
{question:"Capital of Nepal?", options:["Kathmandu","Pokhara","Lalitpur","Biratnagar"], answer:"Kathmandu"},
{question:"Capital of Bangladesh?", options:["Dhaka","Chittagong","Khulna","Sylhet"], answer:"Dhaka"},
{question:"Capital of Pakistan?", options:["Karachi","Islamabad","Lahore","Peshawar"], answer:"Islamabad"},
{question:"Capital of Sri Lanka?", options:["Colombo","Kandy","Galle","Jaffna"], answer:"Colombo"},
{question:"Capital of UAE?", options:["Dubai","Abu Dhabi","Sharjah","Ajman"], answer:"Abu Dhabi"},
{question:"Capital of Qatar?", options:["Doha","Al Rayyan","Lusail","Al Wakrah"], answer:"Doha"},
{question:"Capital of Turkey?", options:["Ankara","Istanbul","Izmir","Bursa"], answer:"Ankara"},
{question:"Capital of Greece?", options:["Athens","Sparta","Corinth","Thessaloniki"], answer:"Athens"},
{question:"Capital of Portugal?", options:["Lisbon","Porto","Braga","Faro"], answer:"Lisbon"},
]

];

// pick random set
const [questions] = useState(
  questionSets[Math.floor(Math.random() * questionSets.length)]
);

const [current,setCurrent]=useState(0);
const [selected,setSelected]=useState<string|null>(null);
const [result,setResult]=useState("");
const [score,setScore]=useState(0);
const [completed,setCompleted]=useState(false);

function checkResult(){

if(!selected){
alert("Select an option");
return;
}

if(selected===questions[current].answer){
setResult("✅ Correct");
setScore(score+1);
}else{
setResult(`❌ Wrong! Correct: ${questions[current].answer}`);
}

}

function nextQuestion(){

const next=current+1;

if(next<questions.length){
setCurrent(next);
setSelected(null);
setResult("");
}else{
setCompleted(true);
updateProgress(score*10);
}

}

function restartQuiz(){
location.reload(); // reload for new random set
}

if(completed){
return(
<main className="p-6">
<h1 className="text-xl font-bold mb-4">Quiz Finished 🎉</h1>
<p>Score: {score}/10</p>

<button
onClick={restartQuiz}
className="mt-4 px-4 py-2 bg-blue-700 rounded"
>
Play Again
</button>
</main>
);
}

return(

<main className="p-6">

<h1 className="text-xl font-bold mb-4">🌍 Geography Quiz</h1>

<p className="mb-4">{questions[current].question}</p>

<div className="grid gap-3 max-w-sm">

{questions[current].options.map(option=>(

<button
key={option}
onClick={()=>setSelected(option)}
className={`border p-3 rounded ${
selected===option
? "bg-blue-700 text-white"
: "border-gray-500 bg-transparent text-white"
}`}
>
{option}
</button>

))}

</div>

<div className="mt-4 flex gap-3">

<button
onClick={checkResult}
className="px-4 py-2 bg-green-700 rounded"
>
Check Result
</button>

<button
onClick={nextQuestion}
className="px-4 py-2 bg-purple-700 rounded"
>
Next
</button>

</div>

{result && <p className="mt-4">{result}</p>}

<p className="mt-6 text-sm text-gray-400">
Question {current+1} of 10
</p>

</main>

);

}