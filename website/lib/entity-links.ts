// Automatic internal backlinks. The FIRST mention of a known entity in an
// article body becomes a markdown link. First mention only, never twice,
// never inside a heading, never inside a fenced code block, never inside an
// existing link. Pure string transform over markdown text so it applies to
// every already-published post at render time with zero body mutations.

export type EntityTarget = { term: string; href: string };

// The dictionary. Longest terms first so "Premier Dental Academy of
// Longview" wins before any shorter overlap.
export const ENTITY_DICTIONARY: EntityTarget[] = [
  { term: "Premier Dental Academy of Longview", href: "https://premierdentalacademyoflongview.com" },
  { term: "J6 Evidence Nexus", href: "/case/nexus" },
  { term: "Rescue the Universe", href: "/about" },
  { term: "Wholesale Universe", href: "/about" },
  { term: "Fighting Shadows", href: "/book" },
  { term: "Work With Me", href: "/services" },
  { term: "Talk to Ryan", href: "/#talk" },
  { term: "GideonHQ", href: "/store" },
  { term: "RepWatchr", href: "/store" },
  { term: "SellerProof", href: "/store" },
];

const FENCE_RE = /^(```|~~~)/;

function lineAllowsLinking(line: string): boolean {
  const t = line.trimStart();
  if (t.startsWith("#")) return false; // never inside a heading
  if (t.startsWith("{{")) return false; // never inside a shortcode
  return true;
}

/** Is index `at` inside a markdown link's label or target on this line? */
function insideExistingLink(line: string, at: number, len: number): boolean {
  // Inside [...] label: an unclosed "[" before us and a "]" after our end.
  const before = line.slice(0, at);
  const after = line.slice(at + len);
  const openBracket = before.lastIndexOf("[");
  if (openBracket !== -1 && !before.slice(openBracket).includes("]") && after.includes("](")) {
    return true;
  }
  // Inside (...) target: "](" open before us without its closing ")".
  const openParen = before.lastIndexOf("](");
  if (openParen !== -1 && !before.slice(openParen).includes(")")) return true;
  // Inside inline code on this line: odd number of backticks before us.
  const ticks = (before.match(/`/g) ?? []).length;
  if (ticks % 2 === 1) return true;
  return false;
}

/**
 * Link the first mention of each dictionary entity across a sequence of
 * markdown chunks (an article body minus its shortcode blocks). Returns the
 * transformed chunks plus the list of links that were made.
 */
export function linkFirstMentions(chunks: string[]): {
  chunks: string[];
  linked: { term: string; href: string }[];
} {
  const done = new Set<string>();
  const linked: { term: string; href: string }[] = [];

  const out = chunks.map((chunk) => {
    const lines = chunk.split("\n");
    let inFence = false;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]!;
      if (FENCE_RE.test(line.trimStart())) {
        inFence = !inFence;
        continue;
      }
      if (inFence || !lineAllowsLinking(line)) continue;

      for (const entity of ENTITY_DICTIONARY) {
        if (done.has(entity.term)) continue;
        const at = line.indexOf(entity.term);
        if (at === -1) continue;
        if (insideExistingLink(line, at, entity.term.length)) continue;
        lines[i] =
          line.slice(0, at) +
          `[${entity.term}](${entity.href})` +
          line.slice(at + entity.term.length);
        done.add(entity.term);
        linked.push({ term: entity.term, href: entity.href });
      }
    }
    return lines.join("\n");
  });

  return { chunks: out, linked };
}

/** Extract every internal /posts/<slug> reference from a body: inline
 * markdown links plus {{related: ...}} slugs. Used by the publish-time
 * recorder that fills the post_links table. */
export function extractInternalPostSlugs(body: string): { slug: string; anchor: string }[] {
  const found: { slug: string; anchor: string }[] = [];
  const linkRe = /\[([^\]]+)\]\((?:https?:\/\/(?:www\.)?realryannichols\.com)?\/posts\/([a-z0-9-]+)\)/gi;
  for (const m of body.matchAll(linkRe)) {
    found.push({ slug: m[2]!, anchor: m[1]!.slice(0, 200) });
  }
  const relatedRe = /^\{\{\s*related\s*:([^}]+)\}\}\s*$/gim;
  for (const m of body.matchAll(relatedRe)) {
    for (const slug of m[1]!.split("|").map((s) => s.trim()).filter(Boolean)) {
      found.push({ slug, anchor: "related-block" });
    }
  }
  return found;
}
