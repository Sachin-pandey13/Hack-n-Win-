// lib/parseLineNumber.ts
export function parseLineNumber(msg: string = "", lang?: string) {
  const text = (msg || "").trim();
  if (!text) return null;

  // GCC/Clang style: file.cpp:12:34: error: ...
  let m = text.match(/(?:^|[\s:])(\d+):\d+\s*:\s*error/i);
  if (m) return { line: Number(m[1]), message: text.split("\n")[0].trim() };

  // Another GCC: file.cpp:12: error: ...
  m = text.match(/:(\d+):\s*error/i);
  if (m) return { line: Number(m[1]), message: text.split("\n")[0].trim() };

  // MSVC: file.cpp(12,34): error ...
  m = text.match(/\((\d+),\d+\):\s*error/i);
  if (m) return { line: Number(m[1]), message: text.split("\n")[0].trim() };

  // Python: File "main.py", line 6
  m = text.match(/File\s+"[^"]+",\s*line\s*(\d+)/i);
  if (m) return { line: Number(m[1]), message: text.split("\n").slice(-1)[0].trim() };

  // Generic "line 12"
  m = text.match(/line\s+(\d+)/i);
  if (m) return { line: Number(m[1]), message: text.split("\n")[0].trim() };

  // Fallback: first line
  return { message: text.split("\n")[0].trim() };
}
