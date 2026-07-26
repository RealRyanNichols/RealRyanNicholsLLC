# Alan Michael St. Onge — court record, sentence, pardon, and profile expansion

**Intake date (UTC):** 2026-07-26T14:13:45Z  
**Intake reference:** `J6-PROFILE-2026-07-26-ALAN-MICHAEL-ST-ONGE`  
**Profile slug:** `alan-onge`  
**District case:** *United States v. St. Onge*, No. `1:23-cr-00237-CJN`  
**Initial magistrate reference:** `23-mj-111`

## Material corrections

This pass corrected the archive’s controlling case number and completed the structured procedural record:

- Full name standardized as **Alan Michael St. Onge**.
- Primary case number corrected from the complaint-stage magistrate reference `23-mj-111` to district case `1:23-cr-00237-CJN`.
- Judge identified as **Carl J. Nichols**.
- Arrest date added: June 16, 2023.
- Plea date added: January 31, 2024.
- Sentence date added: July 9, 2024.
- Sentence added: 18 months’ imprisonment, 36 months’ supervised release, and $2,000 restitution.
- Clemency clarified as a **full pardon**, not one of the proclamation’s fourteen named commutations.
- Unsupported or overly broad role language was replaced with “January 6 case-file subject.”
- An unverified complaint-filing date inherited from the earlier skeletal profile was removed rather than repeated without a controlling docket source.

The profile now expressly distinguishes complaint allegations, admitted plea facts, government sentencing advocacy, the sentence imposed, and executive clemency.

## Sources preserved

### DOJ arrest announcement

- **Date:** 2023-06-16
- **Canonical URL:** https://www.justice.gov/usao-dc/pr/north-carolina-man-arrested-felony-and-misdemeanor-charges-actions-during-jan-6-capitol
- **Canonical URL SHA-256:** `fa3fbe0550c19c8a252a8293b1f222f8186823d432da69172ebd8622d0ca5926`
- **Capture status:** canonical DOJ HTML reviewed
- **Verified:** identity, arrest date and location, complaint-stage charge list
- **Boundary:** conduct descriptions remain government probable-cause allegations; DOJ states that a complaint is an allegation and a defendant is presumed innocent unless proven guilty

### DOJ plea announcement

- **Publisher date:** 2024-02-01
- **Plea date stated by source:** 2024-01-31
- **Canonical URL:** https://www.justice.gov/usao-dc/pr/three-men-plead-guilty-felony-charges-actions-during-jan-6-capitol-breach
- **Canonical URL SHA-256:** `7ee3f96ede6127a1b238a7343df825591f8c58419a190451da833b8843733087`
- **Capture status:** canonical DOJ HTML reviewed
- **Verified:** plea date, two felony civil-disorder counts, Judge Carl J. Nichols
- **Boundary:** source descriptions of conduct remain attributed to DOJ and the referenced court records

### Government sentencing memorandum, ECF No. 142

- **Filed:** 2024-05-10
- **Canonical URL:** https://storage.courtlistener.com/recap/gov.uscourts.dcd.257661/gov.uscourts.dcd.257661.142.0.pdf
- **Canonical URL SHA-256:** `5cef1a6d4d3b2b18dd28a6bd53f59bb5290e62df51f8988cdd2de38cef6b7777`
- **Native PDF SHA-256:** `75c7b8f263116ba841f257899f793951a07c7536df5401d4f62f850f6190473d`
- **Pages:** 24
- **Bytes:** 2,344,740
- **MIME:** `application/pdf`
- **PDF version:** 1.6
- **Encryption:** none
- **Capture status:** downloaded, text-extracted, rendered at 120 DPI, and visually reviewed
- **Verified:** caption, case number, filing number/date, prosecutor Sean P. McCauley, reference to ECF No. 101, May 8, 2024 government interview, and requested sentence
- **Government request:** 21 months’ imprisonment, three years’ supervised release, $2,000 restitution, and a $200 special assessment
- **Boundary:** this is prosecution advocacy, not the sentence ultimately imposed; its factual narrative, Guidelines analysis, comparisons, and requested punishment remain attributed government positions

