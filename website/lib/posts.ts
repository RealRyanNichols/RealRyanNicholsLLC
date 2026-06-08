import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import type { Post } from "@/lib/types";

export const POST_COLUMNS =
  "id, slug, type, title, body, seo_title, seo_description, image_urls, media, mux_asset_id, mux_upload_id, mux_playback_id, mux_status, duration_seconds, thumbnail_url, pinned, status, author_id, category, tags, published_at, created_at, updated_at, views_count, shares_count, inbound_shares_count";

export async function getPublishedPosts(
  opts: { sort?: "latest" | "trending" } = {}
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
