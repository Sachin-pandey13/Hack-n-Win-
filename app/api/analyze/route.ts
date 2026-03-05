// app/api/analyze/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Try parse JSON safely. Returns null on failure.
 */
function safeJSONParse(s: string | null | undefined) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Remove surrounding Markdown fences and return inner text.
 */
function stripCodeFences(s: string) {
  if (!s) return s;
  // remove ```lang ... ``` blocks but keep inner content
  return String(s).replace(/```(?:[\s\S]*?)```/g, (m) => {
    return m.replace(/^```[^\n]*\n?/, "").replace(/```\s*$/, "");
  });
}

/**
 * Extract first {...} JSON block from a string (very tolerant).
 */
function extractFirstJsonBlock(s: string) {
  if (!s) return null;
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  return m[0];
}

/**
 * Build a safe default response shape so frontend can rely on fields.
 */
function defaultAnalysisShape() {
  return {
    summary: null,
    complexity: { time: null, space: null, series: null },
    errors: [] as Array<{ type: string; message: string; line: number | null; snippet?: string | null }>,
    suggestions: [] as string[],
    confidence: "low",
  };
}

export async function POST(req: Request) {
  try {
    // parse body defensively
    const body = await req.json().catch(() => ({} as any));
    const code = String(body.code ?? body.source ?? body.snippet ?? "");
    const language = String(body.language ?? "unknown");
    const compileOutput = String(body.compile_output ?? body.stderr ?? body.compileOutput ?? "") || "";
    const extraContext = String(body.context ?? "") || "";

    if (!code) {
      return NextResponse.json({ error: "no code provided" }, { status: 400 });
    }
    if (!OPENAI_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured on server" }, { status: 503 });
    }

    // System prompt: strict JSON-only output
    const system = `
You are a precise code analysis assistant. When given source code and language,
you MUST output a single valid JSON object (no extra commentary) with the following shape:
{
  "summary": "<short human summary|null>",
  "complexity": {
    "time": "O(n)" | null,
    "space": "O(1)" | null,
    "series": [{ "n": 10, "ops": 120 }, ...] | null
  },
  "errors": [
    {
      "type": "syntax" | "compile" | "runtime" | "logical" | "style",
      "message": "<concise message>",
      "line": 123 | null,
      "snippet": "<optional small code snippet|null>"
    }
  ],
  "suggestions": ["...","..."],
  "confidence": "low" | "medium" | "high"
}

Rules:
- Return JSON only (no markdown, no wrapper text).
- If you cannot determine something, set that field to null or an empty array.
- For complexity, if you cannot measure, still return best estimate as a Big-O string or null.
- For errors: include file line numbers relative to the provided code (1-indexed) when possible.
- For `series`: include numeric ops for multiple n values if you can (optional).
- Keep messages concise (one-two sentences each).
`.trim();

    // Provide compile output & extra context to the assistant to help detect syntax/compile errors.
    const user = `
Language: ${language}

Source code:
\`\`\`
${code}
\`\`\`

Compile / runtime output (if any):
\`\`\`
${compileOutput}
\`\`\`

Extra context:
\`\`\`
${extraContext}
\`\`\`

Analyze the code as requested above and return the JSON object ONLY.
`.trim();

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      max_tokens: 1200,
      n: 1,
    };

    const resp = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // handle non-OK statuses (rate limit / auth / bad request)
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.warn("[ANALYZE] OpenAI non-ok", resp.status, txt.slice?.(0, 1000));
      // Return a helpful shape with an error hint so frontend can show friendly UI
      const hint =
        resp.status === 429 ? "rate_limited" : resp.status === 401 ? "unauthorized" : "openai_error";
      return NextResponse.json({ ...defaultAnalysisShape(), error: hint, raw: txt.slice(0, 1000) }, { status: 200 });
    }

    // Get text, try to parse JSON out of it robustly
    const text = await resp.text().catch(() => "");
    const cleaned = stripCodeFences(String(text ?? ""));
    let parsed = safeJSONParse(cleaned);

    if (!parsed) {
      // try to find a JSON block inside the text
      const block = extractFirstJsonBlock(cleaned);
      if (block) parsed = safeJSONParse(block);
    }

    if (!parsed) {
      // As a last resort, try to extract and parse any {...} after removing leading/trailing non-json
      const maybe = cleaned.replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/m, "$1");
      parsed = safeJSONParse(maybe);
    }

    if (!parsed) {
      // If still not parsed — return safe default with raw for debugging
      console.warn("[ANALYZE] Failed to parse AI response as JSON. Raw preview:", String(text).slice(0, 800));
      return NextResponse.json(
        {
          ...defaultAnalysisShape(),
          error: "failed_to_parse_ai_response",
          raw: String(text).slice(0, 1000),
        },
        { status: 200 }
      );
    }

    // Normalize fields to expected shape (defensive)
    const out = defaultAnalysisShape();

    if (typeof parsed.summary === "string") out.summary = parsed.summary;
    if (parsed.complexity && typeof parsed.complexity === "object") {
      out.complexity.time = parsed.complexity.time ?? parsed.complexity.Time ?? null;
      out.complexity.space = parsed.complexity.space ?? parsed.complexity.space ?? null;
      // series normalization if provided
      if (Array.isArray(parsed.complexity.series) && parsed.complexity.series.length > 0) {
        try {
          out.complexity.series = parsed.complexity.series
            .map((s: any) => ({ n: Number(s?.n ?? s?.N), ops: Number(s?.ops ?? s?.opsCount ?? s?.value) }))
            .filter((p: any) => Number.isFinite(p.n) && Number.isFinite(p.ops))
            .map((p: any) => ({ n: Math.max(1, Math.round(p.n)), ops: Math.max(1, Math.round(p.ops)) }));
          if ((out.complexity.series ?? []).length === 0) out.complexity.series = null;
        } catch {
          out.complexity.series = null;
        }
      } else {
        out.complexity.series = out.complexity.series ?? null;
      }
    }

    if (Array.isArray(parsed.errors)) {
      out.errors = parsed.errors
        .map((e: any) => ({
          type: e.type ?? "logical",
          message: String(e.message ?? e.msg ?? "").slice(0, 1000),
          line: typeof e.line === "number" ? Math.max(1, Math.round(e.line)) : null,
          snippet: e.snippet ?? null,
        }))
        .slice(0, 20); // limit length
    }

    if (Array.isArray(parsed.suggestions)) {
      out.suggestions = parsed.suggestions.map((s: any) => String(s)).slice(0, 10);
    } else if (typeof parsed.suggestions === "string") {
      out.suggestions = [parsed.suggestions];
    }

    if (parsed.confidence && (parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high")) {
      out.confidence = parsed.confidence;
    } else {
      out.confidence = out.errors && out.errors.length > 0 ? "medium" : "high";
    }

    // If the model included top-level fields not expected, keep them in `meta` to help debug (optional)
    const extraKeys = Object.keys(parsed).filter((k) => !["summary", "complexity", "errors", "suggestions", "confidence"].includes(k));
    if (extraKeys.length > 0) {
      // attach small raw preview to help debugging in UI if needed
      (out as any).meta = { raw_preview: JSON.stringify(parsed, null, 2).slice(0, 800) };
    }

    // Return normalized response
    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    console.error("[ANALYZE] internal error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
