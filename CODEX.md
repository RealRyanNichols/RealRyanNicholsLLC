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
Draft evidence-led articles and stage them for publication. Use the byline “Real Ryan Nichols Editorial Team” unless Ryan supplied exact firsthand words for that article. A release-ready automated run completes the source, visual, SEO, deployment, and live-verification gates; a human-reviewed draft remains `status: draft`.

## Current publishing strategy
- The normal live cadence is **two deep articles per Central Time day**. A third is reserved for same-day recovery or a genuinely material breaking primary-record development.
- Automated runs create **one article and one pull request maximum**. Do not generate multi-article trend batches.
- Prioritize the January 6 archive: person-centered profiles, one-document explainers, evidence/video records, legal-procedure explainers, sourced timelines, post-*Fischer* and clemency outcomes, and durable search/reference pages.
- Before drafting, define one primary search query, its reader intent, three to five related long-tail terms, likely competing site pages, and the internal-link plan. Do not target the same intent twice in one day.
- Prefer roughly 1,400–2,200 useful words when the evidence warrants it, with primary records, clear fact/allegation/advocacy/judicial-finding boundaries, and no padding.
- A release-ready article includes an authentic verified portrait when applicable, two to four provenance-cleared documentary visuals, captions and alt text, an accurate article-specific 1200×630 OG image, canonical and structured metadata, and signed-out live verification.
- The former recurring “three trending X articles” strategy is superseded. Old bulk-content PRs are not approved for merge without fresh owner review.

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
- Use a direct, factual, receipt-driven, plainspoken editorial voice. Never write invented first-person words for Ryan.
- **Document, don't editorialize.** Quote sources/screenshots and attribute them.
- **Never invent** quotes, statistics, court facts, dates, or names. If a fact
  isn't confirmed, leave a clearly-marked `[TODO: confirm]` instead of guessing.
- Strong, searchable **title + subtitle**. Work in real keywords/phrases
  naturally (e.g. "Ryan Nichols", "January 6", "pardoned", "East Texas") —
  no keyword stuffing.
- Release-ready automated articles must include the verified visual package and article-specific OG image described above. Human-review drafts may leave those as explicit release blockers.

## No-cost clicks — REQUIRED in every article
Every article carries **one-tap inline questions** using the poll shortcode:

```
{{poll: Question in Ryan's voice? | Option one | Option two | Option three}}
```

These render as tappable buttons **right where they sit in the body**. One tap,
free, anonymous, no signup, no navigation — the reader answers and keeps
reading. That's the whole point: it costs the reader nothing and tells us what
they think.

Rules:
- **2 to 3 per article.** One mid-article (drop it right after the hook or the
  first receipt, at a natural pause) and one as the closer. Long articles
  (1,500+ words) can carry a third in the middle third.
- Questions are **about the reader**, not a quiz about the article. "Where do
  you go when the noise gets loud?" beats "What did Ryan file on June 1?"
- 2–4 options, each under 6 words, no wrong answers, no gotchas.
- Write them in Ryan's voice. Direct. Warm. No corporate survey tone.
- Never make a poll the ask for money or signup — it must stay a no-cost click.

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
