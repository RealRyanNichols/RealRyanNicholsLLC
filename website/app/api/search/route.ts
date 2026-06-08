import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keyword search across every published post — articles, notes, photos, videos
// all live in `posts`, so one call covers them all. Backed by the SECURITY
// DEFINER `search_posts` RPC, which only ever returns published rows.
export type SearchHit = {
  slug: string;
  type: string;
  title: string | null;
  category: string | null;
  tags: string[] | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  published_at: string | null;
  rank: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ q, results: [] });

  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 1), 50);

  try {
    const supabase = getSupabaseStaticClient();
    const { data, error } = await supabase.rpc("search_posts", {
      q,
      max_results: limit,
    });
    if (error) {
      console.error("search_posts rpc:", error.message);
      return NextResponse.json({ q, results: [], error: "search_failed" }, { status: 500 });
    }
    return NextResponse.json({ q, results: (data ?? []) as SearchHit[] });
  } catch (e) {
    console.error("search route:", e);
    return NextResponse.json({ q, results: [], error: "search_failed" }, { status: 500 });
  }
}
