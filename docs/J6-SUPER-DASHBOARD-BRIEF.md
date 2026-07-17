# J6 SUPER DASHBOARD — Build Brief
**Owner: Ryan Nichols · Priority: #1 site build · Status: approved by Ryan, ready to build**

## The mission
Make RealRyanNichols.com the **premier January 6 archive online**. One front door, not a
million pathways. Ryan's case highlighted, the full 1,571-defendant archive behind it,
stories and breaking news flowing through it. Tone: positive toward Ryan Nichols and
every J6 defendant who was mistreated — receipts-first, per /editorial-standards.
Defendants convicted of sexual crimes against adults or children are excluded from the
archive entirely (enforcement already live in the enrichment pipeline via
`visibility='hidden'` + `+excluded-sex-offense`).

## The problem being fixed
Today the record is scattered across overlapping routes: `/case`, `/case/nexus`,
`/case/brief`, `/case/briefing`, `/case/timeline`, `/case/damages`, `/case/witnesses`,
`/case/officials`, `/case/geography`, `/case/the-salvaged-doj-record`,
`/evidence-the-doj-tried-to-erase`, `/j6`, `/jan-6`, `/the-map-room`, `/fights`,
`/the-harassment`. Visitors can't tell where to start; link equity is split; nothing
reads as THE archive.

## Target architecture — TWO doors only

### Door 1: `/j6` — THE J6 ARCHIVE (the super dashboard)
Single premier hub. Sections, top to bottom:
1. **Hero**: "The January 6 Archive" — live stats row (1,571 defendants indexed ·
   1,074+ documents · DOJ record mirrored after the government scrubbed it · X claimed
   profiles). Every number links to its proof.
2. **Breaking & latest**: auto-feed of newest posts in categories J6, January 6, Legal
   Filings, Investigation + a "New records this week" strip from freshly enriched
   defendant profiles (`enriched_source like '%positive-enrichment%'` ordered by
   updated_at).
3. **Ryan's case, featured**: one strong card — Marine, rescuer, 1,463 days, due process
   violated on the record, pardoned, dismissed with prejudice → links to `/case`.
4. **The defendant directory**: search + filter (claimed / unclaimed / state / veteran),
   built on case_people. Each unclaimed row shows the person's enriched story lede and
   the free-claim CTA.
5. **The evidence library**: merged home of the salvaged DOJ record + document archive +
   bodycam/video work (absorbs `/evidence-the-doj-tried-to-erase` and
   `/case/the-salvaged-doj-record` as anchored sections).
6. **The map/live layer**: the Map Room's working panels embedded as a dashboard strip
   (drop the dormant "lights up when scrapers run" panels).
7. **Claim + Case Builder CTAs**: free for J6 defendants forever; paid Case Builder for
   everyone else (`/case-builder`).

### Door 2: `/case` — United States v. Nichols (already rebuilt, keep)
Ryan's personal case profile stays the flagship proof-of-concept. Its sub-routes
(`/case/timeline`, `/case/witnesses`, `/case/officials`, `/case/geography`,
`/case/damages`) remain as deep-links FROM the profile, but disappear from top nav.

## Redirects (301) — kill the extra pathways
- `/jan-6` → `/j6`
- `/evidence-the-doj-tried-to-erase` → `/j6#evidence`
- `/case/the-salvaged-doj-record` → `/j6#evidence`
- `/case/nexus` → `/j6#directory`
- `/case/brief` and `/case/briefing` → merge into ONE (`/case/brief`), redirect the other
- `/the-map-room` → `/j6#live` (or keep as power-user page, but out of main nav)
- Nav: Feed · **J6 Archive** · Case · Watch · The Book · Work With Me. That's it.

## Rendering work required (the piece that makes enrichment visible)
- **Unclaimed profile template** (`/case/people/[slug]` unclaimed state): render the
  enriched `description` (the researched story) ABOVE the claim pitch, then docket,
  then claim CTA. Perfect on mobile: short lines, big type, share row, one-tap poll
  ("Should this record stay public? ..."), OG image per person. This single change
  turns 1,561 pages into shareable landing pages.
- Story-first, emotion, action: every profile ends with share buttons + claim CTA +
  "send this to them" prompt.

## Content engine tie-in
- CODEX.md beat addition: daily J6 news sweep — pardon follow-ups, defendant stories,
  weaponization coverage → drafts into content_queue (existing autopost pipeline
  publishes low-risk daily; no-cost-click polls required per doctrine).
- Featured-story pipeline: enrichment runs report "strongest stories" — turn the best
  into full posts (Aaron James family, Anna Morgan-Lloyd, Kash Kelly, Rosanne Boyland
  memorial, William Pope's transparency fight).

## Data already in place (done, live in Supabase)
- All 1,571 profiles have sourced descriptions (DOJ record baseline).
- 81+ have researched positive write-ups with cited sources; enrichment job runs 5×/day,
  40/run, until all are done. Identity guard + sex-offense exclusion enforced.
- KB auto-sync trigger keeps the Talk-to-Ryan AI current.

## Build order
1. Unclaimed-profile rendering (biggest visible win, smallest diff)
2. `/j6` super dashboard page
3. Redirect map + nav cleanup
4. CODEX J6 news beat
5. OG images per defendant profile
