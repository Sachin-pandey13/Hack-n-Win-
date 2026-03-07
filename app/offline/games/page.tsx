import Link from "next/link";

export default function GamesPage() {
  const games = [
    { id: "math", name: "Math Puzzle Challenge" },
    { id: "circuit", name: "Circuit Builder" },
    { id: "periodic", name: "Periodic Table Quiz" },
    { id: "wordmatch", name: "Word Match (Science Terms)" },
    { id: "guess", name: "Binary Logic Games"},
    { id: "grid",  name: "Grid Game(Sudoku-Style)"},
    { id: "geography",  name: "KBC Game(Geography-Based)"},
    { id: "budget",  name: "Budget Challenge Game"},
    { id: "riddle",  name: "Riddle Game"},
  ];

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-bold mb-6">Offline Games</h1>
      <ul className="space-y-3">
        {games.map((g) => (
          <li key={g.id}>
            <Link
              href={`/offline/games/${g.id}`}
              className="block p-4 bg-gray-900/60 border border-gray-700 rounded hover:bg-gray-800"
            >
              {g.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
