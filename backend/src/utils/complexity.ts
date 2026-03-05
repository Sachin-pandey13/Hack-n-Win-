import { exec } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Analyze code complexity using lizard (supports C, C++, Java, Python).
 * You need to install lizard globally or locally:
 *   pip install lizard
 */
export async function analyzeComplexity(code: string, lang: string) {
  return new Promise<{ time: string; space: string }>((resolve) => {
    try {
      // Save code temporarily
      const workDir = path.join(__dirname, "../../temp");
      if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);

      const ext =
        lang === "cpp"
          ? "cpp"
          : lang === "c"
          ? "c"
          : lang === "java"
          ? "java"
          : "py";
      const filePath = path.join(workDir, `ComplexityCheck.${ext}`);
      fs.writeFileSync(filePath, code);

      // Run lizard on file
      exec(`lizard ${filePath}`, (err, stdout) => {
        if (err) {
          console.error("Lizard error:", err);
          return resolve({ time: "Unknown", space: "Unknown" });
        }

        /**
         * Example lizard output snippet:
         * ===================================
         * ===================================
         * NLOC    CCN   token  PARAM length location
         * 5       2     34     2     7      main@Main.cpp
         * -----------------------------------
         * Total nloc: 5
         * Average CCN: 2.0
         * ===================================
         */
        let timeComplexity = "O(1)";
        let spaceComplexity = "O(1)";

        const match = stdout.match(/Average CCN:\s+([\d.]+)/);
        if (match) {
          const ccn = parseFloat(match[1]);
          if (ccn <= 5) timeComplexity = "O(n)";
          else if (ccn <= 10) timeComplexity = "O(n^2)";
          else if (ccn <= 20) timeComplexity = "O(n^3)";
          else timeComplexity = "O(n^k)";
        }

        // Heuristic: bigger CCN -> assume more space usage
        if (stdout.includes("new") || stdout.includes("malloc")) {
          spaceComplexity = "O(n)";
        }

        return resolve({ time: timeComplexity, space: spaceComplexity });
      });
    } catch (e) {
      console.error("Complexity analysis failed:", e);
      return resolve({ time: "Unknown", space: "Unknown" });
    }
  });
}
