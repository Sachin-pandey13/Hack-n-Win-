// src/services/analyzer/complexityAnalyzer.ts
import Groq from "groq-sdk";

export interface ComplexityResult {
  time: string;
  space: string;
  explanation: string;
}

// 🔍 Heuristic detection for common patterns
function detectHeuristicComplexity(code: string): ComplexityResult | null {
  const lowerCode = code.toLowerCase();

  // Count loops
  const loopMatches =
    (code.match(/for\s*\(/g) || []).length +
    (code.match(/while\s*\(/g) || []).length +
    (code.match(/for\s+each/g) || []).length;

  // Detect recursion
  const funcNameMatch = code.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  const funcName = funcNameMatch ? funcNameMatch[1] : null;
  const recursive = funcName ? new RegExp(`\\b${funcName}\\s*\\(`).test(code) : false;

  // Detect sorting
  const sorting = /(sort\(|sorted\(|Arrays\.sort|Collections\.sort)/.test(code);

  if (recursive) {
    return {
      time: "O(2^n) or O(n)", // depends on type of recursion
      space: "O(n)",
      explanation: "Detected recursion — could be exponential or linear depending on implementation.",
    };
  }

  if (sorting) {
    return {
      time: "O(n log n)",
      space: "O(1)",
      explanation: "Detected sorting algorithm usage.",
    };
  }

  if (loopMatches >= 2) {
    return {
      time: "O(n^2)",
      space: "O(1)",
      explanation: "Detected nested loops.",
    };
  }

  if (loopMatches === 1) {
    return {
      time: "O(n)",
      space: "O(1)",
      explanation: "Detected single loop.",
    };
  }

  return null; // fallback to AI
}

// 🤖 AI-based analyzer (Groq)
const analyzeWithAI = async (code: string, language: string): Promise<ComplexityResult> => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `
  Analyze the following ${language} code and return ONLY a JSON object with:
  {
    "time": "O(...)",
    "space": "O(...)",
    "explanation": "..."
  }

  Code:
  ${code}
  `;

  try {
    console.log("🔍 Sending code to Groq for complexity analysis...");
    const response = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || "{}";
    console.log("✅ Groq response:", content);

    return JSON.parse(content);
  } catch (err) {
    console.error("❌ Error parsing Groq response:", err);
    return { time: "O(?)", space: "O(?)", explanation: "AI could not analyze code" };
  }
};

// 🚀 Final Analyzer (Hybrid)
export const analyzeComplexity = async (
  code: string,
  language_id: number
): Promise<ComplexityResult> => {
  // Step 1: Try heuristic first
  const heuristicResult = detectHeuristicComplexity(code);
  if (heuristicResult) {
    console.log("⚡ Using heuristic complexity:", heuristicResult);
    return heuristicResult;
  }

  // Step 2: Otherwise → use Groq AI
  const languageMap: Record<number, string> = {
    71: "Python",
    54: "C++",
    62: "Java",
    63: "JavaScript",
    68: "PHP",
    50: "C",
    74: "TypeScript",
  };

  const language = languageMap[language_id] || "Unknown";
  return await analyzeWithAI(code, language);
};
