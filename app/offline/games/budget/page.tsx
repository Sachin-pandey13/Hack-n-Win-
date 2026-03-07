"use client";
import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function BudgetChallenge() {

const [income,setIncome] = useState(20000);
const [rent,setRent] = useState(6000);
const [food,setFood] = useState(3000);
const [transport,setTransport] = useState(2000);
const [entertainment,setEntertainment] = useState(1500);

const totalSpent = rent + food + transport + entertainment;
const savings = income - totalSpent;

const data = [
{ name:"Rent", value:rent },
{ name:"Food", value:food },
{ name:"Transport", value:transport },
{ name:"Entertainment", value:entertainment },
{ name:"Savings", value: savings > 0 ? savings : 0 }
];

const COLORS = [
"#ff6384",
"#36a2eb",
"#ffce56",
"#8affc1",
"#9966ff"
];

return(

<main className="p-8 bg-transparent text-white">

<h1 className="text-2xl font-bold mb-6">
💰 Budget Challenge
</h1>

<div className="grid grid-cols-2 gap-8 max-w-2xl">

<div className="bg-transparent">

<label className="block mb-1">Monthly Income (₹)</label>
<input
type="number"
value={income}
onChange={(e)=>setIncome(Number(e.target.value))}
className="border border-gray-500 bg-transparent p-2 w-full mb-3 text-white rounded"
/>

<label className="block mb-1">Rent (₹)</label>
<input
type="number"
value={rent}
onChange={(e)=>setRent(Number(e.target.value))}
className="border border-gray-500 bg-transparent p-2 w-full mb-3 text-white rounded"
/>

<label className="block mb-1">Food (₹)</label>
<input
type="number"
value={food}
onChange={(e)=>setFood(Number(e.target.value))}
className="border border-gray-500 bg-transparent p-2 w-full mb-3 text-white rounded"
/>

<label className="block mb-1">Transport (₹)</label>
<input
type="number"
value={transport}
onChange={(e)=>setTransport(Number(e.target.value))}
className="border border-gray-500 bg-transparent p-2 w-full mb-3 text-white rounded"
/>

<label className="block mb-1">Entertainment (₹)</label>
<input
type="number"
value={entertainment}
onChange={(e)=>setEntertainment(Number(e.target.value))}
className="border border-gray-500 bg-transparent p-2 w-full text-white rounded"
/>

<p className="mt-4 font-semibold text-green-400">
Savings: ₹{savings}
</p>

</div>

<div className="flex justify-center items-center">

<PieChart width={320} height={320}>
<Pie
data={data}
cx="50%"
cy="50%"
outerRadius={110}
dataKey="value"
label
>
{data.map((entry,index)=>(
<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
))}
</Pie>

<Tooltip />
<Legend />

</PieChart>

</div>

</div>

</main>

);

}