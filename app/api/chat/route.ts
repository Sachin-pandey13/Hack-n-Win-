// app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const limitedHistory = (history || []).slice(-10);

    /* detect if user mentioned a problem number */
    const problemMatch = message.match(/leetcode\s*(\d+)/i);
    let currentProblem = null;

    if (problemMatch) {
      currentProblem = problemMatch[1];
    }

    /* get last mentioned problem from history */
    if (!currentProblem) {
      for (let i = limitedHistory.length - 1; i >= 0; i--) {
        const match = limitedHistory[i].content?.match(/leetcode\s*(\d+)/i);
        if (match) {
          currentProblem = match[1];
          break;
        }
      }
    }

    if (!OPENAI_KEY) {
      return NextResponse.json({
        reply:
          "⚠️ AI Tutor is not configured. Please set OPENAI_API_KEY in your environment variables.",
      });
    }

    const systemPrompt = `
You are an expert programming tutor specializing in LeetCode and DSA.

Rules:

1. Always format answers using markdown.
2. Code must always be inside triple backticks.
3. If the user asks "solve it in C++/Java/etc", convert the CURRENT problem solution to that language.
4. If the user explicitly mentions another problem number, switch to that new problem.
5. Never confuse problem numbers.

Current problem number: ${currentProblem ?? "unknown"}

Response format:

### Problem
Problem name

### Solution
\`\`\`language
code
\`\`\`

### Explanation
Short explanation.

### Complexity
Time: O(...)
Space: O(...)
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...limitedHistory.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn("[CHAT] OpenAI error", response.status, errText.slice(0, 500));
      return NextResponse.json({
        reply: "⚠️ AI service temporarily unavailable. Please try again later.",
      });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      reply: "⚠️ AI failed to generate a response.",
    });
  }
}