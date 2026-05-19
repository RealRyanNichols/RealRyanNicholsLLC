import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import type { Post } from "@/lib/types";

const POST_COLUMNS =
  "id, slug, title, body, image_urls, pinned, status, author_id, category, published_at, created_at, updated_at, views_count";

export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

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
