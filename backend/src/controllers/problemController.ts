// src/controllers/problemController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Get all problems
export const getAllProblems = async (req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      include: {
        testCases: true,
        tags: { include: { tag: true } },
        languages: { include: { language: true } },
        optimalSolution: true,   // ✅ FIXED
      },
    });
    res.json(problems);
  } catch (error) {
    console.error("❌ Error fetching problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};

// ✅ Get single problem by ID
export const getProblemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true,
        tags: { include: { tag: true } },
        languages: { include: { language: true } },
        optimalSolution: true,   // ✅ FIXED
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(problem);
  } catch (error) {
    console.error("❌ Error fetching problem:", error);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
};

// ✅ Create a new problem
export const createProblem = async (req: Request, res: Response) => {
  try {
    const {
      title,
      difficulty,
      statement,
      constraints,
      category,
      acceptance,
      platformId,
      tags,
      languages,
      testCases,
      optimalSolution,
    } = req.body;

    const newProblem = await prisma.problem.create({
      data: {
        title,
        difficulty,
        statement,
        constraints,
        category,
        acceptance,
        platformId,

        // ✅ Tags (many-to-many)
        tags: tags
          ? {
              create: tags.map((tag: string) => ({
                tag: { connectOrCreate: { where: { name: tag }, create: { name: tag } } },
              })),
            }
          : undefined,

        // ✅ Languages (many-to-many)
        languages: languages
          ? {
              create: languages.map((lang: string) => ({
                language: { connectOrCreate: { where: { name: lang }, create: { name: lang } } },
              })),
            }
          : undefined,

        // ✅ Test cases
        testCases: testCases ? { create: testCases } : undefined,

        // ✅ Optimal solution
        optimalSolution: optimalSolution
          ? {
              create: {
                timeComplexity: optimalSolution.timeComplexity,
                spaceComplexity: optimalSolution.spaceComplexity,
                explanation: optimalSolution.explanation,
              },
            }
          : undefined,
      },
      include: {
        testCases: true,
        tags: { include: { tag: true } },
        languages: { include: { language: true } },
        optimalSolution: true,
      },
    });

    res.status(201).json(newProblem);
  } catch (error) {
    console.error("❌ Error creating problem:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
};
