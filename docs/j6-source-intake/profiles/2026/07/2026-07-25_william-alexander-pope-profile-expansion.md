# William Alexander Pope — indictment, dismissal, post-dismissal ruling, and appeal profile expansion

- Intake reference: `J6-PROFILE-2026-07-25-WILLIAM-ALEXANDER-POPE`
- Profile route: `/case/people/william-pope`
- Person ID: `6ebad288-66f0-4c76-9982-45ed8f4a87cd`
- Research and database update date: 2026-07-25
- Profile-summary SHA-256: `a7ea1e365bb9980e5c40f3cd5e0cac1ee7b3b7be16b45c80a92e0c48aaf564aa`

## Material classification correction

The legacy profile labeled William Pope a “Pardoned January 6 defendant.” The sourced procedural record does not show a plea, conviction, or sentence. It instead shows a pending indictment dismissed with prejudice on January 21, 2025 after the January 20 presidential directive to pursue dismissal of pending January 6 indictments.

The structured role is now `January 6 case-file subject`. The disposition now distinguishes:

- charged allegations
- pretrial dismissals of Counts Two, Five, and Seven
- dismissal of the remaining indictment with prejudice
- post-dismissal discovery and protective-order litigation
- D.C. Circuit appeal No. `25-3102`

No conviction-based pardon certificate is inferred.

## Identity and case record

- Full name: William Alexander Pope
- Co-defendant: Michael Anthony Pope
- District case: `1:21-cr-00128-RC`
- Court: U.S. District Court for the District of Columbia
- Judge: Rudolph Contreras
- Complaint filed: 2021-02-10
- Arrest: 2021-02-12, Topeka, Kansas
- Initial indictment: 2021-02-17
- Superseding indictment: 2021-11-10
- Full indictment dismissed with prejudice: 2025-01-21
- Verified plea: none
- Verified conviction: none
- Verified sentence: none

## Native source 1 — February 17, 2021 indictment

- Archive slug: `william-pope-federal-indictment-2021-02-17`
- Canonical source: `https://www.justice.gov/usao-dc/case-multi-defendant/file/1379096/download`
- Canonical-URL SHA-256: `ffb5520c30eaa1a211ef3c7586970546640dc6442534a373095a58f0769437f3`
- Capture timestamp: 2026-07-25T19:05:00Z
- HTTP status: 200
- MIME: `application/pdf`
- Pages: 4
- Size: 112,733 bytes
- PDF version: 1.7
- Encryption: none
- Native-file SHA-256: `1bebc82d72baa4447d81a1ee5bf99dc0b7d61ae93dcd0a81b4b36b97ec2f28d0`
- Capture status: downloaded, rendered, visually reviewed, and byte-hashed
- Persistent repository-controlled binary: pending

The indictment charges William and Michael Pope in eight counts. It is a charging instrument and does not establish guilt. The prosecution was later dismissed with prejudice before trial.

## Source 2 — July 28, 2025 post-dismissal memorandum opinion

- Archive slug: `william-pope-post-dismissal-discovery-sanctions-opinion-2025-07-28`
- CaseMine text: `https://www.casemine.com/judgement/us/688b067411e740672fb31f13`
- CaseMine canonical-URL SHA-256: `ee355b413481d554be15e42343a1a712835dd6f6986524a311179861514c84f4`
- Leagle cross-check: `https://www.leagle.com/decision/infdco20250729d24`
- Leagle canonical-URL SHA-256: `c0c085bc59a39494c025bf859071dfd77e1a011ea2a809978b10c5adb258e692`
- Court: U.S. District Court for the District of Columbia
- Judge: Rudolph Contreras
- Decision date: 2025-07-28
- Referenced filings: ECF Nos. 312, 391, 392, and 393
- Capture status: full HTML opinion text reviewed in two independent public legal mirrors
- Verification status: judicial opinion text verified; official PACER/RECAP or court-hosted PDF and native-file hash pending

The court:

- denied Pope’s motion for additional production
- granted the government’s motion for return of sensitive materials
- denied Pope’s sanctions motions
- treated the January 21 dismissal with prejudice as ending the criminal proceeding

### Material correction preserved

The opinion says the government acknowledged that a filing inaccurately stated Pope assaulted officers and called the language a drafting error. The government reportedly offered to amend the filing. The archive preserves that narrow correction without extending it into a broader exculpatory finding.

### Missing arrest body-camera record

The opinion recounts Pope’s argument regarding Topeka Police Department arrest footage. It says the footage was deleted on February 12, 2024 under the department’s normal three-year retention policy and concludes the record did not show prosecutorial bad faith. Pope’s missing-evidence allegation and the judicial holding remain separately attributed.

## Source 3 — D.C. Circuit appeal docket

