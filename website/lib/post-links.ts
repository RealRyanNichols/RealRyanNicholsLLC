import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { extractInternalPostSlugs } from "@/lib/entity-links";

// Publish-time recorder for the internal link graph. Every time a post is
// published (or re-published), its body is scanned for internal /posts/
// links and {{related}} slugs and the edges land in post_links. This table
// is the beginning of the Evidence Nexus graph and feeds the "what links
// here" panel and the /admin/links orphan report. Fire and forget: link
// bookkeeping must never block or fail a publish.

export async function recordPostLinks(fromPostId: string, body?: string): Promise<void> {
  try {
    if (!isSupabaseServiceConfigured()) return;
    const svc = getSupabaseServiceClient();

    let text = body;
    if (text === undefined) {
      const { data } = await svc
        .from("posts")
        .select("body")
        .eq("id", fromPostId)
        .maybeSingle();
      text = (data?.body as string | undefined) ?? "";
    }
    const refs = extractInternalPostSlugs(text ?? "");
    if (refs.length === 0) return;
    const slugs = Array.from(new Set(refs.map((r) => r.slug)));
    const { data: targets } = await svc
      .from("posts")
      .select("id, slug")
      .in("slug", slugs);
    const idBySlug = new Map((targets ?? []).map((t) => [t.slug as string, t.id as string]));

    const rows = refs
      .map((r) => {
        const toId = idBySlug.get(r.slug);
        if (!toId || toId === fromPostId) return null;
        return {
          from_post_id: fromPostId,
          to_post_id: toId,
          anchor_text: r.anchor.slice(0, 200),
          kind: "manual" as const,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length === 0) return;

    // Refresh this post's edges: drop stale ones, then upsert current.
    await svc.from("post_links").delete().eq("from_post_id", fromPostId);
    await svc
      .from("post_links")
      .upsert(rows, { onConflict: "from_post_id,to_post_id,anchor_text" });
  } catch {
    // Never let graph bookkeeping break a publish.
  }
}