### DOJ sentencing announcement

- **Publisher date:** 2024-07-10
- **Sentence date stated by source:** 2024-07-09
- **Canonical URL:** https://www.justice.gov/usao-dc/pr/three-men-sentenced-felony-charges-actions-during-jan-6-capitol-breach
- **Canonical URL SHA-256:** `3bd9bdbd9a66c38cffe558ac5ac77ac87d4cc88fa459757f2e34ed130cb17dba`
- **Capture status:** canonical DOJ HTML reviewed
- **Verified sentence:** 18 months’ imprisonment, 36 months’ supervised release, and $2,000 restitution
- **Boundary:** signed judgment and sentencing transcript remain controlling-source capture priorities; no unlisted condition or assessment was inferred

### Office of the Pardon Attorney recipient record

- **Canonical URL:** https://www.justice.gov/pardon/freedom-information-act-foia-release-pardon-certificate-recipients
- **Canonical URL SHA-256:** `3186b7a5a6c73ffca231aaccd067418e5f05283ae13582d8434a3647dc55d4c3`
- **Exact public entry:** `ST.ONGE, ALAN MICHAEL`
- **Capture status:** official recipient page reviewed
- **Verified:** recipient identity and that a certificate was requested and issued
- **Boundary:** individual certificate PDF and person-specific wording remain uncaptured

### Shared clemency proclamation

The existing archive record `january-6-clemency-proclamation-2025-01-20` was connected rather than duplicated. St. Onge is not among the fourteen named commutation recipients and therefore falls within the proclamation’s separate full-pardon provision for covered convictions.

## Supabase archive changes

Created five source records:

- `alan-st-onge-doj-arrest-announcement-2023-06-16`
- `alan-st-onge-doj-plea-announcement-2024-02-01`
- `alan-st-onge-government-sentencing-memorandum-2024-05-10`
- `alan-st-onge-doj-sentencing-announcement-2024-07-10`
- `alan-st-onge-pardon-certificate-recipient-record-2025`

Created five timeline events:

- `alan-st-onge-arrested-2023-06-16`
- `alan-st-onge-pleads-guilty-2024-01-31`
- `alan-st-onge-government-sentencing-memo-filed-2024-05-10`
- `alan-st-onge-sentenced-2024-07-09`
- `alan-st-onge-full-pardon-2025-01-20`

The shared DOJ plea and sentencing sources were also connected to Kyle Kumer and William Stover because those records name all three men. The profile now has six connected source records, including the shared proclamation, and five timeline events.

The substantial original profile description is 6,654 characters with SHA-256:

`23f9585af8954464345f643d7cf10174a8baaba6bec0a7b14ebf56ac22cfa7e8`

Verified summary SHA-256:

`4ce553f07d2dfaf6bd40c0888d3ab5ca1b78aa040844d1554f07da8d723e3be7`

## Search and editorial improvements

The profile now contains:

- a natural, person-specific opening summary;
- schema-ready name, case, court, judge, arrest, plea, sentence, charge, disposition, and clemency facts;
- clear procedural headings and a factual FAQ;
- related-profile links for Kyle Kumer and William Stover;
- Case Nexus, source-document, timeline, correction, and evidence-submission links;
- a refreshed profile timestamp for sitemap generation; and
- source-versus-editorial boundaries that preserve the site’s editorial position without converting allegations or disputed descriptions into independent facts.

No photograph was reused because verified provenance and lawful reuse rights were not established.

## Remaining research and capture gaps

- Criminal complaint and native FBI affidavit
- Charging information or indictment establishing the final two-count plea posture
- Signed plea agreement and Statement of Offense, including ECF No. 101
- Defense sentencing memorandum and Presentence Report materials that may lawfully be public
- Signed judgment and Statement of Reasons
- Sentencing transcript
- Complete PACER or RECAP docket
- Bureau of Prisons custody and release chronology
- Individual pardon certificate PDF
- Authenticated firsthand interview or public statement with complete context
- Photograph with verified provenance and lawful reuse rights
- Persistent archive-controlled storage of the captured ECF No. 142 PDF

No Google indexing, traffic, or ranking result is claimed.