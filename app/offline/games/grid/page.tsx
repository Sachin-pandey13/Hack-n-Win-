"use client";
import React, { useState } from "react";
import { updateProgress } from "@/lib/gamification";

export default function NumberGridGame() {

  const solution = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9]
  ];

  const [grid, setGrid] = useState<number[][]>(
    Array(9).fill(null).map(() => Array(9).fill(0))
  );

  const [completed, setCompleted] = useState(false);

  function handleChange(row: number, col: number, value: number) {
    if (value < 1 || value > 9) return;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = value;
    setGrid(newGrid);
  }

  function checkSolution() {
    let correct = true;

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] !== solution[i][j]) {
          correct = false;
        }
      }
    }

    if (correct) {
      setCompleted(true);
      updateProgress(50);
    } else {
      alert("❌ Incorrect solution. Try again!");
    }
  }

  function getBorderClasses(i: number, j: number) {
    let classes = "border border-gray-500";

    if (i % 3 === 0) classes += " border-t-4 border-t-purple-500";
    if (j % 3 === 0) classes += " border-l-4 border-l-purple-500";
    if (i === 8) classes += " border-b-4 border-b-purple-500";
    if (j === 8) classes += " border-r-4 border-r-purple-500";

    return classes;
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-xl font-bold mb-4">Sudoku Puzzle</h1>

      <p className="mb-4">
        Fill the grid with numbers 1–9 so each row and column has no repeated number.
      </p>

      <div className="grid grid-cols-9 w-[360px]">
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <input
              key={`${i}-${j}`}
              type="number"
              min="1"
              max="9"
              value={cell === 0 ? "" : cell}
              onChange={(e) =>
                handleChange(i, j, Number(e.target.value))
              }
              className={`w-10 h-10 bg-transparent text-white text-center focus:outline-none ${getBorderClasses(i,j)}`}
            />
          ))
        )}
      </div>

      {!completed ? (
        <button
          onClick={checkSolution}
          className="mt-6 px-4 py-2 rounded bg-blue-700 hover:bg-blue-600"
        >
          Check Solution
        </button>
      ) : (
        <p className="mt-4 text-green-400">
          🎉 Puzzle Completed! (+50 XP)
        </p>
      )}
    </main>
  );
}