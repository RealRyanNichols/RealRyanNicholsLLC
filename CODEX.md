# CODEX.md — Writing articles for RealRyanNichols.com

This repo powers **realryannichols.com** (Next.js + Supabase). It has an
automated article pipeline: drop a markdown file in
`website/content/articles/`, open a pull request, and **on merge to `main` a
GitHub Action publishes it to the live site** (`scripts/publish-articles.ts`
upserts it into the `posts` table by `slug` — re-merging an edited file updates
the post instead of duplicating it).

This file is the brief for **Codex** (or any agent/human) drafting articles.
Follow the format exactly so the pipeline picks it up.

---

## Your job
Draft articles in Ryan Nichols's voice and stage them for publication. You write
the words; a human reviews the PR, adds the cover image, and merges.

## Where to put the file
- One markdown file per article in: **`website/content/articles/`**
- Name it: **`YYYY-MM-DD_slug.md`** — e.g. `2026-05-30_no-gun-at-church.md`

## File format
YAML frontmatter, then the markdown body:

```markdown
---
title: "The headline — strong, specific, search-friendly"
subtitle: "One-line dek (also used as the SEO / social description)"
author: "Ryan Nichols"
date: "2026-05-30"
category: "Legal Spotlight"   # or: Investigation, News, Wall of Lies, etc.
slug: "unique-url-slug"
status: "draft"               # draft = staged; published = goes live on merge
pinned: false
---

Your article body in markdown, exactly as it should read.
```

Recognized frontmatter keys: `title`, `subtitle`, `author`, `date`,
`category`, `slug`, `status` (`draft` | `published` | `hidden`), `pinned`,
and optional `seo_title` / `seo_description`. `subtitle` becomes the SEO/social
description if `seo_description` isn't set. `slug` is the unique key.

## Editorial voice & rules
- Write in Ryan's **first person**: direct, factual, receipt-driven, plainspoken.
- **Document, don't editorialize.** Quote sources/screenshots and attribute them.
- **Never invent** quotes, statistics, court facts, dates, or names. If a fact
  isn't confirmed, leave a clearly-marked `[TODO: confirm]` instead of guessing.
- Strong, searchable **title + subtitle**. Work in real keywords/phrases
  naturally (e.g. "Ryan Nichols", "January 6", "pardoned", "East Texas") —
  no keyword stuffing.
- **Don't add the cover/OG image** — that's wired separately after review. Just
  write the body.

## Active-matter caution
Some topics relate to an **active legal matter** where Ryan is the named
subject under conditions of release. For anything touching that:
- Use `status: "draft"` so nothing publishes until a human clears it.
- Stick to Ryan's own first-person account and publicly documented facts.
- Do **not** name or target alleged victims/witnesses.

## What NOT to touch
- Only add files under `website/content/articles/`.
- Don't modify other files, add dependencies, or change schema/config.

## When you're done
- Open a **draft pull request** titled `content: <article title>`.
- A human reviews it, sets the cover image + final SEO, and merges. The merge to
  `main` publishes it automatically.
