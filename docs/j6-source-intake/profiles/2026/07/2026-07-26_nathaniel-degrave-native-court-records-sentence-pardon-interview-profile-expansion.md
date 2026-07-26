# Nathaniel J. DeGrave — native court records, sentence, pardon, and interview profile expansion

**Intake date (UTC):** 2026-07-26T13:27:00Z  
**Intake reference:** `J6-PROFILE-2026-07-26-NATHANIEL-DEGRAVE`  
**Profile slug:** `nathaniel-degrave`  
**Initial district case:** *United States v. DeGrave*, No. `1:21-cr-00090-PLF`  
**Superseding case:** *United States v. Sandlin et al.*, No. `1:21-cr-00088-DLF`

## Material corrections

This pass corrected several stale or incomplete profile fields:

- Plea date corrected from **June 25, 2022** to **June 27, 2022**.
- Case history now distinguishes the initial `1:21-cr-00090-PLF` matter from the later superseding case `1:21-cr-00088-DLF`.
- Judge fields now distinguish Judge Paul L. Friedman in the initial case from Judge Dabney L. Friedrich at plea and sentencing.
- The prior `$50,000` fine statement was removed. Contemporary reporting supports a **$25,000 fine**.
- Sentence date and terms were added, but remain labeled as reported pending capture of the signed judgment and sentencing transcript.
- The unsupported role “J6 co-defendant / Sibick witness” was replaced with “January 6 case-file subject.”
- `C-2B pod, DC DOC` was removed from the agency field; a detention location is not an employer or agency affiliation.
- The January 20, 2025 clemency record was clarified as a full pardon under the proclamation’s general pardon provision, not one of the fourteen named commutations.

## Native court records preserved

All five PDFs were downloaded, text-extracted, rendered, and visually reviewed. The archive database preserves their canonical URLs, URL hashes, native-file hashes, file sizes, page counts, MIME types, capture timestamps, and verification boundaries.

| Record | Date | Pages | Bytes | Native SHA-256 | Canonical URL SHA-256 |
|---|---:|---:|---:|---|---|
| FBI Statement of Facts | 2021-01-28 | 10 | 878,633 | `7511197e1cfd82e03abbea2a79b078c470278eb5ed954a34b2c46737f11e73a7` | `3b42e3a7e47fa3eae3ddff43dbbb13c6d26377fdbd62638063c29c2df4e82ed4` |
| Initial indictment | 2021-02-05 | 4 | 148,887 | `5174ac6c0b9b1f4d9714b59e3e48d16686cad7163d0e97425059bf6d173ea812` | `a2e3aa119dfecfde159121c04102533d3740d3cd2dd93e1484691ef9dad6457d` |
| Superseding indictment | 2021-09-15 | 15 | 903,604 | `d94605a317a16747547efbfc110ef49e6d0794c6c04b82329f57d3c9cedc5b9d` | `eec6a87bf19e5622efa4bf0e8c5b9168861cfaa89f45371bb8bd49fc7e47da77` |
| Plea agreement | 2022-06-27 | 14 | 660,223 | `e9a97d64283776e0edcca8b94206f886f301403afc9ed9b1a79591e0fd09a57d` | `113f783cd1a93f30675d7968214d29bd37745a86909f6cb683209bbc8ba17e21` |
| Statement of offense | 2022-06-27 | 13 | 466,193 | `93b86ecce53999377bd4257cae7fb68e5c412fb58e4db7f5461314fed6824141` | `ff6bf923f4a1d9a46b0a943fe86ec90611ea2f244be949673a69993478ad8d50` |

Each PDF was unencrypted and identified as `application/pdf`. Persistent archive-controlled binary storage remains pending; the current records point to the GWU Program on Extremism public court-file mirror.

## Additional verified sources

### DOJ plea announcement

