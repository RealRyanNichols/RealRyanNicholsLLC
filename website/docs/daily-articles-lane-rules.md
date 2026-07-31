# Daily article engine — lane rules (v2, 2026-07-31)

These rules belong in the `daily-articles-rrn` scheduled task instructions.
They activate the article-richness vocabulary that now exists in the
renderer: `{{receipt}}`, `{{chart}}`, `{{figure}}`, `{{embed}}`,
`{{callout}}`, `{{related}}`. Paste the block below into the task prompt,
replacing any earlier formatting guidance.

---

## ARTICLE RICHNESS RULES (apply to every article you write)

The renderer supports these blocks. Each sits on its own line, `{{` at
column 0. JSON payloads may span multiple lines.

- `{{receipt: {"label": "FACT", "claim": "...", "source": "...", "url": "...", "exhibit_id": "EX-01"}}}` proof block. Allowed labels, exactly: FACT, RYAN STATEMENT, DOCUMENTED INFERENCE, NEEDS AUTHENTICATION, PRIVATE / NOT PUBLIC, SEALED.
- `{{chart: {"type": "bar", "title": "...", "source": "...", "source_url": "...", "data": [{"label": "A", "value": 1}]}}}` real numbers only.
- `{{figure: {"src": "...", "alt": "REQUIRED", "caption": "...", "credit": "..."}}}`
- `{{embed: {"platform": "x", "url": "...", "caption": "..."}}}` platforms: x, facebook, youtube, rumble, truth.
- `{{callout: pull | text}}`, `{{callout: key | text}}`, `{{callout: ask | text with one link}}`
- `{{related: slug-one | slug-two | slug-three}}` two or three of Ryan's own published post slugs, placed mid-article.

### Lane requirements

**Reflection lane** (personal essay). No external sources; that is correct
and stays. Required: at least one `{{callout: pull}}` and one `{{related}}`
block with two or three of Ryan's own posts. No receipts, no charts.

**Builder lane** (teaching piece). Required: at least one
`{{callout: key}}`, one `{{related}}` block, and EITHER a `{{chart}}` built
from numbers gathered during the run OR a `{{receipt}}` labeled
RYAN STATEMENT describing something he actually built. Inline links to any
external tool or standard the piece names.

**Comeback lane**. Every factual claim about a business must carry an
inline hyperlink to the page on that business's own site where the fact was
fetched during the run. At least one `{{receipt}}`. At least one
`{{related}}`. A `{{chart}}` whenever there are real numbers.

### Global rules

1. Never emit a `{{chart}}` without a `source`. The renderer refuses to
   ship one; do not write one.
2. Never emit a `{{receipt}}` without a classification label from the
   allowed list.
3. Every URL fetched during a run goes into the visible body as an inline
   link AND into `public_record_sources`. The hidden array alone is not
   good enough anymore.
4. If a lane's required elements cannot be produced honestly, hold the
   article as a draft and say why in the run report. Do not pad it with a
   decorative chart. A decorative chart is a lie with axes.
5. No em dashes in any copy. No red-flavored language on ordinary
   callouts; emphasis is gold, severe is rare and earned.

---

## Status of supporting pieces

- Renderer, parser, and all six components: LIVE (shipped 2026-07-31).
- `post_links` graph + `/admin/links` orphan report: LIVE. Publishing
  writes edges automatically.
- Auto entity links (Fighting Shadows, Wholesale Universe, GideonHQ,
  RepWatchr, SellerProof, Premier Dental Academy of Longview, Rescue the
  Universe, J6 Evidence Nexus, Work With Me, Talk to Ryan): LIVE at render
  time, first mention only.
- BLOCKED, needs Ryan: `OPENAI_API_KEY` in Supabase Edge Function secrets
  (Project Settings → Edge Functions → Secrets). Until it is set, OG cards
  use the procedural navy/gold background and the pipeline cannot generate
  new in-body artwork. After adding it, re-run the thumbnail generator
  with `?bg=photo`.
