import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getMuxClient, isMuxConfigured } from "@/lib/mux";
import { getVideoConfigStatus } from "@/lib/video-config";

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
    media: z.array(mediaItemSchema).min(1).max(1).optional(),
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

  // Mux is the preferred video path. If it is not configured yet, admins can
  // still create a site-owned direct video draft from the post-videos bucket.
  let muxUpload: { id: string; url: string } | null = null;
  const directVideoMedia =
    input.type === "video" && input.media?.[0]?.url ? input.media : null;
  if (input.type === "video") {
    if (!directVideoMedia && !isMuxConfigured()) {
      const config = getVideoConfigStatus();
      return NextResponse.json(
        {
          error:
            "Large video uploads need Mux. Add the missing Vercel environment variables, then redeploy.",
          missing: config.missing,
          webhook_url: config.webhookUrl,
        },
        { status: 503 }
      );
    }
    if (!directVideoMedia) {
      const mux = getMuxClient();
      const upload = await mux.video.uploads.create({
        cors_origin: process.env.SITE_URL ?? "https://realryannichols.com",
        timeout: 60 * 60 * 24,
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
          inputs: [
            {
              generated_subtitles: [
                {
                  language_code: "en",
                  name: "English",
                },
              ],
            },
          ],
          meta: {
            title: input.title,
            creator_id: auth.user.id,
          },
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
  if (input.type === "video" && directVideoMedia) {
    insertRow.media = directVideoMedia;
    insertRow.mux_status = "ready";
  }
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
