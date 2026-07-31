import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDirectVideoUrl } from "@/lib/direct-video";
import { pingIndexNow } from "@/lib/indexnow";
import { recordPostLinks } from "@/lib/post-links";

const patchSchema = z
  .object({
    pinned: z.boolean().optional(),
    status: z.enum(["draft", "published"]).optional(),
    category: z.string().max(60).nullable().optional(),
    title: z.string().max(200).nullable().optional(),
    body: z.string().max(50000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No fields to update.");

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
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

  // If publishing a draft for the first time, set published_at.
  const patch: Record<string, unknown> = { ...parsed.data };
  let publishedSlug: string | null = null;
  if (parsed.data.status === "published") {
    const { data: existing, error: existingError } = await supabase
      .from("posts")
      .select("slug, published_at, type, media, mux_status, mux_playback_id")
      .eq("id", id)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || "Could not load post." },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    if (
      existing.type === "video" &&
      (existing.mux_status !== "ready" || !existing.mux_playback_id) &&
      !getDirectVideoUrl(existing.media)
    ) {
      return NextResponse.json(
        { error: "This video is not ready to publish yet." },
        { status: 409 },
      );
    }
    if (existing && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
    publishedSlug = existing.slug ?? null;
  }

  const { error } = await supabase.from("posts").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Update failed." },
      { status: 500 },
    );
  }
  // Tell the engines the post is live (fire-and-forget).
  if (publishedSlug) {
    void pingIndexNow([`/posts/${publishedSlug}`, "/"]);
    // Refresh the internal link graph for this post.
    void recordPostLinks(id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Delete failed." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
