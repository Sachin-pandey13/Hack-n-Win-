// src/routes/problemRoutes.ts
import { Router } from "express";
import { getAllProblems, getProblemById, createProblem } from "../controllers/problemController";

const router = Router();

router.get("/", getAllProblems);      // GET all
router.get("/:id", getProblemById);   // GET single problem
router.post("/", createProblem);      // Add new problem

export default router;
