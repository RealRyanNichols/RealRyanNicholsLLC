import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { extractInternalPostSlugs } from "@/lib/entity-links";

// Publish-time recorder for the internal link graph. Every time a post is
// published (or re-published), its body is scanned for internal /posts/
// links and {{related}} slugs and the edges land in post_links. This table
// is the beginning of the Evidence Nexus graph and feeds the "what links
// here" panel and the /admin/links orphan report. The function contains its
// own failure boundary so callers can await it without breaking a publish.

type LinkablePost = {
  id: string;
  body: string;
  title: string | null;
  category: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
};

const CASE_HINT =
  /\b(j6|jan(?:uary)?\s*6|jail|detention|pardon|doj|fbi|court|judge|due[- ]?process|prosecut\w*|indict\w*|sentenc\w*|evidence|exhibit)\b/i;

function automaticLinkScore(current: LinkablePost, candidate: LinkablePost): number {
  let score = 0;
  if (current.category && candidate.category === current.category) score += 20;

  const currentTags = new Set(
    (current.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );
  for (const tag of candidate.tags ?? []) {
    if (currentTags.has(tag.trim().toLowerCase())) score += 6;
  }

  const currentCase = CASE_HINT.test(
    [current.title, current.category, ...(current.tags ?? [])].filter(Boolean).join(" "),
  );
  const candidateCase = CASE_HINT.test(
    [candidate.title, candidate.category, ...(candidate.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
  if (currentCase === candidateCase) score += 3;
  return score;
}

async function ensureInboundPostLink(
  svc: ReturnType<typeof getSupabaseServiceClient>,
  current: LinkablePost,
): Promise<void> {
  if (current.status !== "published") return;

  const { count: inboundCount } = await svc
    .from("post_links")
    .select("id", { count: "exact", head: true })
    .eq("to_post_id", current.id);
  if ((inboundCount ?? 0) > 0) return;

  const { data: candidates } = await svc
    .from("posts")
    .select("id, body, title, category, tags, status, published_at")
    .eq("status", "published")
    .neq("id", current.id)
    .order("published_at", { ascending: false })
    .limit(250);
  const available = (candidates ?? []) as LinkablePost[];
  if (available.length === 0) return;

  // An automatic edge is rendered in the source article's Read Next rail.
  // Keep each source below that rail's four-card display limit so every
  // graph edge remains a real, crawlable link rather than hidden bookkeeping.
  const candidateIds = available.map((post) => post.id);
  const { data: automaticEdges } = await svc
    .from("post_links")
    .select("from_post_id")
    .eq("kind", "auto")
    .in("from_post_id", candidateIds);
  const automaticCount = new Map<string, number>();
  for (const edge of automaticEdges ?? []) {
    const id = edge.from_post_id as string;
    automaticCount.set(id, (automaticCount.get(id) ?? 0) + 1);
  }

  const ranked = available
    .filter((post) => (automaticCount.get(post.id) ?? 0) < 4)
    .sort(
      (a, b) =>
        automaticLinkScore(current, b) - automaticLinkScore(current, a) ||
        Date.parse(b.published_at ?? "") - Date.parse(a.published_at ?? ""),
    );
  const source = ranked[0];
  if (!source) return;

  await svc.from("post_links").upsert(
    {
      from_post_id: source.id,
      to_post_id: current.id,
      anchor_text: "automatic-read-next",
      kind: "auto",
    },
    { onConflict: "from_post_id,to_post_id,anchor_text" },
  );
}

export async function recordPostLinks(fromPostId: string, body?: string): Promise<void> {
  try {
    if (!isSupabaseServiceConfigured()) return;
    const svc = getSupabaseServiceClient();

    const { data } = await svc
      .from("posts")
      .select("id, body, title, category, tags, status, published_at")
      .eq("id", fromPostId)
      .maybeSingle();
    const current = data as LinkablePost | null;
    if (!current) return;

    const text = body ?? current.body ?? "";
    const refs = extractInternalPostSlugs(text ?? "");

    // Refresh only editorial/body edges. Automatic Read Next edges are a
    // separate layer and must survive later edits to the article body.
    await svc
      .from("post_links")
      .delete()
      .eq("from_post_id", fromPostId)
      .eq("kind", "manual");

    if (refs.length > 0) {
      const slugs = Array.from(new Set(refs.map((r) => r.slug)));
      const { data: targets } = await svc
        .from("posts")
        .select("id, slug")
        .in("slug", slugs);
      const idBySlug = new Map(
        (targets ?? []).map((target) => [target.slug as string, target.id as string]),
      );

      const rows = refs
        .map((ref) => {
          const toId = idBySlug.get(ref.slug);
          if (!toId || toId === fromPostId) return null;
          return {
            from_post_id: fromPostId,
            to_post_id: toId,
            anchor_text: ref.anchor.slice(0, 200),
            kind: "manual" as const,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
      if (rows.length > 0) {
        await svc
          .from("post_links")
          .upsert(rows, { onConflict: "from_post_id,to_post_id,anchor_text" });
      }
    }

    await ensureInboundPostLink(svc, current);
  } catch {
    // Never let graph bookkeeping break a publish.
  }
}
