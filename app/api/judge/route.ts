// app/api/judge/route.ts
import { NextResponse } from "next/server";

type Judge0Request = {
  source_code: string;
  language_id: number; // 54 C++, 62 Java, 71 Python, 50 C
  stdin?: string;
};

const DEFAULT_TIMEOUT_MS = 15000; // 15s upstream timeout

function getJudge0Config() {
  // prefer self-hosted Judge0 if configured
  const JUDGE0_URL = process.env.JUDGE0_URL?.replace(/\/+$/, "");
  if (JUDGE0_URL) {
    return {
      // IMPORTANT: we use base64_encoded=true here for self-hosted as well
      url: `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      headers: { "Content-Type": "application/json" } as Record<string, string>,
      provider: "self",
      usesBase64: true,
    };
  }

  // otherwise require RAPIDAPI_KEY for judge0-ce on RapidAPI
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    return null;
  }

  return {
    // IMPORTANT: base64_encoded=true for RapidAPI as requested by Judge0 when non-UTF8 content present
    url: "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    } as Record<string, string>,
    provider: "rapidapi",
    usesBase64: true,
  };
}

/** Safe parse with fallback to raw text or inner JSON block */
async function safeParseJson(res: Response) {
  try {
    const j = await res.json();
    return j;
  } catch (jsonErr) {
    try {
      const txt = await res.text();
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          // fallthrough
        }
      }
      return { rawText: txt };
    } catch {
      return null;
    }
  }
}

function safePreview(obj: any, maxLen = 2000) {
  try {
    return JSON.stringify(obj).slice(0, maxLen);
  } catch {
    try {
      return String(obj).slice(0, maxLen);
    } catch {
      return "";
    }
  }
}

// helper to decode base64 safely
function tryDecodeBase64(s: any) {
  if (!s || typeof s !== "string") return "";
  try {
    // Node's Buffer is available in Next.js server handlers
    return Buffer.from(s, "base64").toString("utf8");
  } catch {
    return s;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Judge0Request | undefined;

    if (!body || !body.source_code || !body.language_id) {
      return NextResponse.json(
        { message: "source_code and language_id are required" },
        { status: 400 }
      );
    }

    const cfg = getJudge0Config();
    if (!cfg) {
      return NextResponse.json(
        {
          stdout: "",
          stderr: "",
          compile_output: "",
          message:
            "Judge service not configured. Set JUDGE0_URL for self-hosted Judge0 or RAPIDAPI_KEY for RapidAPI.",
          status: { id: 13, description: "Judge Unavailable" },
        },
        { status: 503 }
      );
    }

    // When upstream expects base64, encode source_code + stdin.
    const usesBase64 = !!cfg.usesBase64;
    const upstreamBody: any = {
      source_code: usesBase64
        ? Buffer.from(body.source_code, "utf8").toString("base64")
        : body.source_code,
      language_id: body.language_id,
      stdin: usesBase64 && body.stdin ? Buffer.from(body.stdin, "utf8").toString("base64") : (body.stdin ?? ""),
    };

    // perform fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(cfg.url, {
        method: "POST",
        headers: cfg.headers,
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      const msg =
        err?.name === "AbortError"
          ? "Upstream judge request timed out"
          : err?.message ?? "Network error contacting judge service";
      return NextResponse.json(
        {
          stdout: "",
          stderr: "",
          compile_output: "",
          message: msg,
          status: { id: 13, description: "Upstream Error" },
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamRes.ok) {
      const raw = await upstreamRes.text().catch(() => "");
      let friendly = `Judge returned ${upstreamRes.status}`;

      if (upstreamRes.status === 403 || /not subscribed|You are not subscribed/i.test(raw)) {
        friendly = "Judge service rejected request (not subscribed or invalid key).";
      } else if (upstreamRes.status === 429) {
        friendly = "Rate limit exceeded by judge service (429). Try again later.";
      } else if (upstreamRes.status >= 500) {
        friendly = "Judge service error (server-side).";
      }

      return NextResponse.json(
        {
          stdout: "",
          stderr: "",
          compile_output: "",
          message: friendly,
          raw: raw ? raw.slice(0, 2000) : "",
          status: { id: upstreamRes.status, description: friendly },
        },
        { status: upstreamRes.status === 429 ? 429 : 502 }
      );
    }

    // upstreamRes.ok — parse safely
    const data = await safeParseJson(upstreamRes);

    // If we sent base64, Judge0 returns outputs base64-encoded as well.
    // Decode them before returning to the frontend.
    const decoded_stdout = data?.stdout ? (usesBase64 ? tryDecodeBase64(data.stdout) : data.stdout) : "";
    const decoded_stderr = data?.stderr ? (usesBase64 ? tryDecodeBase64(data.stderr) : data.stderr) : "";
    const decoded_compile_output = data?.compile_output ? (usesBase64 ? tryDecodeBase64(data.compile_output) : data.compile_output) : "";

    // Normalize fields to the shape front-end expects (judge0-like)
    const safe = {
      stdout: decoded_stdout,
      stderr: decoded_stderr,
      compile_output: decoded_compile_output,
      time: data?.time ?? data?.cpu_time ?? null,
      memory: data?.memory ?? null,
      status: data?.status ?? { id: upstreamRes.status, description: "OK" },
      _raw_preview: safePreview(data, 2000),
    };

    // Return JSON 200 (frontend expects stable shape)
    return NextResponse.json(safe, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        stdout: "",
        stderr: "",
        compile_output: "",
        message:
          err?.message ||
          "Judge service unavailable. Set JUDGE0_URL (self-hosted) or RAPIDAPI_KEY.",
        status: { id: 13, description: "Internal Error" },
      },
      { status: 500 }
    );
  }
}

// Optional: handle OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
