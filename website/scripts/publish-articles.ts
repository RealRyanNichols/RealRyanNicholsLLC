/**
 * publish-articles.ts — the article auto-publish pipeline.
 *
 * Reads every markdown file in website/content/articles/, parses its YAML
 * frontmatter, and upserts it into the Supabase `posts` table BY SLUG (so
 * re-running updates the live post instead of creating duplicates).
 *
 * This is the shared workspace that lets Codex, Claude Code, or Ryan publish:
 * drop a markdown file in that folder, merge to main, and it goes live.
 *
 * Run with:  npx tsx scripts/publish-articles.ts   (from the website/ dir)
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *      POSTS_AUTHOR_ID (optional; defaults to Ryan's author id)
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// Default author = Ryan, so pipeline-published posts are attributed like the
// rest of the feed. Override with POSTS_AUTHOR_ID if ever needed.
const AUTHOR_ID = process.env.POSTS_AUTHOR_ID || "6792cdcd-2465-4a3a-9c49-4e270eaf79fa";
const VALID_STATUS = new Set(["draft", "published", "hidden"]);
const VALID_TYPE = new Set(["text", "note", "photo", "video"]);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

/** Minimal, dependency-free frontmatter parser for simple `key: value` blocks. */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw.trim() };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw.trim() };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "").trim();
  const data: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[m[1].toLowerCase()] = val;
  }
  return { data, body };
}

function toTimestamp(date?: string): string | null {
  if (!date) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function main() {
  let files: string[];
  try {
    files = (await readdir(ARTICLES_DIR)).filter(
      (f) => f.endsWith(".md") && !f.startsWith("_") && f.toLowerCase() !== "readme.md",
    );
  } catch {
    console.log(`No articles directory at ${ARTICLES_DIR}; nothing to publish.`);
    return;
  }
  if (files.length === 0) {
    console.log("No article files found; nothing to publish.");
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const file of files.sort()) {
    const raw = await readFile(path.join(ARTICLES_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug?.trim();
    const title = data.title?.trim();
    if (!slug || !title || !body) {
      console.error(`✗ ${file}: missing required slug/title/body — skipped.`);
      failed++;
      continue;
    }

    const status = VALID_STATUS.has(data.status) ? data.status : "published";
    const type = VALID_TYPE.has(data.type) ? data.type : "text";
    const fmDate = toTimestamp(data.date);

    const { data: existing, error: selErr } = await supabase
      .from("posts")
      .select("id, published_at")
      .eq("slug", slug)
      .maybeSingle();
    if (selErr) {
      console.error(`✗ ${file}: lookup failed — ${selErr.message}`);
      failed++;
      continue;
    }

    // Tags are a comma-separated frontmatter string ("January 6, FBI, Bond").
    // Always set (even to []) so removing a tag from the file clears it on re-run.
    const tags = (data.tags || "")
      .split(",")
      .map((t) => t.trim())
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

    if (existing) {
      // Preserve the original publish date on re-runs unless the file overrides it.
      row.published_at = fmDate ?? existing.published_at;
      const { error } = await supabase.from("posts").update(row).eq("id", existing.id);
      if (error) {
        console.error(`✗ ${file}: update failed — ${error.message}`);
        failed++;
        continue;
      }
      console.log(`↻ updated   ${slug}  (${status})`);
    } else {
      row.published_at = status === "published" ? fmDate ?? new Date().toISOString() : fmDate;
      const { data: ins, error } = await supabase
        .from("posts")
        .insert(row)
        .select("id")
        .single();
      if (error) {
        console.error(`✗ ${file}: insert failed — ${error.message}`);
        failed++;
        continue;
      }
      console.log(`✚ published ${slug}  (${status})  id=${ins.id}`);
    }
    ok++;
  }

  console.log(`\nDone. ${ok} ok, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
