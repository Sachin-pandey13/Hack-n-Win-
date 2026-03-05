/**
 * Temporary DB stub for optimal complexity lookup.
 * 
 * Why this file exists:
 * - Your submitController.ts needs to compare the user's solution
 *   complexity (from Groq) against the "optimal" complexity
 *   defined by problem setters.
 * - This stub avoids TS errors and simulates a DB.
 * - Later you can replace this with a real database
 *   (Prisma, Sequelize, TypeORM, Mongo, etc.)
 */

type Complexity = {
  time: string;
  space: string;
  explanation?: string;
};

// Fake in-memory "database" of problems
const optimalTable: Record<string, Complexity> = {
  "two-sum": { time: "O(n)", space: "O(1)", explanation: "Hashmap lookup is optimal." },
  "reverse-string": { time: "O(n)", space: "O(1)", explanation: "Two-pointer swap in place." },
  "factorial": { time: "O(n)", space: "O(1)", explanation: "Iterative multiplication is optimal." },
  // add more problems here...
};

const db = {
  optimal: {
    async findUnique({ where: { problemId } }: { where: { problemId: string } }): Promise<Complexity | null> {
      return optimalTable[problemId] || null;
    },
  },
};

export default db;
