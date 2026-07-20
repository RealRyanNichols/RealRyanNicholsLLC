import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import type { Post } from "@/lib/types";

export const POST_COLUMNS =
  "id, slug, type, title, body, seo_title, seo_description, image_urls, media, mux_asset_id, mux_upload_id, mux_playback_id, mux_status, duration_seconds, thumbnail_url, pinned, status, author_id, category, tags, published_at, created_at, updated_at, views_count, shares_count, inbound_shares_count";

export async function getPublishedPosts(
  opts: { sort?: "latest" | "trending"; limit?: number } = {}
): Promise<Post[]> {
  const supabase = getSupabaseStaticClient();
  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("pinned", { ascending: false });
  query =
    opts.sort === "trending"
      ? query.order("views_count", { ascending: false, nullsFirst: false })
      : query.order("published_at", { ascending: false });
  if (opts.limit && opts.limit > 0) query = query.limit(opts.limit);
  const { data, error } = await query;

  if (error) {
    console.error("getPublishedPosts:", error);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPostBySlug:", error);
    return null;
  }
  return (data ?? null) as Post | null;
}

export async function getAdminPostById(id: string): Promise<Post | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAdminPostById:", error);
    return null;
  }
  return (data ?? null) as Post | null;
}

export async function getCommentCount(postId: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("status", "approved");
  if (error) return 0;
  return count ?? 0;
}

// Comment counts for a whole feed in ONE query.
//
// This used to be called once per post. The homepage renders every published
// post, so a single page load fired one database round trip per card — 127
// queries to paint one screen, every single request, each one opening its own
// cookie-reading client. That was the lag: not rendering, just waiting in line
// at the database 127 times. One grouped query replaces all of it.
export async function getCommentCounts(
  postIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (postIds.length === 0) return map;
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("comments")
    .select("post_id")
    .eq("status", "approved")
    .in("post_id", postIds);
  if (error) return map;
  for (const row of (data ?? []) as { post_id: string }[]) {
    map.set(row.post_id, (map.get(row.post_id) ?? 0) + 1);
  }
  return map;
}
