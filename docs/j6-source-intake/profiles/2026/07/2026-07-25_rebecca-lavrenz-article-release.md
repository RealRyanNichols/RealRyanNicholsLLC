# Rebecca Lavrenz J6 profile article release record

- Release record created: 2026-07-25T17:25:00Z
- Person: Rebecca Lavrenz
- Profile: `/case/people/rebecca-lavrenz`
- Article slug: `rebecca-lavrenz-j6-case-verdict-sentence-appeal-pardon`
- Article source: `website/content/articles/2026-07-25_rebecca-lavrenz-j6-case-verdict-sentence-appeal-pardon.md`
- Initial release status: draft, pending committed-image production gate
- Byline: Real Ryan Nichols Editorial Team

## Duplicate check

- GitHub code search reviewed on 2026-07-25.
- Supabase `posts` checked for title or slug matches on 2026-07-25.
- Supabase `page_og_images` checked for Rebecca Lavrenz article-path matches on 2026-07-25.
- Result: profile and source records existed; no Rebecca Lavrenz article or article-specific OG mapping existed.

## Source basis

This article relies on the source and provenance record:

`docs/j6-source-intake/profiles/2026/07/2026-07-25_rebecca-lavrenz-native-court-records-pardon-interview-profile-expansion.md`

Principal canonical sources:

- DOJ defendant page: `https://www.justice.gov/usao-dc/defendants/lavrenz-rebecca`
- DOJ criminal complaint PDF: `https://www.justice.gov/usao-dc/case-multi-defendant/file/1560702/dl`
- DOJ FBI Statement of Facts PDF: `https://www.justice.gov/usao-dc/case-multi-defendant/file/1560707/dl`
- Verdict report: `https://wisconsinwatch.org/2024/04/capitol-assault-praying-great-grandmother-prosecuted-guilty/`
- Sentence report: `https://coloradosun.com/2024/08/12/rebecca-lavrenz-praying-grandma-jan-6-sentence/`
- D.C. Circuit docket mirror: `https://dockets.justia.com/docket/circuit-courts/cadc/24-3105`
- Clemency proclamation: `https://www.whitehouse.gov/presidential-actions/2025/01/granting-pardons-and-commutation-of-sentences-for-certain-offenses-relating-to-the-events-at-or-near-the-united-states-capitol-on-january-6-2021/`
- Office of the Pardon Attorney recipient page: `https://www.justice.gov/pardon/freedom-information-act-foia-release-pardon-certificate-recipients`
- Firsthand interview publisher page: `https://kimmonson.com/kim_monson_show/praying-grandma-rebecca-lavrenz-pardoned-but-fights-on-for-first-amendment-rights/`

Capture timestamps, URL hashes, native-file hashes, verification boundaries and missing-record disclosures are preserved in the profile-expansion provenance record.

## OG image provenance

- Repository path: `website/public/uploads/rebecca-lavrenz-j6-case-record-og.jpg`
- Intended public URL: `https://realryannichols.com/uploads/rebecca-lavrenz-j6-case-record-og.jpg`
- Dimensions: 1200×630
- Format: JPEG
- File size: 212,904 bytes
- SHA-256: `95e2dc131549c00c28c383428f1368e7ffc6dacad1197604f5678669bc7b7e5f`
- Generation mode: built-in image-generation workflow, followed by deterministic center crop and JPEG conversion
- Visual basis: original, person-free symbolic courthouse archive and procedural timeline
- Verified visual count: exactly four blank folders, corresponding symbolically to the four charged counts
- Exclusions: no likeness, photograph, fake filing, official seal, government insignia, weapon, riot scene or fabricated evidence

Final generation prompt:

> Create an original, cinematic editorial image for an article titled “Rebecca Lavrenz J6 Case Record.” Represent a documented procedural journey from four misdemeanor counts through jury verdict, sentencing, appeal, and full pardon, without depicting Rebecca Lavrenz or any real person. Use a dignified courthouse archive room at dawn, a wooden evidence table, exactly four blank folders, and a bronze procedural timeline. Include only the exact text “REBECCA LAVRENZ” and “J6 CASE RECORD.” Avoid fake documents, official seals, government insignia, political logos, violence, weapons and fabricated evidence.

## Release gates

- Provenance saved: complete
- Duplicate article check: complete
- Profile, sources and timeline: complete in Supabase
- Draft article: complete
- Final OG asset: complete locally; repository commit pending
- Production deployment: pending repository commit
- Public image HTTP and content-type verification: pending
- Article publication: blocked until public-image gate passes
- Live metadata, structured-data, sitemap and final hash checks: pending

## Publication recovery and live verification

The staged article and final image were merged through GitHub PR `#399`.

- Staging merge commit: `ebf53cc282985165a2d4bd3f43860d9997c8de9f`
- Staging production deployment: `dpl_2QSmYVxDA8T12tCMpAhiwSPQeZgc`
- Staging deployment state: `READY`

The public image was then fetched from its exact intended URL on 2026-07-25:

- HTTP status: 200
- Content type: `image/jpeg`
- Dimensions: 1200×630
- Content length: 212,904 bytes
- Live SHA-256: `95e2dc131549c00c28c383428f1368e7ffc6dacad1197604f5678669bc7b7e5f`
- Committed SHA-256: `95e2dc131549c00c28c383428f1368e7ffc6dacad1197604f5678669bc7b7e5f`
- Result: byte-for-byte match

The article status was changed from draft to published only after that image gate passed.

- Publication PR: `#400`
- Publication merge commit: `afb6c275b87cf01068bbe47b76e2ba65c2c064bc`
- Publication deployment: `dpl_6pawtj8M9D2bTRDqSKqkrWx7Nr1z`
- Publication deployment state: `READY`

The first live article request returned 404 because the repository-to-database publisher did not create the corresponding post row. The already approved article was restored through an idempotent Supabase transaction that:

- created or updated exactly one `posts` row for the article slug;
- preserved the Editorial Team byline;
- installed the exact SEO title and description;
- installed the exact OG URL;
- stored the public-record source manifest and article tags; and
- created or updated exactly one `page_og_images` mapping for the article path.

Supabase verification:

- Post ID: `37bc7fb0-b437-4844-8be4-ffc74ae570db`
- Status: `published`
- Approval status: `approved`
- Byline override: `Real Ryan Nichols Editorial Team`
- Body length: 16,256 characters
- Page mapping: `/posts/rebecca-lavrenz-j6-case-verdict-sentence-appeal-pardon`
- Mapped image: `https://realryannichols.com/uploads/rebecca-lavrenz-j6-case-record-og.jpg`
- Mapped dimensions: 1200×630

Live article verification on 2026-07-25:

- HTTP status: 200
- Canonical: exact article URL
- Robots: `index, follow`
- Visible byline: `Real Ryan Nichols Editorial Team`
- Structured-data type: `NewsArticle`
- Structured-data author: `Real Ryan Nichols Editorial Team`
- Open Graph image: exact intended public image URL
- X image: exact intended public image URL
- Open Graph dimensions: 1200×630

The sitemap route returned HTTP 200 before the repaired database row was incorporated into its prerendered output. This provenance-only commit is intended to trigger a fresh production build from the completed database state; exact sitemap inclusion remains the final release check.
