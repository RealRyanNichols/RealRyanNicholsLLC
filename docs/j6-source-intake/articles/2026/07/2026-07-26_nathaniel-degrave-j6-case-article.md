# Nathaniel J. DeGrave J6 profile article release record

- Intake reference: `J6-ARTICLE-2026-07-26-NATHANIEL-DEGRAVE`
- Reviewed: 2026-07-26 America/Chicago
- Person: Nathaniel J. DeGrave
- Profile: `/case/people/nathaniel-degrave`
- Article: `/posts/nathaniel-degrave-j6-case-record-plea-sentence-pardon`
- Initial case: *United States v. DeGrave*, `1:21-cr-00090-PLF`
- Superseding case: *United States v. Sandlin et al.*, `1:21-cr-00088-DLF`
- Publication state at intake: draft pending committed-image production gate

## Resume and duplicate check

- Most recent J6 production commit reviewed: `7cec5bd413342a5350a877b6a36614fd153f705a`.
- Matching Vercel production deployment `dpl_4kpPji3Y4uS87vzn3t2PoWyvsfxx` reached `READY`.
- Matching Supabase profile is unique and connects thirteen source records and seven timeline events.
- Supabase duplicate query returned no post whose title, slug or body names Nathaniel DeGrave.
- Supabase `page_og_images` duplicate query returned no DeGrave mapping.
- No unfinished DeGrave article or article-specific OG asset was found in the reviewed production state.
- The enriched profile is live, but it is not a substitute for the required article: it has no visible editorial byline or structured-data author, and its shared dynamic OG endpoint timed out during verification.

## Source ledger

| Source | Canonical URL SHA-256 | Native SHA-256 | Capture and verification |
|---|---|---|---|
| FBI Statement of Facts | `3b42e3a7e47fa3eae3ddff43dbbb13c6d26377fdbd62638063c29c2df4e82ed4` | `7511197e1cfd82e03abbea2a79b078c470278eb5ed954a34b2c46737f11e73a7` | 10 pages; 878,633 bytes; downloaded, text-extracted, rendered and visually reviewed; probable-cause allegations remain attributed |
| Initial indictment | `a2e3aa119dfecfde159121c04102533d3740d3cd2dd93e1484691ef9dad6457d` | `5174ac6c0b9b1f4d9714b59e3e48d16686cad7163d0e97425059bf6d173ea812` | 4 pages; 148,887 bytes; case number, filing date, parties and counts verified; charges are not verdicts |
| Superseding indictment | `eec6a87bf19e5622efa4bf0e8c5b9168861cfaa89f45371bb8bd49fc7e47da77` | `d94605a317a16747547efbfc110ef49e6d0794c6c04b82329f57d3c9cedc5b9d` | 15 pages; 903,604 bytes; defendants, filing date, case number and counts verified |
| Plea agreement | `113f783cd1a93f30675d7968214d29bd37745a86909f6cb683209bbc8ba17e21` | `e9a97d64283776e0edcca8b94206f886f301403afc9ed9b1a79591e0fd09a57d` | 14 pages; 660,223 bytes; plea counts, signatures, cooperation and dismissal provisions verified |
| Statement of offense | `ff6bf923f4a1d9a46b0a943fe86ec90611ea2f244be949673a69993478ad8d50` | `93b86ecce53999377bd4257cae7fb68e5c412fb58e4db7f5461314fed6824141` | 13 pages; 466,193 bytes; stipulated plea record reviewed separately from complaint-stage allegations |
| DOJ plea announcement | `06ab9ee4dd8d8eb287c246b02db949ef831e0a884b238bc9220ad491c71fa1a5` | Not applicable | Official HTML reviewed; arrest, plea date, plea offenses and stated cooperation verified; narrative remains attributed to DOJ |
| Associated Press sentencing report | `3ffc3eee8d901ed13c4e5254a5a1cfccfec641d9fe8af2544a14dd0d5d2cc46e` | Not applicable | Publisher HTML reviewed; supports May 10, 2023 date and 37-month term; not the signed judgment |
| CBS News sentencing report | `9e8d2670964cfd489230a916609cfb28c0f1bd6eed5cd11a7f7998f0ba9d6cf7` | Not applicable | Publisher HTML reviewed; supports reported imprisonment, supervision, fine and restitution terms |
| January 20, 2025 clemency proclamation | `9011e82ef05ed398746ddceca09a762068cf733b1440e13fa45790e25fe3fda1` | Not applicable | Official White House HTML reviewed; DeGrave falls under the full-pardon provision rather than the fourteen named commutations |
| Post-pardon interview listing | `3f447f146e270aef6735060c3ba3ec9c3ab5eabae213e72da81c82a5a6a048b7` | Unavailable | Publisher catalog page reviewed; identity, date, show and listed runtime verified; native audio and transcript not captured |

All five native PDFs were unencrypted and identified as `application/pdf`.

## Factual and editorial boundaries

- FBI affidavits and indictments are labeled as allegations, probable-cause positions or charges.
- The plea agreement and statement of offense are treated as the admitted plea record.
- The reported sentence is kept distinct from the uncaptured signed judgment.
- Detention letters and interview material remain attributed firsthand accounts.
- The pardon is identified as executive clemency, not a trial acquittal or appellate reversal.
- The site’s editorial analysis concerning alleged or documented Biden-era DOJ weaponization is confined to `Ryan’s Take`.
- No charge, plea, sentence, pardon or media label is used as proof of moral character.

## Original OG asset

- Repository path: `website/public/uploads/nathaniel-degrave-j6-case-record-og.jpg`
- Intended public URL: `https://realryannichols.com/uploads/nathaniel-degrave-j6-case-record-og.jpg`
- Dimensions: 1200 × 630
- MIME: `image/jpeg`
- File size: 180,173 bytes
- SHA-256: `0e46fc2f0d1279335cb23d0a998433a6a3e7e467d3e7b14c485a78c91db8f85f`
- Design: person-free blank archive folders, abstract courthouse columns and a neutral procedural timeline
- Exclusions: no likeness, photograph, official seal, copied or fabricated filing, readable evidence, invented date, verdict symbol, protest scene or family member

## Remaining release gates

- Commit the draft article, provenance record and final OG asset.
- Wait for the matching production deployment to reach `READY`.
- Verify the public OG URL returns HTTP 200 as an image and measures exactly 1200 × 630.
- Insert the approved Supabase post and exact `/posts/<slug>` OG mapping.
- Mark the repository article published.
- Wait for the final production deployment to reach `READY`.
- Verify article HTTP 200, canonical, robots, title, description, visible byline, `NewsArticle` author, Open Graph and X metadata.
- Verify exact sitemap inclusion and freshness.

No indexing, traffic or ranking result is claimed.
