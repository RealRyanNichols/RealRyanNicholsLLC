import { NextResponse } from "next/server";
import { isAuthorizedDeadmanCron } from "@/lib/cron-auth";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { generateSocialPosts } from "@/lib/social-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Social Studio fill sweep. The daily article engine inserts posts straight
// into the database, bypassing the site's publish routes where the on-publish
// draft hook lives — so its articles never got platform drafts. This cron
// closes that hole: every hour it finds recent published articles with zero
// social drafts and generates them. Self-healing: a failed run just leaves
// the post for the next sweep. Auth: Vercel cron Bearer CRON_SECRET, same
// helper the deadman crons use.

const WINDOW_HOURS = 72;
const BATCH = 2;

async function run(request: Request) {
  if (!isAuthorizedDeadmanCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "no ANTHROPIC_API_KEY" });
  }

  const svc = getSupabaseServiceClient();
  const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();

  // Recent articles first; skip anything that already has drafts (any status,
  // so a dismissed set is not endlessly regenerated).
  const { data: recent } = await svc
    .from("posts")
    .select("id, slug, published_at, social_studio_posts(id)")
    .eq("status", "published")
    .in("type", ["text", "note"])
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(24);

  const missing = (recent ?? [])
    .filter((p) => !Array.isArray(p.social_studio_posts) || p.social_studio_posts.length === 0)
    .slice(0, BATCH);

  const results: { slug: string; ok: boolean; error?: string }[] = [];
  for (const post of missing) {
    const r = await generateSocialPosts(post.id as string);
    results.push({ slug: post.slug as string, ok: r.ok, error: r.error });
  }

  return NextResponse.json({
    ok: true,
    window_hours: WINDOW_HOURS,
    candidates: (recent ?? []).length,
    generated: results.filter((r) => r.ok).length,
    results,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
