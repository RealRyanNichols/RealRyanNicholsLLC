# Articles → auto-publish

Drop a markdown file in this folder, merge it to `main`, and it publishes
itself to **realryannichols.com** (the `posts` table). Works for **Codex**,
**Claude Code**, or **you**.

## How it works

On every push to `main` that touches this folder,
`.github/workflows/publish-articles.yml` runs
`website/scripts/publish-articles.ts`, which reads each `.md` file, parses its
frontmatter, and upserts it into Supabase **by `slug`** — so editing a file and
re-merging **updates** the live post instead of creating a duplicate.

## File format

Name files `YYYY-MM-DD_slug.md`. Frontmatter, then the markdown body:

```markdown
---
title: "Your headline"
subtitle: "One-line dek — used as the social/SEO description"
author: "Ryan Nichols"
date: "2026-05-13"
category: "Legal Spotlight"
slug: "your-unique-slug"
status: "published"   # published | draft | hidden
pinned: false          # true = pin to the top of the feed
---

Your article body, in markdown, exactly as it should appear.
```

## Notes

- **`slug` is the unique key.** Re-publishing the same slug updates the post.
- **`status: draft`** ingests it but keeps it off the public site; flip to
  `published` and re-merge to go live.
- **`published_at`** is set from `date` on first publish, then preserved on
  re-runs (so edits don't bump the date).
- Files starting with `_` (like `_TEMPLATE.md`) and this README are ignored.
- The **share/OG image isn't set here** — add it after publish via
  `/admin/og-images`.
