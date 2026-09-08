import type { ReactNode } from "react";

// Case-insensitive text matching for the search views, with offsets that
// stay true to the original string. A plain toLowerCase() can change a
// string's length (İ becomes i̇), which would put a mark on the wrong
// characters; folding one character at a time and keeping any character
// whose lowercase form has a different length keeps every index aligned.
function fold(s: string): string {
  let out = "";
  for (const ch of s) {
    const low = ch.toLowerCase();
    out += low.length === ch.length ? low : ch;
  }
  return out;
}

// Every [start, end) span of the query in the text, non-overlapping.
function spans(text: string, q: string): [number, number][] {
  const needle = fold(q.trim());
  if (!needle) return [];
  const hay = fold(text);
  const found: [number, number][] = [];
  for (let at = hay.indexOf(needle); at !== -1; at = hay.indexOf(needle, at + needle.length)) {
    found.push([at, at + needle.length]);
  }
  return found;
}

// Does the text contain the query? The same folding as the marks, so a
// card that shows it matched will carry a mark.
export function matchesText(text: string | null | undefined, q: string): boolean {
  return !!text && spans(text, q).length > 0;
}

// A window of text around the first occurrence, for a match that lives in
// a field the card does not otherwise show (a grievance's body).
export function excerptAround(
  text: string | null | undefined,
  q: string,
  radius = 90,
): string | null {
  if (!text) return null;
  const [first] = spans(text, q);
  if (!first) return null;
  const start = Math.max(0, first[0] - radius);
  const end = Math.min(text.length, first[1] + radius);
  const head = start > 0 ? "…" : "";
  const tail = end < text.length ? "…" : "";
  return `${head}${text.slice(start, end).trim()}${tail}`;
}

// Wraps every occurrence of the query in <mark>, so a search result shows
// the word that matched it. Plain string scanning, no regex built from
// user input. With no query the text renders untouched, so the same
// markup serves the browse views.
export function Highlight({
  text,
  q,
}: {
  text: string | null | undefined;
  q: string;
}): ReactNode {
  if (!text) return null;
  const found = spans(text, q);
  if (found.length === 0) return text;
  const parts: ReactNode[] = [];
  let from = 0;
  for (const [start, end] of found) {
    if (start > from) parts.push(text.slice(from, start));
    parts.push(
      <mark
        key={start}
        className="rounded-sm bg-[var(--color-gold-light)]/45 px-0.5 text-inherit"
      >
        {text.slice(start, end)}
      </mark>,
    );
    from = end;
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}
