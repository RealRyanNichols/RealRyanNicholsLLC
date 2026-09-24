import type { Post } from "./types";

// Related-post picking for the end of an article (ArticleNextStep). Pure on
// purpose: the page fetches, this decides, and tests/related-posts.test.ts
// pins the order.
//
// Order:
//   1. post_links edges with kind "auto", newest first. lib/post-links.ts
//      writes one so a new article is never an orphan, and the edge only
//      counts if the source article actually renders the link, so these
//      always lead.
//   2. Same category, after normalizing the obvious variants ("Behind the
//      scenes" and "Behind the Scenes", "&" and "and").
//   3. Everything else by score: shared tags, a shared category word
//      ("Motivation" and "Motivation & Resilience"), and whether both sides
//      are about the case.
// Ties keep the incoming order (the feed's pinned-then-newest order). The
// current post never appears, and nothing appears twice.

export const RELATED_LIMIT = 3;

// Posts that touch the case. Used for scoring here and, on the page, to add
// the document-archive link for case stories.
export const CASE_HINT =
  /\b(j6|jan(?:uary)?\s*6|nichols|jail|detention|solitary|grievance|pardon|doj|fbi|court|judge|due[- ]?process|prosecut\w*|indict\w*|sentenc\w*|evidence|exhibit)\b/i;

export type RelatedSubject = Pick<Post, "id" | "title" | "category" | "tags">;

export type RelatedCandidate = RelatedSubject & Pick<Post, "slug">;

const CATEGORY_STOPWORDS = new Set(["and", "the", "of", "a", "an", "for", "in", "on", "to", "with"]);

/** Lowercase, "&" and "+" read as "and", punctuation and extra spaces dropped. */
export function normalizeCategory(category: string | null | undefined): string {
  return (category ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[&+]/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** The meaningful words of a category: "Motivation & Resilience" -> motivation, resilience. */
export function categoryWords(category: string | null | undefined): Set<string> {
  const words = normalizeCategory(category)
    .split(" ")
    .filter((w) => w && !CATEGORY_STOPWORDS.has(w));
  return new Set(words);
}

export function sameCategory(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = normalizeCategory(a);
  return na !== "" && na === normalizeCategory(b);
}

export function isCaseRelated(post: Pick<Post, "title" | "category" | "tags">): boolean {
  return CASE_HINT.test([post.title, post.category, ...(post.tags ?? [])].filter(Boolean).join(" "));
}

function tagSet(tags: string[] | null | undefined): Set<string> {
  return new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

/**
 * How related a candidate is to the current post. Same category +8, a shared
 * category word +4 (only when the categories differ), each shared tag +3,
 * both on the same side of the case line +2.
 */
export function relatedPostScore(current: RelatedSubject, candidate: RelatedSubject): number {
  let score = 0;
  if (sameCategory(current.category, candidate.category)) {
    score += 8;
  } else {
    const words = categoryWords(current.category);
    for (const w of categoryWords(candidate.category)) {
      if (words.has(w)) {
        score += 4;
        break;
      }
    }
  }

  const currentTags = tagSet(current.tags);
  for (const tag of tagSet(candidate.tags)) {
    if (currentTags.has(tag)) score += 3;
  }

  if (isCaseRelated(current) === isCaseRelated(candidate)) score += 2;
  return score;
}

export function pickRelatedPosts<T extends RelatedCandidate>(
  current: RelatedSubject,
  candidates: readonly T[],
  opts: { autoLinkedIds?: readonly string[]; limit?: number } = {},
): T[] {
  const limit = Math.max(0, opts.limit ?? RELATED_LIMIT);
  if (limit === 0) return [];

  const byId = new Map<string, T>();
  for (const candidate of candidates) {
    if (candidate.id !== current.id && !byId.has(candidate.id)) byId.set(candidate.id, candidate);
  }

  const picked: T[] = [];
  const taken = new Set<string>();
  for (const id of opts.autoLinkedIds ?? []) {
    const candidate = byId.get(id);
    if (!candidate || taken.has(id)) continue;
    picked.push(candidate);
    taken.add(id);
    if (picked.length >= limit) return picked;
  }

  const ranked = [...byId.values()]
    .filter((candidate) => !taken.has(candidate.id))
    .map((candidate, index) => ({
      candidate,
      index,
      tier: sameCategory(current.category, candidate.category) ? 0 : 1,
      score: relatedPostScore(current, candidate),
    }))
    .sort((a, b) => a.tier - b.tier || b.score - a.score || a.index - b.index);

  for (const { candidate } of ranked) {
    picked.push(candidate);
    if (picked.length >= limit) break;
  }
  return picked;
}
