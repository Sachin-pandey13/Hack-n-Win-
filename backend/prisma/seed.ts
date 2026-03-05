import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  // FIX: go up two directories to reach root "lib/problems.json"
  const filePath = path.join(__dirname, "../../lib/problems.json");
  const problems: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const problem of problems) {
    const slug = slugify(problem.title, { lower: true, strict: true });

    await prisma.problem.upsert({
      where: { slug },
      update: {},
      create: {
        title: problem.title,
        slug,
        difficulty: problem.difficulty,
        statement: problem.statement.content,
        constraints: problem.statement.constraints.join(", "),
        category: problem.category,
        acceptance: problem.acceptance,

        platform: {
          connectOrCreate: {
            where: { name: problem.platform || "LeetCode" }, // ✅ flexible
            create: { name: problem.platform || "LeetCode" },
          },
        },

        testCases: {
          create: problem.statement.examples.map((ex: any) => ({
            input: ex.input,
            output: ex.output,
          })),
        },

        tags: {
          create: problem.tags.map((tag: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },

        languages: {
          create: problem.languages.map((lang: string) => ({
            language: {
              connectOrCreate: {
                where: { name: lang },
                create: { name: lang },
              },
            },
          })),
        },

        optimalSolution: problem.optimal
          ? {
              create: {
                timeComplexity: problem.optimal.timeComplexity,
                spaceComplexity: problem.optimal.spaceComplexity,
                explanation: problem.optimal.explanation,
              },
            }
          : undefined,
      },
    });
  }
}

main()
  .then(() => {
    console.log("✅ Database seeded successfully");
  })
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
