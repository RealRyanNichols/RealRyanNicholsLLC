/**
 * publish-articles.ts — the article auto-publish pipeline.
 *
 * Reads every markdown file in website/content/articles/, validates the full
 * set before writing anything, then upserts each article by slug.
 *
 * Run with: npx tsx scripts/publish-articles.ts (from website/)
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *      POSTS_AUTHOR_ID (optional)
 */
import { createClient } from "@supabase/supabase-js";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const AUTHOR_ID =
  process.env.POSTS_AUTHOR_ID || "6792cdcd-2465-4a3a-9c49-4e270eaf79fa";
const VALID_STATUS = new Set(["draft", "published", "hidden"]);
const VALID_TYPE = new Set(["text", "note", "photo", "video"]);
const REQUIRED_OG_WIDTH = 1200;
const REQUIRED_OG_HEIGHT = 630;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function assertServiceRoleKey(key: string) {
  const fix =
    "Use the service_role (legacy) or sb_secret_… (new) key from " +
    "Supabase → Project Settings → API. Aborting.";
  if (key.startsWith("sb_secret_")) return;
  if (key.startsWith("sb_publishable_")) {
    console.error(`✗ SUPABASE_SERVICE_ROLE_KEY is a publishable key. ${fix}`);
    process.exit(1);
  }
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64").toString("utf8"),
    );
    if (payload.role !== "service_role") {
      console.error(
        `✗ SUPABASE_SERVICE_ROLE_KEY has role "${payload.role}", not "service_role". ${fix}`,
      );
      process.exit(1);
    }
  } catch {
    console.error(
      `✗ SUPABASE_SERVICE_ROLE_KEY isn't a service_role JWT or an sb_secret_… key. ${fix}`,
    );
    process.exit(1);
  }
}
assertServiceRoleKey(SERVICE_KEY);

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  if (!raw.startsWith("---")) return { data: {}, body: raw.trim() };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw.trim() };
  const block = raw.slice(3, end).trim();
  const body = raw
    .slice(end + 4)
    .replace(/^\r?\n/, "")
    .trim();
  const data: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[match[1].toLowerCase()] = value;
  }
  return { data, body };
}

