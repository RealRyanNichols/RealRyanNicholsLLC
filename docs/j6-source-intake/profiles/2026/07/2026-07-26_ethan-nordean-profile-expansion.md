# Ethan Nordean J6 profile expansion

- Intake reference: `J6-PROFILE-2026-07-26-ETHAN-NORDEAN`
- Reviewed: 2026-07-26, America/Chicago
- Profile: `/case/people/ethan-nordean`
- Criminal case: *United States v. Nordean et al.*, D.D.C. No. `1:21-cr-00175-TJK`
- Separate civil action: *Tarrio v. United States*, M.D. Fla. No. `6:25-cv-00998-ALG-DCI`
- Verification summary SHA-256: `ddd54ab827f1ed376969fc3136952b3b14b3db12434b39297ce20b3db16dd14f`

## Intake and priority decision

The Ethan Nordean profile was selected because its database record still consisted primarily of inherited DOJ-list boilerplate even though the archive already contained July 2026 dismissal and civil-action records. Core arrest, verdict, sentencing, commutation, and appellate-vacatur sources were not connected to the profile, and its structured sentencing date was blank.

No newer unprocessed J6 submission was present in the public intake queue. Two June 2026 submitted YouTube links remain pending verification but do not presently identify a person-specific profile or provide sufficient provenance for this profile expansion.

## Verified procedural record

The updated profile records:

- DOJ-reported arrest: February 3, 2021
- Federal criminal case: `1:21-cr-00175-TJK`
- Judge: Timothy J. Kelly
- Jury verdict: May 4, 2023
- Sentence: September 1, 2023 — 18 years’ imprisonment and 36 months’ supervised release
- Clemency: commutation to time served on January 20, 2025
- D.C. Circuit vacatur: May 21, 2026
- District-court dismissal with prejudice: July 10, 2026
- Separate civil action: public docket reviewed through July 10, 2026; no prevailing party or relief recorded

The profile distinguishes complaint allegations, indictment charges, jury verdicts, sentencing rulings, executive clemency, appellate action, dismissal, and unresolved civil allegations. None is used as proof of moral character.

## Source ledger

| Source | Canonical URL | URL SHA-256 | Capture and verification status |
|---|---|---|---|
| DOJ arrest announcement | `https://www.justice.gov/usao-dc/pr/member-proud-boys-charged-obstructing-official-proceeding-other-charges-related-jan-6` | `6b9da38f5e9ec07ad74739b132f6a982504ac33be8a05ad5f2ed1b425b09dbf1` | Official HTML reviewed. Arrest date and complaint-stage charges verified. Conduct descriptions remain attributed allegations. Native complaint and affidavit not captured. |
| DOJ jury-verdict announcement | `https://www.justice.gov/usao-dc/pr/jury-convicts-four-leaders-proud-boys-seditious-conspiracy-related-us-capitol-breach` | `016eb007a673731038fc42202e1584c7f51cd9252dbc734a57a23b096ae6b4a0` | Official HTML reviewed. Verdict date and DOJ’s reported trial outcome verified. Government evidence descriptions remain attributed. |
| DOJ sentencing announcement | `https://www.justice.gov/usao-dc/pr/proud-boys-leaders-sentenced-prison-roles-jan-6-capitol-breach` | `75427ee72610f8bd43f24438a039759e6dab7c49569159949c47dc9d13ee6a14` | Official HTML reviewed. September 1, 2023 date, 18-year imprisonment term and 36-month supervision term verified. Signed judgment and transcript not captured. |
| Proclamation 10887 | `https://www.whitehouse.gov/presidential-actions/2025/01/granting-pardons-and-commutation-of-sentences-for-certain-offenses-relating-to-the-events-at-or-near-the-united-states-capitol-on-january-6-2021/` | `9011e82ef05ed398746ddceca09a762068cf733b1440e13fa45790e25fe3fda1` | Official White House text reviewed. Nordean is one of fourteen expressly named commutation recipients; this is not recorded as a full pardon. |
| D.D.C. ECF No. 1098 PDF | `https://storage.courtlistener.com/recap/gov.uscourts.dcd.241009/gov.uscourts.dcd.241009.1098.0.pdf` | `4f49cb7618f3395d2e5387b5158db67ddc109d889420a363921465dcf465f8a6` | Existing archive record. July 10, 2026 memorandum identifies verdict counts, April 14 government motion, May 21 appellate vacatur, and Rule 48(a) dismissal posture. Binary hash remains pending in the current archive record. |
| ECF No. 1098 public text mirror | `https://www.casemine.com/judgement/us/6a5239da6cbb1a5431bcbbf6` | `b24339a94e1f2875319f427d389a0c4ba2da77266355e531c2f16877dbc28bb0` | Full memorandum text reviewed. It specifically cites D.C. Circuit No. `23-3159`, docket No. `2174532`, dated May 21, 2026. Native appellate order not captured. |
| Civil docket status | `https://clearinghouse.net/case/48074/` | `7241ebae24b234be5760e9d160b924b11f5fc4f03e4ddbcdb3b8ce4e9a2a1456` | Existing archive record. Docket reviewed through July 10, 2026; civil allegations remain unresolved claims. |

## Archive records created or connected

Created:

- `/case/documents/ethan-nordean-doj-arrest-announcement-2021-02-03`
- `/case/documents/ethan-nordean-doj-sentencing-announcement-2023-09-01`
- `/case/documents/nordean-dc-circuit-vacatur-docket-reference-2026-05-21`
- `/case/events/ethan-nordean-arrested-2021-02-03`
- `/case/events/ethan-nordean-jury-verdict-2023-05-04`
- `/case/events/ethan-nordean-sentenced-2023-09-01`
- `/case/events/ethan-nordean-sentence-commuted-2025-01-20`
- `/case/events/proud-boys-judgments-vacated-2026-05-21`

Connected:

- Existing DOJ verdict record
- Existing general Proclamation 10887 record
- Existing July 10, 2026 dismissal memorandum and event
- Existing civil-action filings and events

The shared May 21 vacatur document and event were connected to Ethan Nordean, Joseph Biggs, Zachary Rehl, and Dominic Pezzola because the cited appellate action affected all four judgments.

## Profile and search improvements

The profile now includes:

- A substantial original procedural summary
- Clear allegation, verdict, sentence, clemency, appellate, dismissal, and civil-action sections
- FAQ-style factual explanations
- Correct commutation-versus-pardon distinction
- Correct sentencing date and terms
- Schema-ready court, judge, arrest, charges, sentence, disposition, and clemency facts
- Related-profile links
- Case Nexus, source-submission, and correction paths
- Updated title/description inputs through the person record
- Canonical and social metadata supplied by the existing profile renderer
- Refreshed database timestamp for sitemap generation

## Verification boundaries and remaining gaps

Still needed:

- Native complaint and FBI affidavit
- Charging instruments and verdict form
- Signed judgment and Statement of Reasons
- Trial and sentencing transcripts
- Complete D.C. Circuit docket, April 14 motion, May 21 order, and mandate
- Archive-controlled binary and SHA-256 for ECF No. 1098
- Complete current civil docket and later rulings
- Authenticated firsthand interview or public statement
- Photograph with verified provenance and lawful reuse rights

The shared profile renderer still displays portions of Markdown as plain preformatted text. No global renderer change was made during this person-specific intake.

No Google indexing, traffic, or ranking result is claimed.