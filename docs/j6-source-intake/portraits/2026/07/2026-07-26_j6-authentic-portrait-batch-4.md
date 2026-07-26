# J6 authentic portrait backfill — batch 4

## Scope

This batch replaces four face-free “Portrait Needed” archive cards with authentic photographs whose identity and publication rights were verified together. It does not change an article, global layout, menu, URL or unrelated record.

Every database update requires all of the following pre-existing values:

- `is_j6_defendant = true`
- `photo_is_placeholder = true`
- `photo_identity_status = 'placeholder'`
- `photo_rights_status = 'portrait-needed'`
- no existing `photo_url`

That guard prevents the migration from overwriting a better or concurrently verified image.

## Verified portraits

| Profile | Source and identity evidence | Independent case corroboration | Rights basis | Original | Published derivative |
|---|---|---|---|---|---|
| Zachary Rehl | [Rhea Ball / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Zach_Rehl_-_Leader_of_the_Philly_Proud_Boys_(50558087973)_(cropped).jpg) identifies the subject as Zach Rehl, leader of the Philadelphia Proud Boys, at a November 1, 2020 event | [DOJ’s August 31, 2023 sentencing release](https://www.justice.gov/usao-dc/pr/two-leaders-proud-boys-sentenced-prison-seditious-conspiracy-and-other-charges-related-us) independently identifies Zachary Rehl of Philadelphia and the archive links him to case `1:21-cr-175` | Rhea Ball, CC BY 2.0 | 1940×1941 JPEG; SHA-256 `c8d94b528cf89b3491fa66aaa063108b9a10f9c6109cf3ecd14bb740e5d84b91` | 800×800 JPEG; SHA-256 `108df043cfb88791ce5a47db31d5ded27ca1063d485f992f57afb19c1e9ec9ca` |
| Jeremy Bertino | [Anthony Crider / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Proud_Boy_Jeremy_Bertino_wearing_a_Right_Wing_Death_Squad_(RWDS)_patch_in_Raleigh_(2020_Nov)_(3x4_cropped).jpg) identifies Jeremy Bertino at a Raleigh event on November 28, 2020 | [DOJ’s October 6, 2022 plea release](https://www.justice.gov/usao-dc/pr/former-leader-proud-boys-pleads-guilty-seditious-conspiracy-efforts-stop-transfer-power) independently identifies Jeremy Bertino and the archive links him to case `1:22-cr-329` | Anthony Crider, CC BY 2.0 | 3600×4806 JPEG; SHA-256 `0ceeac01ff5ea5828d11db64932fcad91964dd9eb9d408241edb0d3f229c1a2c` | 800×1068 JPEG; SHA-256 `57835798bfdb99f09631115bf1cc3433e2a07bdd130b7dd7a2593b8e423ef412` |
| Jay James Johnston | [D.C. police body-camera still / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jay_Johnston_Capitol-riot-actor-arrested.jpg) identifies Johnston in the Capitol crowd on January 6, 2021 | [DOJ’s June 7, 2023 arrest release](https://www.justice.gov/usao-dc/pr/california-man-arrested-felony-charge-actions-during-jan-6-capitol-breach-0) independently identifies Jay James Johnston as FBI AFO/BOLO 247 and the archive links him to magistrate case `23-mj-00115` | Metropolitan Police Department of the District of Columbia work; public domain/CC0 | 780×439 JPEG; SHA-256 `f923530dd238374b6b5b4a7866d55f72e768cae68645057c89aee9ed5ab4aa2b` | 780×439 metadata-stripped JPEG; SHA-256 `309cdf089b68926f1c25762d44a469efaf54db754b3cb1c46bdeaa63d72d35b6` |
| Joseph Hackett | [Pinellas County Sheriff booking photograph / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Joseph_Hackett_Mugshot.jpg) names Joseph Hackett and categorizes the record with the Oath Keepers | [DOJ’s June 3, 2021 arrest release](https://www.justice.gov/usao-dc/pr/four-arrested-sixteen-defendant-oath-keeper-conspiracy-case-activities-leading-us-capitol) independently identifies Joseph Hackett of Florida and the archive links him to case `1:22-cr-00015-APM` | Pinellas County Sheriff public record; Wikimedia Commons `PD Florida` | 828×1055 JPEG; SHA-256 `8a315e33290580bbd35ce4e423863ec7a9f45a4b08a155348164522a1d111a07` | 800×1019 metadata-stripped JPEG; SHA-256 `7145a5784ce44a3260a0e2528fd4d1a34058549dab7a32ded830b223b8e0bec5` |

## Preserved date discrepancy

Wikimedia Commons records May 26, 2021 for the Joseph Hackett booking photograph, while DOJ says Hackett was arrested on May 28, 2021. The archive preserves both dates and does not infer why they differ.

## Withheld candidate and resume cursor

Kyle Fitzsimons was reviewed from a 14-minute, 52-second United States Capitol Police evidence video released in his case and hosted by Wikimedia Commons as a public-domain federal work. The video is case-linked and rights-cleared, but the reviewed frames do not provide a clear, individually verifiable portrait. No frame was extracted for publication.

Resume the next batch after this reviewed Fitzsimons candidate, prioritizing remaining high-traffic archive cards and then rights-unclear or incomplete-provenance records. The previously withheld Rachel Powell, Robert Keith Packer, Klete Keller, Richard Barnett, Olivia Pollock, Jonathan Pollock, Jessica Watkins, Guy Reffitt, Julian Khater and Jake Lang candidates remain withheld unless materially better identity-and-rights evidence appears.