- **Date:** 2022-06-27
- **Canonical URL SHA-256:** `06ab9ee4dd8d8eb287c246b02db949ef831e0a884b238bc9220ad491c71fa1a5`
- **Capture status:** canonical DOJ page reviewed
- **Verified:** arrest date, plea date, two plea offenses, and stated cooperation agreement
- **Boundary:** DOJ conduct descriptions remain attributed government characterizations

### Sentencing reporting

Two contemporary reports were preserved because their weekday wording is not fully consistent:

- **CBS News canonical URL SHA-256:** `9e8d2670964cfd489230a916609cfb28c0f1bd6eed5cd11a7f7998f0ba9d6cf7`
- **Associated Press / Las Vegas Review-Journal canonical URL SHA-256:** `3ffc3eee8d901ed13c4e5254a5a1cfccfec641d9fe8af2544a14dd0d5d2cc46e`

The structured archive uses **May 10, 2023**, consistent with the AP account. Reported terms are 37 months’ imprisonment, 36 months’ supervised release, a $25,000 fine, and $2,000 restitution. The signed judgment and sentencing transcript remain controlling-source capture priorities.

### Post-pardon interview listing

- **Show:** *The Connect with Johnny Mitchell*
- **Publisher date:** 2025-01-29
- **Listed runtime:** approximately 1 hour 20 minutes
- **Canonical URL SHA-256:** `3f447f146e270aef6735060c3ba3ec9c3ab5eabae213e72da81c82a5a6a048b7`
- **Capture status:** publisher catalog page and episode description reviewed; native audio not captured
- **Verification status:** guest identity, date, show, runtime, and listed topics verified
- **Boundary:** exact quotations, context, and timestamps remain unverified until native audio or a complete transcript is captured

## Supabase archive changes

Created or refreshed nine source records:

- `nathaniel-degrave-fbi-statement-of-facts-2021-01-28`
- `nathaniel-degrave-initial-indictment-2021-02-05`
- `nathaniel-degrave-superseding-indictment-2021-09-15`
- `nathaniel-degrave-plea-agreement-2022-06-27`
- `nathaniel-degrave-statement-of-offense-2022-06-27`
- `nathaniel-degrave-doj-plea-announcement-2022-06-27`
- `nathaniel-degrave-cbs-sentencing-report-2023-05-10`
- `nathaniel-degrave-ap-sentencing-report-2023-05-10`
- `nathaniel-degrave-post-pardon-interview-2025-01-29`

The shared `january-6-clemency-proclamation-2025-01-20` record was connected rather than duplicated.

Created seven timeline events covering arrest, initial indictment, superseding indictment, plea, sentence, pardon, and the post-pardon interview. Related-source links were also added to Ronnie Sandlin and Josiah Colt where the underlying records name them.

The profile now has 13 connected source records and seven timeline events. Its substantial original description is 4,860 characters with SHA-256:

`4a87dc7bcecd49c0b65b62dc89a62ba9b3d97c0c154ffaa5ca60e46d6d8b0602`

## Editorial and verification boundaries

- FBI affidavits and indictments are labeled as allegations or probable-cause positions.
- The plea agreement and statement of offense are treated as the admitted plea record.
- The reported sentence remains distinct from a captured signed judgment.
- DeGrave’s detention letters and interview statements remain attributed firsthand accounts.
- The pardon is identified as clemency, not a trial acquittal or appellate reversal.
- The site’s editorial analysis concerning alleged or documented DOJ weaponization is kept separate from the source record.
- No charge, plea, sentence, pardon, or media label is treated as proof of moral character.

## Remaining research and capture gaps

- Signed judgment and Statement of Reasons
- Sentencing memoranda and sentencing transcript
- Complete current PACER or RECAP docket
- Final count-by-count dismissal record
- Bureau of Prisons custody and release chronology
- Individual pardon certificate, if requested and issued
- Native post-pardon interview audio and complete transcript
- Archive-controlled copies of the captured court PDFs
- Photograph with verified provenance and lawful reuse rights

No Google indexing, traffic, or ranking result is claimed.
