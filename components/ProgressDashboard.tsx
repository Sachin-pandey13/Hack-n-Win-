"use client";
import React, { useEffect, useState } from "react";
import { getProgress } from "@/lib/gamification";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";

export default function ProgressDashboard() {

  const [progress, setProgress] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  if (!progress) return <div>Loading progress...</div>;

  const chartData = [
    { name: "Easy", value: 12 },
    { name: "Medium", value: 7 },
    { name: "Hard", value: 3 },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 15}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const totalSolved =
    chartData[0].value + chartData[1].value + chartData[2].value;

  return (
    <div className="p-6 bg-gray-900/70 rounded-lg border border-gray-700 
    transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:backdrop-blur-xl">

      {/* TITLE */}
      <h2 className="text-xl font-bold mb-6">Your Progress</h2>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-gray-800 p-4 rounded-lg text-center 
        transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
          <p className="text-gray-400 text-sm">XP</p>
          <p className="text-xl font-bold text-indigo-400">{progress.xp}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg text-center 
        transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
          <p className="text-gray-400 text-sm">Level</p>
          <p className="text-xl font-bold text-green-400">{progress.level}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg text-center 
        transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
          <p className="text-gray-400 text-sm">Streak</p>
          <p className="text-xl font-bold text-orange-400">
            {progress.streak} days
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg text-center 
        transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
          <p className="text-gray-400 text-sm">Rank</p>
          <p className="text-xl font-bold text-yellow-400">#234</p>
        </div>

      </div>

      {/* PIE CHART + STATS */}
      <div className="grid md:grid-cols-2 gap-8 items-center">

        {/* PIE CHART */}
        <div className="w-full h-[420px] 
        transition-all duration-300 hover:-translate-y-2 hover:scale-105">

          <ResponsiveContainer>
            <PieChart>

              <Pie
  data={chartData}
  cx="50%"
  cy="50%"
  innerRadius={90}
  outerRadius={150}
  paddingAngle={4}
  dataKey="value"
  activeIndex={activeIndex}
  activeShape={renderActiveShape}
  onMouseEnter={onPieEnter}
  label={({ name, percent }) =>
    `${name} ${(percent * 100).toFixed(0)}%`
  }
  labelLine={false}
>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                    style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* SOLVED STATS */}
        <div className="space-y-4">

          <h3 className="text-lg font-semibold">Solved Problems</h3>

          <div className="flex justify-between bg-gray-800 p-4 rounded 
          transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
            <span className="text-green-400">Easy</span>
            <span>{chartData[0].value}</span>
          </div>

          <div className="flex justify-between bg-gray-800 p-4 rounded 
          transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
            <span className="text-yellow-400">Medium</span>
            <span>{chartData[1].value}</span>
          </div>

          <div className="flex justify-between bg-gray-800 p-4 rounded 
          transition-all duration-300 hover:-translate-y-2 hover:bg-gray-700 hover:shadow-xl">
            <span className="text-red-400">Hard</span>
            <span>{chartData[2].value}</span>
          </div>

          <div className="flex justify-between bg-indigo-700 p-4 rounded font-bold">
            <span>Total Solved</span>
            <span>{totalSolved}</span>
          </div>

        </div>
      </div>

      {/* BADGES */}
      <div className="mt-10">
        <p className="text-gray-300 mb-3 font-semibold">Achievements</p>

        <div className="flex gap-3 flex-wrap">

          {progress.badges.length > 0 ? (
            progress.badges.map((b: string, i: number) => (
              <div
                key={i}
                className="px-3 py-2 bg-yellow-600 text-white text-xs rounded"
              >
                {b}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No badges yet</p>
          )}

        </div>
      </div>

    </div>
  );
}