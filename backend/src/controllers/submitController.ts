import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { Request, Response } from "express";

// LangChain Groq
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

import db from "../db"; // ORM adapter (Prisma/Sequelize/etc.)

// ---------- Groq Setup ----------
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY, // stored in .env
});

// ---------- Languages ----------
const langConfig: Record<
  string,
  { compile: string | null; run: string; file: string; outFile?: string }
> = {
  c: { compile: "gcc", run: "./a.out", file: "Main.c", outFile: "a.out" },
  cpp: { compile: "g++", run: "./a.out", file: "Main.cpp", outFile: "a.out" },
  java: { compile: "javac", run: "java Main", file: "Main.java", outFile: "Main.class" },
  python: { compile: null, run: "python3 Main.py", file: "Main.py" },
};

// ---------- Complexity Analyzer via Groq ----------
// ---------- Complexity Analyzer via Groq ----------
async function analyzeComplexityWithGroq(code: string, lang: string) {
  if (!process.env.GROQ_API_KEY) {
    return {
      time: "Unknown",
      space: "Unknown",
      explanation: "❌ Groq API key not set. Please configure GROQ_API_KEY in .env",
    };
  }

  const prompt = `
  Analyze the following ${lang} code.

  Return ONLY valid JSON with three fields:
  {
    "time": "<Big-O time complexity>",
    "space": "<Big-O space complexity>",
    "explanation": "<short explanation in 2-3 sentences>"
  }

  Be concise. Do not exceed 3 sentences in the explanation.
  Do not include any extra text outside JSON.

  Code:
  ${code}
  `;

  try {
    console.log("🔍 Sending code to Groq for complexity analysis...");
    const response = await llm.invoke([new HumanMessage(prompt)]);

    // ✅ Debug: show raw response
    console.log("✅ Groq raw response:", JSON.stringify(response, null, 2));
    console.log("🔎 Response content type:", typeof response.content);

    // ✅ Normalize response into a string
    const content =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content)
        ? response.content.map((c: any) => (c.text ? c.text : "")).join("\n")
        : JSON.stringify(response.content);

    let jsonString = content.trim();

    // ✅ Handle ```json ... ``` blocks
    const codeBlockMatch = jsonString.match(/```(?:json)?([\s\S]*?)```/i);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // ✅ Extract the *first* valid JSON object
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);

        // ✅ Enforce structure (fill missing fields with defaults)
        return {
          time: parsed.time || "Unknown",
          space: parsed.space || "Unknown",
          explanation: parsed.explanation || "No explanation provided",
        };
      } catch (e) {
        console.error("❌ Failed to parse JSON:", match[0]);
        return {
          time: "Unknown",
          space: "Unknown",
          explanation: "⚠️ Groq returned invalid JSON, parsing failed",
        };
      }
    }

    // ✅ Retry once with a stricter prompt
    console.warn("⚠️ No JSON found. Retrying with stricter prompt...");
    const retryResponse = await llm.invoke([
      new HumanMessage(
        `Return ONLY JSON with fields: time, space, explanation. No extra text. Code:\n${code}`
      ),
    ]);
    const retryContent =
      typeof retryResponse.content === "string"
        ? retryResponse.content
        : JSON.stringify(retryResponse.content);
    const retryMatch = retryContent.match(/\{[\s\S]*\}/);
    if (retryMatch) {
      return JSON.parse(retryMatch[0]);
    }

    return {
      time: "Unknown",
      space: "Unknown",
      explanation: "⚠️ Groq responded but no JSON could be extracted",
    };
  } catch (e: any) {
    console.error("❌ Groq complexity error:", e.message || e);
    return {
      time: "Unknown",
      space: "Unknown",
      explanation: `Groq API error: ${e.message || "Unknown error"}`,
    };
  }
}



// ---------- Controller ----------
export const submitCode = async (req: Request, res: Response) => {
  const { code, language, problemId, testCases } = req.body;

  if (!langConfig[language]) {
    return res.status(400).json({ status: "Error", output: "Unsupported language" });
  }

  const workDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);

  const config = langConfig[language];
  const filePath = path.join(workDir, config.file);
  fs.writeFileSync(filePath, code);

  const execStart = performance.now();

  try {
    // ---------- Step 1: Compile ----------
    if (config.compile) {
      await new Promise((resolve, reject) => {
        const compileProc = spawn(config.compile as string, [filePath], { cwd: workDir });

        let compileErr = "";
        compileProc.stderr.on("data", (d: Buffer) => (compileErr += d.toString()));

        compileProc.on("close", (code: number) => {
          if (code !== 0) {
            return reject(new Error(parseCompilerError(compileErr, language)));
          }
          resolve(true);
        });
      });
    }

    // ---------- Step 2: Run Testcases ----------
    const outputs: { input: string; expected: string; got: string }[] = [];
    let wrongAnswer = false;

    for (const input of testCases) {
      const got = (await new Promise((resolve, reject) => {
        const [cmd, ...args] = config.run.split(" ");
        const runProc = spawn(cmd, args, { cwd: workDir });

        let stdout = "";
        let stderr = "";

        runProc.stdin.write(input.input + "\n");
        runProc.stdin.end();

        runProc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
        runProc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

        runProc.on("close", (code: number) => {
          if (code !== 0) return reject(new Error(parseRuntimeError(stderr, language)));
          resolve(stdout.trim());
        });
      })) as string;

      outputs.push({ input: input.input, expected: input.expected, got });
      if (got !== input.expected) wrongAnswer = true;
    }

    const execEnd = performance.now();
    const runtime = Math.round(execEnd - execStart);

    // ---------- Step 3: Wrong Answer ----------
    if (wrongAnswer) {
      return res.json({
        status: "Wrong Answer",
        runtime,
        memory: null,
        testcases: outputs,
        complexity: null,
        optimal: null,
        isOptimal: false,
      });
    }

    // ---------- Step 4: Complexity (Groq) ----------
    const complexity = await analyzeComplexityWithGroq(code, language);
    const optimal = await db.optimal.findUnique({ where: { problemId } });
    const isOptimal =
      optimal &&
      complexity.time === optimal.time &&
      complexity.space === optimal.space;

    return res.json({
      status: "Accepted",
      runtime,
      memory: null,
      testcases: outputs,
      complexity, // includes { time, space, explanation }
      optimal,
      isOptimal: !!isOptimal,
    });
  } catch (err: any) {
    return res.json({
      status: "Compilation Error",
      runtime: null,
      memory: null,
      output: err.message,
      testcases: [],
      complexity: null,
      optimal: null,
      isOptimal: false,
    });
  }
};

// ---------- Error Parsers ----------
function parseCompilerError(stderr: string, lang: string): string {
  if (lang === "c" || lang === "cpp") {
    return stderr.split("\n").filter((l) => l.includes("error")).slice(0, 3).join("\n");
  }
  if (lang === "java") {
    return stderr.split("\n").filter((l) => l.includes("error")).slice(0, 3).join("\n");
  }
  return stderr.split("\n").slice(0, 3).join("\n");
}

function parseRuntimeError(stderr: string, lang: string): string {
  if (!stderr) return "Unknown runtime error";
  if (lang === "python") return stderr.split("\n").slice(-3).join("\n");
  return stderr.split("\n").slice(0, 3).join("\n");
}
