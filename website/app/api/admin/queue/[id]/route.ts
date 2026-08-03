import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { pingIndexNow } from "@/lib/indexnow";
import { recordPostLinks } from "@/lib/post-links";
import { generateSocialPosts } from "@/lib/social-studio";

// Content-queue actions. Publishing is deliberately HUMAN-ONLY: queue rows
// carry requires_manual_review as a hard stop for automated paths, and this
// route is the manual review — an admin clicking Publish. It creates the
// public post, marks the queue row published, and pings IndexNow.

const schema = z.object({
  action: z.enum(["approve", "reject", "publish"]),
  rejected_reason: z.string().max(500).optional(),
});

const BEAT_CATEGORY: Record<string, string> = {
  ryan: "Reflection",
  national: "National",
  local: "East Texas",
  liberty: "Liberty",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const svc = getSupabaseServiceClient();

  const { data: row, error: rowError } = await svc
    .from("content_queue")
    .select("id, beat, title, body, status, gag_order_flag")
    .eq("id", id)
    .maybeSingle();
  if (rowError || !row) {
    return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
  }

  const action = parsed.data.action;

  if (action === "approve" || action === "reject") {
    const { error } = await svc
      .from("content_queue")
      .update(
        action === "approve"
          ? { status: "approved" }
          : {
              status: "rejected",
              rejected_reason: parsed.data.rejected_reason ?? null,
            },
      )
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: action === "approve" ? "approved" : "rejected" });
  }

  // publish
  if (row.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved items can be published." },
      { status: 409 },
    );
  }
  if (row.gag_order_flag) {
    return NextResponse.json(
      { error: "This item is gag-flagged. It stays unpublished." },
      { status: 409 },
    );
  }

  // Unique slug: base + numeric suffix if taken.
  const base = slugify(row.title) || `dispatch-${id.slice(0, 8)}`;
  let slug = base;
  for (let i = 2; i <= 12; i++) {
    const { count } = await svc
      .from("posts")
      .select("id", { head: true, count: "exact" })
      .eq("slug", slug);
    if ((count ?? 0) === 0) break;
    slug = `${base}-${i}`;
  }

  const { data: post, error: postError } = await svc
    .from("posts")
    .insert({
      type: "text",
      slug,
      title: row.title,
      body: row.body,
      category: BEAT_CATEGORY[row.beat] ?? "Reflection",
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();
  if (postError || !post) {
    return NextResponse.json(
      { error: postError?.message ?? "Could not create the post." },
      { status: 500 },
    );
  }

  const { error: queueError } = await svc
    .from("content_queue")
    .update({ status: "published" })
    .eq("id", id);
  if (queueError) {
    // The post exists; surface the bookkeeping failure honestly.
    return NextResponse.json(
      { ok: true, post_slug: post.slug, warning: "Post created but the queue row did not update." },
      { status: 200 },
    );
  }

  // Tell the engines the moment it's live (fire-and-forget).
  void pingIndexNow([`/posts/${post.slug}`, "/"]);
  // Record the internal graph before the request finishes so the published
  // post always receives a real inbound Read Next link.
  await recordPostLinks(post.id);
  // Social Studio: draft the four platform posts for the fresh article.
  void generateSocialPosts(post.id);

  return NextResponse.json({ ok: true, post_slug: post.slug });
}
