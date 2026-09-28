# Product Catalog Spec

Status: draft for Claude implementation planning
Date: 2026-05-31
Scope: structured product rows and pricing strategy. Claude creates Stripe products/prices and Supabase rows.

## Pricing read

The current $197 / $297 / $997 / $1,997 ladder is defensible.

Why:

- $197 is low enough for a first paid touch, but high enough that Ryan is not doing serious review for free.
- $297 is a clean diagnostic offer. It monetizes attention before a build.
- $997 is in-market for done-for-you small site packages.
- $1,997 is still below many custom/personal-brand website packages, while high enough to justify codebase, analytics, SEO basics, launch copy, and follow-up.

The ladder should be positioned as "real work and a clear next step," not generic web design.

## Comparable pricing

| Provider | Offer/pricing observed | Link | Read for RRN |
| --- | --- | --- | --- |
| SiteMakert | Done-for-you personal website plan listed at $997; higher package listed at $1,497. | https://sitemakert.com/done-for-you-packages | Confirms $997 can sit as a legitimate done-for-you launch price. |
| BrandLauncher | Personal brand one-page website listed at $995; premium website starts at $4,995. | https://brand-launcher.com/ | Supports $997 as a low-end personal brand/site offer and $1,997 as still below premium custom positioning. |
| CMMM Studios | Starter site $497; business site $997; broader packages up to $2,497+. | https://cmmmstudios.com/pricing | Supports the $497-$997-$1,997 range for flat-rate website work. |
| SwiftySites | Swift $499, Turbo $999, Elite $1,499. | https://swiftysites.com/home | Confirms small done-for-you site packages cluster around $499-$1,499. |
| UENI | Promotional done-for-you launch listed at $79 with monthly renewal; normal value shown as $599. | https://get.ueni.com/us/website-launch/ | Useful objection context: cheap builders exist, so RRN must sell owned-feed strategy, proof, voice, and story architecture, not commodity website setup. |

Accessed: 2026-05-31.

## Product rows

