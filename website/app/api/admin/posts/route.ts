import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getMuxClient, isMuxConfigured } from "@/lib/mux";
import { getVideoConfigStatus } from "@/lib/video-config";
import { SITE } from "@/lib/site";
import { pingIndexNow } from "@/lib/indexnow";
import { recordPostLinks } from "@/lib/post-links";

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
  // Optional custom poster/thumbnail (e.g. for a video) — overrides the
  // Mux-generated frame on the feed, the player, and the social card.
  thumbnail_url: z.string().url().optional().nullable(),
  source_tip_id: z.string().uuid().optional(),
  source_tip_mode: z.enum(["article", "solution"]).optional(),
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

const DEFAULT_SITE_ORIGIN = "https://realryannichols.com";

function getConfiguredSiteOrigin(): string {
  try {
    return new URL(process.env.SITE_URL ?? DEFAULT_SITE_ORIGIN).origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isAllowedUploadOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "realryannichols.com" ||
      hostname === "www.realryannichols.com" ||
      hostname === "app.realryannichols.com" ||
      hostname === "realryanichols-personal.vercel.app" ||
      (hostname.startsWith("realryanichols-personal-") && hostname.endsWith(".vercel.app"))
    );
  } catch {
    return false;
  }
}

function getMuxUploadCorsOrigin(request: Request): string {
  const requestOrigin = getRequestOrigin(request);
  if (requestOrigin && isAllowedUploadOrigin(requestOrigin)) {
    return requestOrigin;
  }
  return getConfiguredSiteOrigin();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error.";
}

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
      let upload: Awaited<ReturnType<typeof mux.video.uploads.create>>;
      try {
        upload = await mux.video.uploads.create({
          cors_origin: getMuxUploadCorsOrigin(request),
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
      } catch (error) {
        return NextResponse.json(
          { error: `Mux upload setup failed: ${getErrorMessage(error)}` },
          { status: 502 }
        );
      }
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
  if (input.thumbnail_url) insertRow.thumbnail_url = input.thumbnail_url;
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

  // Tell the engines the moment something new goes live (fire-and-forget).
  if (input.status === "published" && post.slug) {
    void pingIndexNow([`/posts/${post.slug}`, "/"]);
    // Record the internal graph before the request finishes so the published
    // post always receives a real inbound Read Next link.
    await recordPostLinks(post.id);
  }

  let sourceTipUpdated = false;
  if (input.source_tip_id) {
    const postUrl =
      post.slug && input.status === "published"
        ? `${SITE.url}/posts/${post.slug}`
        : `${SITE.url}/admin/posts/${post.id}/preview`;
    const outcomeStatus =
      input.source_tip_mode === "solution"
        ? "solution_brief"
        : input.status === "published"
          ? "article_published"
          : "article_draft";
    const { error: tipUpdateError } = await supabase
      .from("case_tips")
      .update({
        status: "reviewed",
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
        outcome_status: outcomeStatus,
        outcome_url: postUrl,
        outcome_at: new Date().toISOString(),
        outcome_notes:
          input.source_tip_mode === "solution"
            ? "Solution brief created from this tip."
            : input.status === "published"
              ? "Article published from this tip."
              : "Article draft created from this tip.",
      })
      .eq("id", input.source_tip_id);
    sourceTipUpdated = !tipUpdateError;
    if (tipUpdateError) {
      console.warn("source_tip_outcome_update_failed", {
        tip_id: input.source_tip_id,
        post_id: post.id,
        error: tipUpdateError.message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    post,
    mux_upload_url: muxUpload?.url ?? null,
    source_tip_updated: sourceTipUpdated,
  });
}
