// app/api/complexity/groq/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Helpful early warning in server logs (safe)
if (!OPENAI_KEY) {
  console.warn("[OPENAI] OPENAI_API_KEY not set. Requests will fail until set.");
}

/* ---------------- utility helpers ---------------- */

function normalizeBigO(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  const m = t.match(/(?:O|o|Θ|Theta|theta)\s*\(\s*([^)]+)\s*\)/i);
  if (m) return `O(${m[1].replace(/\s+/g, "")})`;
  // fallback simple clean tokens (e.g. "n^2", "n log n", "O(n^2).")
  const plain = t.replace(/^[\s:]+|[\s.]+$/g, "").replace(/\s+/g, " ");
  if (plain.length && /^[\w\s\^\*\+\-\/()]+$/i.test(plain)) return `O(${plain})`;
  return null;
}

function extractFromText(text: string) {
  const out: { time?: string | null; space?: string | null } = {};
  if (!text) return out;

  // search explicit labels like "Time: O(n)" or "time = O(n)"
  const timeLabel = text.match(/time\s*(?:[:=]\s*|is\s+)?([OoΘθTt]?\(?[^\n\r,.]+\)?)/i);
  const spaceLabel = text.match(/space\s*(?:[:=]\s*|is\s+)?([OoΘθTt]?\(?[^\n\r,.]+\)?)/i);
  if (timeLabel) out.time = normalizeBigO(timeLabel[1].trim());
  if (spaceLabel) out.space = normalizeBigO(spaceLabel[1].trim());

  // find O(...) occurrences (first -> time, second -> space)
  const allO = Array.from(text.matchAll(/(?:O|o|Θ|Theta|theta)\s*\([^)]*\)/g)).map((m) => m[0]);
  if (!out.time && allO[0]) out.time = normalizeBigO(allO[0]);
  if (!out.space && allO[1]) out.space = normalizeBigO(allO[1]);

  return out;
}

function stripCodeFences(s: string) {
  // Remove ```json or ``` ... ``` blocks and return inner content joined
  return String(s).replace(/```(?:[\s\S]*?)```/g, (m) => {
    // strip fence and return inside (so JSON can be parsed if present)
    return m.replace(/^```[^\n]*\n?/, "").replace(/```\s*$/, "");
  });
}

function safeParseJSONMaybe(s: string): any | null {
  if (!s) return null;
  const trimmed = s.trim();
  // If it already looks like an object/array start -> try parse directly
  try {
    return JSON.parse(trimmed);
  } catch {
    // try to extract first {...} block
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        // try to remove code fences then parse
        const cleaned = stripCodeFences(trimmed);
        const mm = cleaned.match(/\{[\s\S]*\}/);
        if (mm) {
          try {
            return JSON.parse(mm[0]);
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

/* ---------------- route handler ---------------- */

export async function POST(req: Request) {
  try {
    // parse body defensively
    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? body.source ?? body.snippet ?? "");
    const language = String(body.language ?? "unknown");

    if (!code) {
      return NextResponse.json({ time: null, space: null, series: undefined, error: "no code provided" }, { status: 200 });
    }

    if (!OPENAI_KEY) {
      // Give a clear message instead of silently failing
      return NextResponse.json({ time: null, space: null, series: undefined, error: "OPENAI_API_KEY not configured" }, { status: 503 });
    }

    const system = `
You are an assistant that must analyze the algorithmic time and space complexity of the provided code.
You MUST return only a single JSON object, with keys "time" and "space", whose values are Big-O strings
like "O(n)", "O(n^2)", "O(1)" or null if uncertain. Optionally include "series": [{"n":..., "ops":...}, ...].
Do NOT output any extra human-friendly text outside the JSON object.
`.trim();

    const user = `
Language: ${language}
Code:
\`\`\`
${code}
\`\`\`

Return ONLY the JSON object described above.
`.trim();

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      max_tokens: 700,
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
      console.warn("[OPENAI] non-ok", resp.status, txt.slice?.(0, 1000));
      // Return a safe response shape; include hint about status
      const statusHint = resp.status === 429 ? "rate_limited" : resp.status === 401 ? "unauthorized" : "openai_error";
      return NextResponse.json({ time: null, space: null, series: undefined, error: statusHint }, { status: 200 });
    }

    const json = await resp.json().catch(() => null);
    const rawContent =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.text ??
      (typeof json === "string" ? json : null) ??
      "";

    const contentStr = String(rawContent ?? "");
    console.log("[OPENAI raw content preview]", contentStr.slice(0, 2000));

    // 1) Try strict JSON parse (handles when model returned pure JSON)
    let parsed = safeParseJSONMaybe(contentStr);

    // 2) If not parsed, try to extract labeled Time/Space from the raw text (fallback)
    let time: string | null = null;
    let space: string | null = null;
    let series: { n: number; ops: number }[] | undefined = undefined;

    if (parsed && typeof parsed === "object") {
      // Accept object shapes with a few possible key names
      time = normalizeBigO(parsed.time ?? parsed.Time ?? parsed.t ?? null);
      space = normalizeBigO(parsed.space ?? parsed.Space ?? parsed.mem ?? parsed.memory ?? null);

      if (Array.isArray(parsed.series)) {
        try {
          series = parsed.series
            .map((x: any) => ({
              n: Number(x?.n ?? x?.N ?? x?.size),
              ops: Number(x?.ops ?? x?.opsCount ?? x?.ops_per_n ?? x?.value),
            }))
            .filter((p: any) => Number.isFinite(p.n) && Number.isFinite(p.ops))
            .map((p: any) => ({ n: Math.max(1, Math.round(p.n)), ops: Math.max(1, Math.round(p.ops)) }));

          if (series.length === 0) series = undefined;
        } catch (e) {
          series = undefined;
        }
      }
    }

    // Fallback textual extraction if JSON parse failed or missing fields
    if ((!time || !space) && contentStr) {
      const extracted = extractFromText(contentStr);
      if (!time && extracted.time) time = extracted.time;
      if (!space && extracted.space) space = extracted.space;
    }

    // Final defensive normalization: ensure null if unknown
    time = normalizeBigO(time ?? null) ?? null;
    space = normalizeBigO(space ?? null) ?? null;

    console.log("[OPENAI normalized]", { time, space, seriesLength: series?.length ?? 0 });

    return NextResponse.json({ time: time ?? null, space: space ?? null, series: series ?? undefined }, { status: 200 });
  } catch (err) {
    console.error("[OPENAI route error]", err);
    return NextResponse.json({ time: null, space: null, series: undefined, error: "internal" }, { status: 200 });
  }
}
