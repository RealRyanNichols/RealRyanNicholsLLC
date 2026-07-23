# Oath Keepers native case-file endpoints — NACDL case tracker

- **Intake reference:** `J6-COURT-2026-07-23-OATH-KEEPERS-NACDL-NATIVE-FILES`
- **Case:** *United States v. Rhodes, III, et al.*, No. `1:22-cr-00015-APM`
- **Court:** U.S. District Court for the District of Columbia
- **Capture time:** 2026-07-23T17:08:46Z
- **Verification status:** `verified_professional_case_tracker_direct_pdf_endpoints_binary_preservation_partial`
- **Public status:** `published_source_bundle`

## Meaningful addition

The National Association of Criminal Defense Lawyers' public case tracker now exposes direct PDF endpoints for six high-value docket filings that the archive previously listed as native-file capture targets:

1. ECF No. 1 — initial indictment, filed January 12, 2022 — 48 pages reported by the web capture layer.
2. ECF No. 167 — superseding indictment, filed June 22, 2022 — 44 pages reported.
3. ECF No. 410 — first-trial verdict form for Stewart Rhodes, Kelly Meggs, Kenneth Harrelson, Jessica Watkins, and Thomas Caldwell.
4. ECF No. 450 — second-trial verdict form for Roberto Minuta, Joseph Hackett, David Moerschel, and Edward Vallejo.
5. ECF No. 967 — government's May 22, 2026 unopposed Rule 48(a) motion to dismiss the indictment with prejudice.
6. ECF No. 976 — Judge Amit P. Mehta's May 29, 2026 order deferring a ruling and requiring a government supplement by June 5, 2026.

ECF No. 976 was parsed in full by the web capture layer. The order states that the government's motion offered little more than a conclusory statement that dismissal served the interests of justice. Citing *United States v. Ammidown*, the court required a statement of reasons and an underlying factual basis before acting. This was a procedural deferral, not a denial or final dismissal.

## Canonical source and direct endpoints

| Record | URL | URL SHA-256 | Capture status |
|---|---|---|---|
| NACDL case tracker | https://www.nacdl.org/brief/United-States-v-Rhodes%2C-III%2C-et-al | `be1fa4976cb027c49b381babbbd42957088063b9094477403399d3d7d3b5a1d8` | Verified HTML case-file index |
| ECF 1 | https://www.nacdl.org/getattachment/1199b86a-20e9-4b36-a093-6876159fa4f4/a-gov-uscourts-dcd-239207-1-0.pdf | `4000ac816e41daf588d8d01924ea21819915a3cd44d714c207be3599bacb1796` | PDF endpoint verified; 48 pages reported; binary hash pending |
| ECF 167 | https://www.nacdl.org/getattachment/d2165508-4d73-44ae-934d-1dce3b14af36/b-gov-uscourts-dcd-239207-167-0.pdf | `5367839f13d469bc67a8ec667cb6cc9cf2f38648d5e45f66f0fa657c0bdebb9d` | PDF endpoint verified; 44 pages reported; binary hash pending |
| ECF 410 | https://www.nacdl.org/getattachment/6124ad5b-a3a8-4149-ad8d-1e44579a7108/c-gov-uscourts-dcd-239207-410-0.pdf | `c7172842746aae1ffd394ec8ed784a3a10f5522543c57e6869f9b6e50a845c06` | Direct endpoint preserved; web cache miss; binary pending |
| ECF 450 | https://www.nacdl.org/getattachment/05844d1a-1b4c-4d15-a98f-bfde7bb6b5a4/d-gov-uscourts-dcd-239207-450-0.pdf | `7596099d7bb99a8d13ecf46131f8523c486a96ed4da88ceed89d3f0619671dbd` | Direct endpoint preserved; web cache miss; binary pending |
| ECF 967 | https://www.nacdl.org/getattachment/baa11489-3125-4452-be70-f5e213b96ed6/g-gov-uscourts-dcd-239207-967-0.pdf | `5843f876879465ca2f7123100ad48a9dad3d50d7e4c1db86b0421fa8d89664a3` | Direct endpoint preserved; web cache miss; binary pending |
| ECF 976 | https://www.nacdl.org/getattachment/9f732b65-77aa-4af3-a6ed-c959f0ac8275/h-gov-uscourts-dcd-239207-976-0.pdf | `2270869a318359225afd5264c7b9e3849e1e835c5029cd6f1e2dbf7b9a872c7b` | PDF endpoint and two-page text verified; local binary hash pending |

## Related profiles

The indictment and superseding indictment concern Stewart Rhodes, Kelly Meggs, Kenneth Harrelson, Jessica Watkins, Thomas Caldwell, Roberto Minuta, Joseph Hackett, David Moerschel, Edward Vallejo, Joshua James, and Brian Ulrich. The first-trial verdict form is connected only to the five defendants identified in its title. The second-trial verdict form is connected only to the four defendants identified in its title. ECF Nos. 967 and 976 concern Rhodes, Meggs, Harrelson, Watkins, Minuta, Hackett, Moerschel, and Vallejo.

## Editorial and verification boundaries

- Indictments contain government allegations, not findings of guilt.
- Verdict forms record jury dispositions but do not define a person's moral character.
- ECF No. 967 was a government request for dismissal, not a final order.
- ECF No. 976 deferred decision and required more information; it did not deny the motion on the merits.
- No later final Oath Keepers dismissal order was verified during this capture.
- No unsupported exculpatory or person-specific claim was inferred from an unavailable PDF.

## Capture failures and next actions

The web layer could open ECF Nos. 1, 167, and 976, but the runtime used for local preservation encountered DNS-resolution failure for `www.nacdl.org`. ECF Nos. 410, 450, and 967 also returned web cache misses. Therefore:

- Native binaries are not yet committed to repository storage.
- File-byte SHA-256, byte size, MIME-header verification, and embedded metadata remain pending.
- ECF No. 967 still requires full-text review.
- Any government supplement filed after ECF No. 976 and any final district-court disposition remain priority targets.

## Integrity

Verified-summary SHA-256: `a7d38483f47ffa0c1441309a6f582fa9852d2d68a8fc949c9e023fe1d1c0b458`