| slug | name | type | price_cents | one-line summary | full description | fulfillment notes |
| --- | --- | --- | ---: | --- | --- | --- |
| `strategy-call-30` | 30-Minute Strategy Call | service | 19700 | One focused call to pick the next three moves. | Ryan reviews your story, site, feed, offer, or public situation and gives you the clearest next three moves. This is not legal advice and does not guarantee an outcome. It is a direct strategy call for clarity, attention, and action. | Collect email, phone, scheduling availability, relevant links, and top question. Deliver by call plus short written recap if practical. |
| `site-audit` | Site / Feed Audit | service | 29700 | A written attention and conversion review. | Ryan reviews your homepage, feed, public proof, calls to action, trust signals, copy, and offer path. You get a plain-English audit showing what is confusing, what is costing clicks, and what to fix first. | Customer submits URL(s), goals, audience, and current offer. Deliver written PDF/Doc or private page. |
| `build-your-site` | Build Your Site | service | 99700 | A domain-first owned feed launched around your message. | Ryan helps create a simple owned-feed website on your domain so social media becomes the billboard and your site becomes the home base. Built for posting, proof, contact, basic analytics, and a clear next action. | Scope must be capped: one primary feed/home page, basic about/contact/support path, starter copy, basic analytics, launch handoff. Domain/hosting costs may be separate unless included in the final offer terms. |
| `codebase-domain-bundle` | Codebase + Domain Bundle | service | 199700 | A deeper owned-platform build with launch support. | A larger owned-feed package with codebase setup, domain-first structure, SEO basics, analytics, launch copy, and a 30-day post-launch check-in. Built for people who want more control than a profile page or rented platform. | Define included pages before checkout. Include 30-day check-in, not unlimited edits. Domain/hosting/vendor costs must be disclosed. |
| `receipt-driven-story-page` | Receipt-Driven Story Page | service | 49700 | Ryan turns a clean evidence packet into a public story page. | For customers who already have screenshots, documents, dates, links, and the basic facts organized. Ryan turns the packet into a receipt-driven article or story page written in plain English with careful sourcing and a clear call to action. | Customer must provide publishable proof and rights/permission to use it. Ryan may decline unsafe, defamatory, private, or unsupported claims. Includes one draft and one revision pass. |
| `evidence-organization-sprint` | Evidence Organization Sprint | service | 49700 | Turn scattered screenshots and files into a usable index. | Ryan organizes a small evidence batch into a timeline, source index, issue list, and next-records checklist. This helps a client see what they have, what is missing, and what needs to be cleaned up before publishing, filing, or sending to an attorney/reporter. | Cap file count/page count. Private evidence stays private. Deliver spreadsheet/Doc/PDF. Not legal advice. |
| `case-prep-timeline-pack` | Case-Prep Timeline Pack | service | 99700 | A stronger timeline, exhibit list, and issue map. | Ryan builds a plain-English timeline, exhibit index, people/agencies list, issue map, and next-three-moves checklist from a larger document set. This is evidence organization and pro se support, not legal representation. | Require intake form and upload folder. Cap scope. Redact minors, medical info, private identifiers, and sealed/private data. |
| `public-record-request-pack` | Public Records Request Pack | digital | 4900 | Templates for requesting records without starting from zero. | A downloadable starter pack with plain-English public-records request templates, tracking sheet, follow-up language, and a checklist for documenting dates, agencies, and responses. | Digital download. Include disclaimer that laws vary and users must verify current rules. |
| `own-your-feed-starter-template` | Own Your Feed Starter Template | digital | 9700 | A starter content kit for building a domain-first feed. | A digital template pack for people who want to organize their own owned feed before hiring Ryan. Includes homepage outline, feed categories, first 10 post prompts, proof checklist, CTA menu, and launch checklist. | Digital download. Good lead-in to audit/build offer. |
| `signed-receipts-print` | Signed Receipts Print | physical | 7900 | A signed limited print from the receipts archive. | A signed physical print tied to the public receipts/archive work. This lets supporters buy something tangible without ads or spam. | Physical shipping in US only at launch. Inventory required. Avoid copyrighted third-party screenshots unless rights/fair-use review is complete. |
| `supporter-field-kit` | Supporter Field Kit | physical | 14700 | A physical supporter bundle for people backing the work. | A mailed kit with signed note, sticker/print/card, and a short "organize the truth" field checklist. Built as a meaningful supporter product, not generic merch. | Physical inventory and shipping workflow required. Keep religious/political copy aligned with brand, not gimmicky. |
| `rrn-credits-100` | 100 RRN Credits | digital | 10000 | Prepaid service credit for eligible work. | 100 prepaid credits redeemable toward eligible RealRyanNichols.com services. Not cash, not crypto, not transferable, and not an investment. | Do not activate until the RRN Credits terms/refund language and accounting model are approved. |
| `rrn-credits-250` | 250 RRN Credits | digital | 25000 | Prepaid service credit for bigger work. | 250 prepaid credits redeemable toward eligible RealRyanNichols.com services. Not cash, not crypto, not transferable, and not an investment. | Do not activate until the RRN Credits terms/refund language and accounting model are approved. |
| `rrn-credits-500` | 500 RRN Credits | digital | 50000 | Prepaid service credit for story, evidence, or site work. | 500 prepaid credits redeemable toward eligible RealRyanNichols.com services. Not cash, not crypto, not transferable, and not an investment. | Do not activate until the RRN Credits terms/refund language and accounting model are approved. |

## Recommended store grouping

| Group | Products |
| --- | --- |
| Start here | `strategy-call-30`, `site-audit` |
| Owned feed builds | `build-your-site`, `codebase-domain-bundle`, `own-your-feed-starter-template` |
| Receipts and case organization | `receipt-driven-story-page`, `evidence-organization-sprint`, `case-prep-timeline-pack`, `public-record-request-pack` |
| Supporter goods | `signed-receipts-print`, `supporter-field-kit` |
| Credits | `rrn-credits-*` only after terms/legal review |

## Copy positioning by price

### $197

This is not "pick my brain." It is a decision call.

CTA: "Get Ryan's eyes on it."

### $297

This is the clean diagnostic offer.

CTA: "Find what is costing you attention."

### $497

This is for a publishable packet or small evidence batch.

CTA: "Turn the receipts into something people can follow."

### $997

This is the main cashflow offer.

CTA: "Build the home base."

### $1,997

This is the deeper platform offer.

CTA: "Launch with the codebase, domain structure, analytics, and copy in place."

## Guardrails

- Never describe Ryan as a lawyer or law firm.
- Never guarantee publication, outcome, press coverage, platform growth, court result, or revenue result.
- Services can be declined if facts are unsupported, private, unsafe, defamatory, or outside scope.
- Public stories require source review and redaction.
- Case-prep services are organization, timeline, issue-mapping, and public-record support only.
- Physical products require inventory and rights review before activation.
