import type { ReactNode } from "react";

// Case-insensitive text matching for the search views, with offsets that
// stay true to the original string. The text is lowercased one character
// at a time and every folded character remembers where it came from, so
// a character whose lowercase form expands (İ becomes i̇) still matches
// its lowercase form, the way the archive's filter compares, and still
// marks the original character.
type Folded = { text: string; starts: number[]; ends: number[] };

function fold(s: string): Folded {
  let text = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const ch of s) {
    const low = ch.toLowerCase();
    for (let k = 0; k < low.length; k++) {
      starts.push(at);
      ends.push(at + ch.length);
    }
    text += low;
    at += ch.length;
  }
  return { text, starts, ends };
}

// Every [start, end) span of the query in the text, in the text's own
// offsets, non-overlapping.
function spans(text: string, q: string): [number, number][] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hay = fold(text);
  const found: [number, number][] = [];
  for (
    let at = hay.text.indexOf(needle);
    at !== -1;
    at = hay.text.indexOf(needle, at + needle.length)
  ) {
    found.push([hay.starts[at], hay.ends[at + needle.length - 1]]);
  }
  return found;
}

// Does the text contain the query? The same folding as the marks, so a
// card that shows it matched will carry a mark.
export function matchesText(text: string | null | undefined, q: string): boolean {
  return !!text && spans(text, q).length > 0;
}

// A window of text around the first occurrence, for a match that lives in
// a field the card does not otherwise show (a grievance's body) or past
// the part it clamps (a document's description).
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
    if (start < from) continue;
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