- Archive slug: `william-pope-dc-circuit-appeal-25-3102`
- Canonical source: `https://dockets.justia.com/docket/circuit-courts/cadc/25-3102`
- Canonical-URL SHA-256: `81445f38f540137389ff2194cb075e2c6f2a5347d6f8c318b63ccd827a6ed7b7`
- Appeal number: `25-3102`
- Filed: 2025-10-15
- Public mirror last retrieved: 2026-03-17
- Capture status: public HTML docket entries reviewed
- Verified entries: notice of appeal, 35-page appellant brief filed in February 2026, and March 17 briefing order
- Limitation: the mirror warns that a newer PACER docket may exist
- Current final appellate outcome: not verified

The archive does not infer that later briefs were filed or that the D.C. Circuit has issued an opinion, judgment, or mandate.

## Clemency and dismissal source

- Existing archive record: `january-6-clemency-proclamation-2025-01-20`
- White House URL: `https://www.whitehouse.gov/presidential-actions/2025/01/granting-pardons-and-commutation-of-sentences-for-certain-offenses-relating-to-the-events-at-or-near-the-united-states-capitol-on-january-6-2021/`
- Canonical-URL SHA-256: `9011e82ef05ed398746ddceca09a762068cf733b1440e13fa45790e25fe3fda1`
- Relevant provision: direction to pursue dismissal with prejudice of pending January 6 indictments
- Classification: pending-case dismissal directive, not a verified conviction-based pardon certificate

## DOJ legacy archive source

- Source page: `https://www.justice.gov/usao-dc/capitol-breach-cases`
- Canonical-URL SHA-256: `7f66dcc30bef01079f32c70299faa64fe0c0e168ee3cfa3ec6c874f7997d5f08`
- Archived DOJ record ID: `d8afafa1-ff65-4a0c-8b89-917f08076f50`
- DOJ slug: `pope-william-alexander`
- Wayback source: `https://web.archive.org/web/20231201000000id_/https://www.justice.gov/usao-dc/capitol-breach-cases`
- Limitation: DOJ legacy status text was last labeled January 3, 2022 and did not contain the 2025 dismissal or later appeal

## Database changes

The `case_people` record was updated with:

- complete case number and judge
- corrected structured role
- no-conviction/no-sentence disposition
- eight allegation-labeled charge entries
- substantial 6,965-character original summary
- factual FAQ
- source/editorial boundary
- internal links to the indictment, opinion, appeal, proclamation, and Michael Pope profile
- evidence-submission priorities
- photograph and reuse-rights boundary

Connected source records increased from 2 to 6, including the shared clemency proclamation.

Connected timeline events increased from 0 to 7:

1. `william-pope-complaint-filed-2021-02-10`
2. `william-pope-arrested-2021-02-12`
3. `william-pope-indicted-2021-02-17`
4. `william-pope-superseding-indictment-2021-11-10`
5. `william-pope-case-dismissed-with-prejudice-2025-01-21`
6. `william-pope-post-dismissal-ruling-2025-07-28`
7. `william-pope-appeal-filed-2025-10-15`

The indictment was also connected to Michael Anthony Pope. The dismissal event was connected to Donald J. Trump only in his documented role as the president issuing the pending-case dismissal directive.

## Submission review

The following sources were checked for items created after the latest completed J6 publishing commit at 2026-07-25T18:19:34Z:

- `case_tips`
- `intake_items`
- `j6_upload_queue`
- `pending_imports`

No new records appeared in that interval.

Two earlier Pope-related social records remain connected:

- a user-submitted native X URL whose text and media remain uncaptured
- a secondary-mirror record of a public statement attributed to Pope

No substantive claim was inferred from the uncaptured X post.

## Photograph and media boundary

No photograph was copied or installed. A provenance-cleared photograph and lawful reuse basis were not verified.

## Remaining research and capture gaps

- native complaint and FBI Statement of Facts binaries
- native November 10, 2021 superseding indictment binary and hash
- native motions dismissing Counts Two, Five, and Seven
- January 21, 2025 government dismissal motion and signed order
- official PACER/RECAP or court-hosted July 28, 2025 opinion PDF
- complete current D.C. Circuit docket
- government appellate brief, Pope reply, any oral argument, opinion, judgment, and mandate
- Topeka Police Department retention policy and deletion audit records
- persistent archive-controlled copies of native files
- authenticated native content for the submitted X post
- provenance-cleared photograph

## Editorial boundary

Charging papers contain government allegations. Pope’s motions and public statements contain his advocacy and firsthand claims. The July 28 opinion contains judicial holdings and the court’s account of party positions. The site’s editorial discussion of alleged or documented Biden-era DOJ weaponization must remain clearly separate from those source categories. No charge, dismissal, public label, or editorial description is treated as a complete judgment about William Pope’s moral character.