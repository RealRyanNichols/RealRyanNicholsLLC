# Main-page social preview artwork

The September 2026 package assigns a distinct 1200 × 630 JPEG to each of 55 main public pages and section hubs. Each image is under 250 KB. The high-resolution sources and 3840 × 2016 resampled masters stay in the separate asset package; they are not shipped as website assets.

The route catalog is `website/lib/page-og-catalog.ts`. `pageMetadata` / `withMainPageOg` apply cards to static metadata; `getOgImage` supplies fallback artwork to existing dynamic metadata. Admin-pinned cards retain precedence in dynamic pages. Query-specific archive views and individual articles, profiles, documents and records keep their existing card behavior.

Canonical URLs, robots directives, page titles, descriptions and article fields are preserved. The `/login` page uses a server layout to provide its share metadata. Existing redirect aliases keep their destination page's preview. The newer `/fuel` page is outside this package.

Before deployment, run the complete test suite, TypeScript check and ESLint on changed sources. After deployment, verify every page's `og:image` and `twitter:image`, then fetch its referenced JPEG and verify the dimensions and SHA-256 against the source package. Update the six existing image overrides only after the new asset URLs are live: `/case/nexus`, `/j6`, `/services/legal-tech-blueprint`, `/submit`, `/support` and `/the-map-room`. Preserve override titles/descriptions and any concurrent edits.

## URL mapping

All image paths below are relative to `https://realryannichols.com`.

| Page | Image | Image headline |
| --- | --- | --- |
| `/case` | `/og/pages/2026-09/case.jpg` | THE J6 FILES |
| `/` | `/og/pages/2026-09/home.jpg` | RYAN NICHOLS |
| `/book/preorder` | `/og/pages/2026-09/book-preorder.jpg` | FIGHTING SHADOWS |
| `/the-story` | `/og/pages/2026-09/the-story.jpg` | THE STORY |
| `/book` | `/og/pages/2026-09/book.jpg` | FIGHTING SHADOWS |
| `/search` | `/og/pages/2026-09/search.jpg` | SEARCH THE RECORD |
| `/login` | `/og/pages/2026-09/login.jpg` | YOUR ACCOUNT |
| `/tell-your-story` | `/og/pages/2026-09/tell-your-story.jpg` | TELL YOUR STORY |
| `/j6` | `/og/pages/2026-09/j6.jpg` | JANUARY 6 ARCHIVE |
| `/case/geography` | `/og/pages/2026-09/case-geography.jpg` | J6 GEOGRAPHY |
| `/about` | `/og/pages/2026-09/about.jpg` | MEET RYAN |
| `/fights/equal-justice` | `/og/pages/2026-09/equal-justice.jpg` | EQUAL JUSTICE |
| `/videos` | `/og/pages/2026-09/videos.jpg` | WATCH THE VIDEOS |
| `/services` | `/og/pages/2026-09/services.jpg` | WORK WITH RYAN |
| `/the-map-room` | `/og/pages/2026-09/map-room.jpg` | THE MAP ROOM |
| `/case/the-salvaged-doj-record` | `/og/pages/2026-09/salvaged-doj-record.jpg` | THE SALVAGED RECORD |
| `/submit` | `/og/pages/2026-09/submit.jpg` | SEND A TIP |
| `/start-here` | `/og/pages/2026-09/start-here.jpg` | START HERE |
| `/contact` | `/og/pages/2026-09/contact.jpg` | CONTACT RYAN |
| `/case/nexus` | `/og/pages/2026-09/case-nexus.jpg` | THE CASE NEXUS |
| `/case/officials` | `/og/pages/2026-09/case-officials.jpg` | ACCOUNTABILITY INDEX |
| `/fights` | `/og/pages/2026-09/fights.jpg` | THE FIGHTS |
| `/book/updates` | `/og/pages/2026-09/book-updates.jpg` | BOOK UPDATES |
| `/support` | `/og/pages/2026-09/support.jpg` | SUPPORT THE WORK |
| `/the-harassment` | `/og/pages/2026-09/harassment.jpg` | THE RECEIPTS WALL |
| `/tools` | `/og/pages/2026-09/tools.jpg` | FREE TOOLS |
| `/case/intake` | `/og/pages/2026-09/case-intake.jpg` | PUBLIC INTAKE LEDGER |
| `/case/damages` | `/og/pages/2026-09/case-damages.jpg` | THE COST |
| `/case/timeline` | `/og/pages/2026-09/case-timeline.jpg` | THE J6 TIMELINE |
| `/editorial-standards` | `/og/pages/2026-09/editorial-standards.jpg` | EDITORIAL STANDARDS |
| `/tools/embed` | `/og/pages/2026-09/embed.jpg` | TAKE THE ARCHIVE WITH YOU |
| `/tools/share-card` | `/og/pages/2026-09/share-card.jpg` | MAKE A SHARE CARD |
| `/store` | `/og/pages/2026-09/store.jpg` | THE STORE |
| `/tools/records-request` | `/og/pages/2026-09/records-request.jpg` | REQUEST THE RECORDS |
| `/live` | `/og/pages/2026-09/live.jpg` | RYAN LIVE |
| `/impact` | `/og/pages/2026-09/impact.jpg` | WHAT THE WORK BUILT |
| `/privacy` | `/og/pages/2026-09/privacy.jpg` | YOUR PRIVACY |
| `/case/witnesses` | `/og/pages/2026-09/witnesses.jpg` | WALL OF CORROBORATORS |
| `/case/brief` | `/og/pages/2026-09/case-brief.jpg` | THE CASE BRIEF |
| `/about/numbers` | `/og/pages/2026-09/about-numbers.jpg` | HOW THE NUMBERS WORK |
| `/fights/water-rights` | `/og/pages/2026-09/water-rights.jpg` | EAST TEXAS WATER |
| `/fights/first-amendment` | `/og/pages/2026-09/first-amendment.jpg` | THE FIRST AMENDMENT |
| `/fights/land-rights` | `/og/pages/2026-09/land-rights.jpg` | LAND RIGHTS |
| `/fights/tax-fairness` | `/og/pages/2026-09/tax-fairness.jpg` | TAX FAIRNESS |
| `/case-builder` | `/og/pages/2026-09/case-builder.jpg` | BUILD YOUR CASE RECORD |
| `/services/legal-tech-blueprint` | `/og/pages/2026-09/legal-tech.jpg` | OWN YOUR CASE DASHBOARD |
| `/book/press` | `/og/pages/2026-09/book-press.jpg` | FIGHTING SHADOWS |
| `/community-rules` | `/og/pages/2026-09/community-rules.jpg` | COMMUNITY RULES |
| `/store/strategy-call-30` | `/og/pages/2026-09/strategy-call.jpg` | 30-MINUTE STRATEGY CALL |
| `/store/site-audit` | `/og/pages/2026-09/site-audit.jpg` | GET YOUR SITE AUDITED |
| `/store/build-your-site` | `/og/pages/2026-09/build-site.jpg` | BUILD YOUR OWN SITE |
| `/store/codebase-domain-bundle` | `/og/pages/2026-09/codebase-domain.jpg` | OWN THE WHOLE PLATFORM |
| `/own-your-feed` | `/og/pages/2026-09/own-your-feed.jpg` | OWN YOUR FEED |
| `/case-review` | `/og/pages/2026-09/case-review.jpg` | GET YOUR CASE ORGANIZED |
| `/j6/top-25` | `/og/pages/2026-09/j6-top-25.jpg` | THE MOST TALKED-ABOUT J6 CASES |
