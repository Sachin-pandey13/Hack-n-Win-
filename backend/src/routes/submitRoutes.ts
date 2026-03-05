import { Router } from "express";
import { submitCode } from "../controllers/submitController";

const router = Router();

router.post("/submit", submitCode);

export default router;
