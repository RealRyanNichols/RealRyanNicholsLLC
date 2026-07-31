// The article-body block parser. Runs over posts.body BEFORE markdown
// rendering and splits it into markdown chunks and shortcode blocks:
//
//   {{name: a | b | c}}          pipe payload (legacy style, single line)
//   {{name: {"key": "value"}}}   JSON payload (may span multiple lines)
//
// Rules (deliberate, tested):
// - A block starts only when "{{" opens at column 0 of a line. Indented or
//   mid-line braces are prose, not blocks.
// - Payloads are JSON when the first non-space character is "{", pipe args
//   otherwise. Malformed JSON is NOT a crash: the block carries the raw text
//   and the renderer shows it literally so a typo is visible in review.
// - Inside fenced code blocks (``` or ~~~) nothing is parsed. A tutorial can
//   SHOW a shortcode without running it.
// - An unclosed block at end of input degrades to plain markdown.
//
// This module is pure (no React, no IO) so it can be unit-tested with
// `npm test` and shared by the article view, the admin preview, RSS, and
// anything else that renders a body.

export type ShortcodeBlock = {
  kind: "block";
  name: string;
  /** Raw payload text after "name:" — undefined for bare {{name}}. */
  payload?: string;
  /** Parsed payload: pipe args, or parsed JSON object, or a parse error. */
  parsed: ParsedPayload;
  /** The exact source text of the block, for literal fallback rendering. */
  raw: string;
};

export type MarkdownChunk = { kind: "markdown"; text: string };
export type BodySegment = ShortcodeBlock | MarkdownChunk;

export type ParsedPayload =
  | { type: "none" }
  | { type: "args"; args: string[] }
  | { type: "json"; value: Record<string, unknown> }
  | { type: "invalid"; error: string };

const OPEN_RE = /^\{\{\s*([A-Za-z][\w-]*)\s*(?::([\s\S]*))?$/;
const FENCE_RE = /^(```|~~~)/;

/** Split a body into markdown chunks and shortcode blocks. */
export function parseBodySegments(body: string): BodySegment[] {
  const lines = (body ?? "").split("\n");
  const segments: BodySegment[] = [];
  let mdBuf: string[] = [];
  let inFence = false;
  let i = 0;

  const flushMd = () => {
    if (mdBuf.length > 0) {
      segments.push({ kind: "markdown", text: mdBuf.join("\n") });
      mdBuf = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i]!;

    if (FENCE_RE.test(line.trimStart())) {
      inFence = !inFence;
      mdBuf.push(line);
      i += 1;
      continue;
    }

    if (inFence || !line.startsWith("{{")) {
      mdBuf.push(line);
      i += 1;
      continue;
    }

    // Potential block opener at column 0. Accumulate lines until the braces
    // balance (string-aware, so braces inside JSON strings don't count).
    const start = i;
    let text = line;
    let depth = braceDelta(line);
    while (depth > 0 && i + 1 < lines.length) {
      i += 1;
      text += `\n${lines[i]!}`;
      depth += braceDelta(lines[i]!);
    }

    if (depth > 0) {
      // Never closed — treat everything we consumed as plain markdown.
      for (let j = start; j <= i; j += 1) mdBuf.push(lines[j]!);
      i += 1;
      continue;
    }

    const block = parseBlockText(text);
    if (!block) {
      for (let j = start; j <= i; j += 1) mdBuf.push(lines[j]!);
      i += 1;
      continue;
    }

    flushMd();
    segments.push(block);
    i += 1;
  }

  flushMd();
  return segments;
}

/** Net brace depth change of a line, ignoring braces inside double-quoted
 * strings (JSON payloads contain strings that may hold { or }). */
function braceDelta(line: string): number {
  let depth = 0;
  let inString = false;
  for (let k = 0; k < line.length; k += 1) {
    const ch = line[k];
    if (inString) {
      if (ch === "\\") k += 1; // skip escaped char
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
  }
  return depth;
}

/** Parse one balanced "{{ ... }}" text into a block, or null if it isn't one. */
function parseBlockText(text: string): ShortcodeBlock | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{{") || !trimmed.endsWith("}}")) return null;
  const inner = trimmed.slice(2, -2);
  const m = `{{${inner}`.match(OPEN_RE);
  // Re-match against the opener shape to pull the name + payload split.
  const nameMatch = inner.match(/^\s*([A-Za-z][\w-]*)\s*(?::([\s\S]*))?$/);
  if (!m && !nameMatch) return null;
  const name = (nameMatch?.[1] ?? "").toLowerCase();
  if (!name) return null;
  const payload = nameMatch?.[2]?.trim();

  return {
    kind: "block",
    name,
    payload,
    parsed: parsePayload(payload),
    raw: trimmed,
  };
}

export function parsePayload(payload: string | undefined): ParsedPayload {
  if (payload === undefined || payload.length === 0) return { type: "none" };
  if (payload.trimStart().startsWith("{")) {
    try {
      const value = JSON.parse(payload) as unknown;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return { type: "json", value: value as Record<string, unknown> };
      }
      return { type: "invalid", error: "JSON payload must be an object" };
    } catch (err) {
      return {
        type: "invalid",
        error: err instanceof Error ? err.message : "JSON parse failed",
      };
    }
  }
  return {
    type: "args",
    args: payload.split("|").map((part) => part.trim()),
  };
}

/** String field access with trimming — the components' one-liner helper. */
export function jsonString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = value[key];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
