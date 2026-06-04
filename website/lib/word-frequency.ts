// Pure text-frequency helpers for the "Audience Language" brain page.
// No deps. Tokenizes free text and ranks top words and multi-word phrases so
// the operator can see the exact language their audience uses.

const STOP = new Set(
  (
    "a about above after again against all am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves " +
    "just like get got really also even still much many one two go know think want need see say said says new now then thing things way ways lot dont im youre thats theyre cant didnt isnt wasnt theres heres "
  )
    .trim()
    .split(/\s+/),
);

export type Counted = { term: string; count: number };

// Single words: lowercased, letters + internal apostrophes; stopwords and very
// short tokens removed.
export function wordTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+|www\.\S+/g, " ")
    .replace(/[^a-z']+/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

// Phrase tokens keep stopwords (so phrases read naturally) but drop punctuation.
function phraseTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+|www\.\S+/g, " ")
    .replace(/[^a-z']+/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length >= 2);
}

function rank(m: Map<string, number>, n: number, min: number): Counted[] {
  return [...m.entries()]
    .filter(([, c]) => c >= min)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, n);
}

export function topWords(texts: string[], n: number): Counted[] {
  const m = new Map<string, number>();
  for (const t of texts) for (const w of wordTokens(t)) m.set(w, (m.get(w) ?? 0) + 1);
  return rank(m, n, 2);
}

export function topPhrases(texts: string[], size: number, n: number): Counted[] {
  const m = new Map<string, number>();
  for (const t of texts) {
    const toks = phraseTokens(t);
    for (let i = 0; i + size <= toks.length; i++) {
      const slice = toks.slice(i, i + size);
      if (slice.every((w) => STOP.has(w))) continue; // skip all-stopword phrases
      const phrase = slice.join(" ");
      m.set(phrase, (m.get(phrase) ?? 0) + 1);
    }
  }
  return rank(m, n, 2);
}
