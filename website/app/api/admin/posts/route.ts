import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getMuxClient, isMuxConfigured } from "@/lib/mux";

const mediaItemSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(500).optional(),
});

const baseSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(50000).default(""),
  slug: z
    .string()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Slug must be lowercase letters, numbers, and dashes only.")
    .optional(),
  pinned: z.boolean().optional(),
  status: z.enum(["draft", "published"]).default("published"),
  category: z.string().max(60).optional().nullable(),
});

const schema = z.discriminatedUnion("type", [
  baseSchema.extend({
    type: z.literal("text"),
    title: z.string().min(1, "Title is required for text posts.").max(200),
  }),
  baseSchema.extend({
    type: z.literal("note"),
    body: z.string().min(1).max(2000),
  }),
  baseSchema.extend({
    type: z.literal("photo"),
    media: z.array(mediaItemSchema).min(1).max(20),
  }),
  baseSchema.extend({
    type: z.literal("video"),
    title: z.string().min(1, "Video posts need a title.").max(200),
  }),
]);

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Video posts need Mux configured. Create the direct upload here and store
  // the upload_id on the post so the webhook can match it later.
  let muxUpload: { id: string; url: string } | null = null;
  if (input.type === "video") {
    if (!isMuxConfigured()) {
      return NextResponse.json(
        { error: "Video uploads are not configured yet. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET." },
        { status: 503 }
      );
    }
    const mux = getMuxClient();
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.SITE_URL ?? "*",
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "smart",
      },
    });
    if (!upload.url) {
      return NextResponse.json(
        { error: "Mux did not return an upload URL." },
        { status: 502 }
      );
    }
    muxUpload = { id: upload.id, url: upload.url };
  }

  const insertRow: Record<string, unknown> = {
    type: input.type,
    title: input.title ?? null,
    body: input.body,
    status: input.type === "video" ? "draft" : input.status,
    pinned: input.pinned ?? false,
    author_id: auth.user.id,
    category: input.category ?? null,
    published_at:
      input.type === "video" || input.status !== "published"
        ? null
        : new Date().toISOString(),
  };
  if (input.slug) insertRow.slug = input.slug;
  if (input.type === "photo") insertRow.media = input.media;
  if (input.type === "video" && muxUpload) {
    insertRow.mux_upload_id = muxUpload.id;
    insertRow.mux_status = "uploading";
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert(insertRow)
    .select("id, slug, type, mux_upload_id")
    .single();

  if (error || !post) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create post." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    post,
    mux_upload_url: muxUpload?.url ?? null,
  });
}
