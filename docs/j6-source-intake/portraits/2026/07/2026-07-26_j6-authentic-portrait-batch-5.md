# J6 authentic portrait backfill — batch 5

## Scope

This batch replaces one face-free “Portrait Needed” archive card with an authentic portrait whose identity and publication rights were verified together. It does not change an article, global layout, menu, URL or unrelated record.

The database update requires all of the following pre-existing values:

- `is_j6_defendant = true`
- `photo_is_placeholder = true`
- `photo_identity_status = 'placeholder'`
- `photo_rights_status = 'portrait-needed'`
- no existing `photo_url`

Those guards prevent the migration from overwriting a better or concurrently verified image.

## Verified portrait

| Profile | Source and identity evidence | Independent case corroboration | Rights basis | Original | Published derivative |
|---|---|---|---|---|---|
| Josiah Kenyon | The [FBI AFO #94 evidence video](https://commons.wikimedia.org/wiki/File:Capitol-violence-94-afo-010621.ogv) consistently labels the pictured person `BOLO #94`; the published derivative is cropped from the portrait inset shown at approximately 00:10 | [DOJ’s December 3, 2021 arrest release](https://www.justice.gov/usao-dc/pr/nevada-man-arrested-assault-law-enforcement-during-jan-6-capitol-breach) states that the FBI identified Josiah Kenyon as #94; [DOJ’s April 11, 2023 sentencing release](https://www.justice.gov/usao-dc/pr/nevada-man-sentenced-assaulting-officers-during-jan-6-capitol-breach) independently repeats the #94 identification; the archive links him to case `1:21-cr-726` | FBI-authored federal work; Wikimedia Commons marks the complete video public domain under 17 U.S.C. § 105 | 1920×1080 OGV; 55.317 seconds; SHA-256 `e5d89ce1cd72992c0c46bd298e46f61e92885f1e2efef3e9c8f2acdabffa1453` | 286×468 JPEG crop; metadata stripped; SHA-256 `e72d21b2d78d82b38072e1feef8c5cd0f7fc7394872b38e25de9a1aaa8707416` |

The profile photograph is not presented as a booking photograph or a new portrait session. It is accurately credited as a crop from the FBI’s AFO #94 evidence-video composite.

## Withheld candidates and resume cursor

Julian Khater was reviewed from two United States Capitol Police body-camera videos hosted by Wikimedia Commons as public-domain federal works. The video captions identify Khater and use a red arrow to track him, and DOJ separately identifies him as FBI seeking-information photograph #190. The reviewed frames show him too far from the camera for a truthful profile portrait, so no image was extracted.

The documentary press package reviewed in this pass offered posters, banners, logos and a trailer, but no individually captioned portrait assets with reuse terms specific enough for a profile. No image was imported from it.

Rachel Powell’s Commons file was also re-reviewed. Its uploader describes a 2022 arrest image as the uploader’s own work but gives an April 30, 2024 creation date and no official source or identity chain. The conflict leaves both authorship and identity provenance unclear, so it remains withheld.

Robert Keith Packer’s Commons file identifies the subject through a Western Tidewater Regional Jail handout, but applies a federal public-domain rationale to a regional jail image. Because the stated rights rationale does not match the creator, it remains withheld.

Resume the next batch after Josiah Kenyon, prioritizing remaining high-traffic archive cards and then rights-unclear or incomplete-provenance records. Kyle Fitzsimons, Rachel Powell, Robert Keith Packer, Klete Keller, Richard Barnett, Olivia Pollock, Jonathan Pollock, Jessica Watkins, Guy Reffitt, Julian Khater and Jake Lang remain withheld unless materially better identity-and-rights evidence appears.
