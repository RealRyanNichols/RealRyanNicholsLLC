import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDirectVideoUrl } from "@/lib/direct-video";
import type { MediaItem } from "@/lib/types";

const mediaItemSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(500).optional(),
});

// Treat empty strings as "clear this field" (-> null) so the editor can blank
// out an SEO override or remove a custom image without sending null literals.
const emptyToNull = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => (s.trim() === "" ? null : s))
    .nullable()
    .optional();

const patchSchema = z
  .object({
    pinned: z.boolean().optional(),
    status: z.enum(["draft", "published"]).optional(),
    category: z.string().max(60).nullable().optional(),
    title: z.string().max(200).nullable().optional(),
    body: z.string().max(50000).optional(),
    // Media + image control, now editable after publish for every post type.
    media: z.array(mediaItemSchema).max(20).optional(),
    thumbnail_url: z.string().url().nullable().optional(),
    og_image_url: z.string().url().nullable().optional(),
    // SEO overrides. Empty string clears the override (falls back to auto).
    seo_title: emptyToNull(200),
    seo_description: emptyToNull(300),
    // Editable slug. On change we 301 the old path via slug_redirects.
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must be lowercase letters, numbers, and dashes only."
      )
      .optional(),
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

  const data = parsed.data;
  const patch: Record<string, unknown> = { ...data };

  // We need the current row when publishing (gate video readiness + set
  // published_at), when changing media (enforce photo posts keep ≥1 image),
  // or when renaming the slug (write a redirect from the old path).
  const needsExisting =
    data.status === "published" ||
    data.media !== undefined ||
    data.slug !== undefined;

  type ExistingPost = {
    slug: string;
    published_at: string | null;
    type: string;
    media: MediaItem[] | null;
    mux_status: string | null;
    mux_playback_id: string | null;
  };
  let existing: ExistingPost | null = null;

  if (needsExisting) {
    const { data: row, error: existingError } = await supabase
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
    if (!row) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    existing = row as ExistingPost;
  }

  // Publishing a draft for the first time sets published_at; video must be ready.
  if (data.status === "published" && existing) {
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
    if (!existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

  // A photo post must always keep at least one image or the feed/post views
  // break. Other types may have empty media.
  if (data.media !== undefined && existing?.type === "photo" && data.media.length === 0) {
    return NextResponse.json(
      { error: "A photo post needs at least one image." },
      { status: 400 },
    );
  }

  // Slug rename: ensure the new slug is free, then 301 the old path.
  if (data.slug !== undefined && existing && data.slug !== existing.slug) {
    const newSlug = data.slug;
    const oldSlug = existing.slug;

    const { data: clash, error: clashError } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", id)
      .maybeSingle();
    if (clashError) {
      return NextResponse.json(
        { error: clashError.message || "Could not check slug." },
        { status: 500 },
      );
    }
    if (clash) {
      return NextResponse.json(
        { error: "That slug is already taken by another post." },
        { status: 409 },
      );
    }

    // Apply the slug change first so the new slug is live before we point
    // redirects at it.
    const { error: slugError } = await supabase
      .from("posts")
      .update(patch)
      .eq("id", id);
    if (slugError) {
      return NextResponse.json(
        { error: slugError.message || "Update failed." },
        { status: 500 },
      );
    }

    // Re-home any redirects that pointed at the old slug so existing chains
    // (A->B then B->C) collapse to the latest slug and never 404.
    await supabase
      .from("slug_redirects")
      .update({ new_slug: newSlug })
      .eq("new_slug", oldSlug);
    // If the new slug was itself a redirect source, reclaim it.
    await supabase.from("slug_redirects").delete().eq("old_slug", newSlug);
    // Record old -> new so the previous URL keeps working.
    await supabase
      .from("slug_redirects")
      .upsert(
        { old_slug: oldSlug, new_slug: newSlug, post_id: id },
        { onConflict: "old_slug" },
      );

    return NextResponse.json({ ok: true, slug: newSlug });
  }

  const { error } = await supabase.from("posts").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Update failed." },
      { status: 500 },
    );
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
