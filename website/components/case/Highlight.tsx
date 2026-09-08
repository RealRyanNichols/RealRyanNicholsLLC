import type { ReactNode } from "react";

// Wraps every case-insensitive occurrence of the query in <mark>, so a
// search result shows the word that matched it. Plain string scanning, no
// regex built from user input. With no query the text renders untouched,
// so the same markup serves the browse views.
export function Highlight({
  text,
  q,
}: {
  text: string | null | undefined;
  q: string;
}): ReactNode {
  if (!text) return null;
  const needle = q.trim().toLowerCase();
  if (!needle) return text;
  const haystack = text.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  for (let at = haystack.indexOf(needle, from); at !== -1; at = haystack.indexOf(needle, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark
        key={at}
        className="rounded-sm bg-[var(--color-gold-light)]/45 px-0.5 text-inherit"
      >
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}