function toTimestamp(date?: string): string | null {
  if (!date) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00Z`)
    : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function jpegDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8)
    return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) return null;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += length + 2;
  }
  return null;
}

function imageDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  const pngSignature = "89504e470d0a1a0a";
  if (
    buffer.length >= 24 &&
    buffer.subarray(0, 8).toString("hex") === pngSignature
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return jpegDimensions(buffer);
}

async function validateLocalOgImage(imageUrl: string, file: string) {
  if (
    !imageUrl.startsWith("/") ||
    imageUrl.startsWith("//") ||
    imageUrl.includes("..")
  ) {
    throw new Error(
      `${file}: og_image must be a root-relative file under /public (for example /social-cards/card.jpg)`,
    );
  }
  const relativePath = imageUrl.slice(1);
  const imagePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!imagePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    throw new Error(`${file}: og_image resolves outside website/public`);
  }
  await access(imagePath);
  const buffer = await readFile(imagePath);
  const dimensions = imageDimensions(buffer);
  if (!dimensions) {
    throw new Error(`${file}: og_image must be a valid PNG or JPEG`);
  }
  if (
    dimensions.width !== REQUIRED_OG_WIDTH ||
    dimensions.height !== REQUIRED_OG_HEIGHT
  ) {
    throw new Error(
      `${file}: og_image is ${dimensions.width}×${dimensions.height}; ` +
        `published articles require ${REQUIRED_OG_WIDTH}×${REQUIRED_OG_HEIGHT}`,
    );
  }
}

type ExistingPost = {
  id: string;
  published_at: string | null;
  status: string;
  thumbnail_url: string | null;
  og_image_url: string | null;
};

type PublishPlan = {
  file: string;
  slug: string;
  status: string;
  existing: ExistingPost | null;
  row: Record<string, unknown>;
};

async function main() {
  let files: string[];
  try {
    files = (await readdir(ARTICLES_DIR)).filter(
      (file) =>
        file.endsWith(".md") &&
        !file.startsWith("_") &&
        file.toLowerCase() !== "readme.md",
    );
  } catch {
    console.log(
      `No articles directory at ${ARTICLES_DIR}; nothing to publish.`,
    );
    return;
  }
  if (files.length === 0) {
    console.log("No article files found; nothing to publish.");
    return;
  }

  const plans: PublishPlan[] = [];
  const errors: string[] = [];

  for (const file of files.sort()) {
    try {
      const raw = await readFile(path.join(ARTICLES_DIR, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = data.slug?.trim();
      const title = data.title?.trim();
      if (!slug || !title || !body) {
        throw new Error(`${file}: missing required slug/title/body`);
      }
      if (data.status && !VALID_STATUS.has(data.status)) {
        throw new Error(`${file}: invalid status "${data.status}"`);
      }
      if (data.type && !VALID_TYPE.has(data.type)) {
        throw new Error(`${file}: invalid type "${data.type}"`);
      }

      const { data: existing, error: lookupError } = await supabase
        .from("posts")
        .select("id, published_at, status, thumbnail_url, og_image_url")
        .eq("slug", slug)
        .maybeSingle<ExistingPost>();
      if (lookupError)
        throw new Error(`${file}: lookup failed — ${lookupError.message}`);

      if (!existing && !data.status) {
        throw new Error(
          `${file}: new articles must declare an explicit status`,
        );
      }
      const status = data.status || existing?.status || "draft";
      const type = data.type || "text";
      const frontmatterDate = toTimestamp(data.date);
      const ogImage = data.og_image?.trim() || null;

      if (ogImage) await validateLocalOgImage(ogImage, file);

      if (status === "published" && !ogImage) {
        const hasPostImage = Boolean(
          existing?.thumbnail_url || existing?.og_image_url,
        );
        const { data: override, error: overrideError } = await supabase
          .from("page_og_images")
          .select("image_url")
          .eq("path", `/posts/${slug}`)
          .maybeSingle();
        if (overrideError) {
          throw new Error(
            `${file}: OG override lookup failed — ${overrideError.message}`,
          );
        }
        if (!hasPostImage && !override?.image_url) {
          throw new Error(
            `${file}: published articles require og_image pointing to a local 1200×630 PNG or JPEG`,
          );
        }
      }

      const tags = (data.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const row: Record<string, unknown> = {
        slug,
        type,
        status,
        title,
        body,
        category: data.category || null,
        tags,
        seo_title: data.seo_title || title,
        seo_description: data.seo_description || data.subtitle || null,
        author_id: AUTHOR_ID,
        pinned: data.pinned === "true",
        updated_at: new Date().toISOString(),
      };
      if (ogImage) {
        row.thumbnail_url = ogImage;
        row.og_image_url = ogImage;
      }
      row.published_at = existing
        ? (frontmatterDate ?? existing.published_at)
        : status === "published"
          ? (frontmatterDate ?? new Date().toISOString())
          : frontmatterDate;

      plans.push({ file, slug, status, existing: existing ?? null, row });
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `${file}: unknown validation failure`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("Article preflight failed. No posts were written:");
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }

  let ok = 0;
  for (const plan of plans) {
    if (plan.existing) {
      const { data: updated, error } = await supabase
        .from("posts")
        .update(plan.row)
        .eq("id", plan.existing.id)
        .select("id");
      if (error)
        throw new Error(`${plan.file}: update failed — ${error.message}`);
      if (!updated || updated.length === 0) {
        throw new Error(`${plan.file}: update affected 0 rows — not live`);
      }
      console.log(`↻ updated   ${plan.slug}  (${plan.status})`);
    } else {
      const { data: inserted, error } = await supabase
        .from("posts")
        .insert(plan.row)
        .select("id")
        .single();
      if (error)
        throw new Error(`${plan.file}: insert failed — ${error.message}`);
      console.log(
        `✚ published ${plan.slug}  (${plan.status})  id=${inserted.id}`,
      );
    }
    ok++;
  }

  console.log(`\nDone. ${ok} ok, 0 failed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});