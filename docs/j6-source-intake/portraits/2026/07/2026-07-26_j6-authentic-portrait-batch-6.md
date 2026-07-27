# J6 authentic portrait backfill — batch 6

## Scope

This batch resumes after Josiah Kenyon and replaces one face-free “Portrait Needed” archive card with an authentic portrait whose identity and publication rights were verified together. It does not change an article, global layout, menu, URL or unrelated record.

The database update requires all of the following pre-existing values:

- `is_j6_defendant = true`
- `photo_is_placeholder = true`
- `photo_identity_status = 'placeholder'`
- `photo_rights_status = 'portrait-needed'`
- no existing `photo_url`

Those guards prevent the migration from overwriting a better or concurrently verified image.

## Verified portrait

| Profile | Source and identity evidence | Independent corroboration | Rights basis | Original | Published derivative |
|---|---|---|---|---|---|
| Mitchell Paul Vukich | Page 6 of the [FBI statement of facts](https://extremism.gwu.edu/sites/g/files/zaxdzs5746/files/Mitchell%20Paul%20Vukich%20Statement%20of%20Facts.pdf) says agents showed Vukich multiple U.S. Capitol security-camera stills during his April 26, 2021 interview and that he affirmed he was the depicted person wearing goggles and a distinctive T-shirt. The selected page-7 image is one of those stills. | The filed record identifies magistrate matter `1:21-mj-00476-GMH`; the archive separately links Vukich to criminal case `1:21-cr-00539-TSC`. [DOJ’s archived defendant page](https://www.justice.gov/usao-dc/defendants/vukich-mitchell-paul) and [contemporaneous WESA reporting](https://www.wesa.fm/courts-justice/2021-06-23/three-more-western-pennsylvanians-charged-in-jan-6-attack-on-the-u-s-capitol) independently identify Mitchell Paul Vukich and describe the Capitol-security evidence. | U.S. Capitol Police security-camera frame created in official federal duties; public domain under 17 U.S.C. § 105. GWU preserves the filed federal record. | 9-page PDF, 1,512,375 bytes, SHA-256 `966387e6b2b6453879877e6d0f7f7dd42043b43f2076021fcad647f2810656b4`; embedded 436×604 JPEG, SHA-256 `076ca1e8064d998df5b12cd22bf42d6d15d48d2a69c2404df141ea6efa611dcb` | 800×1108 color-normalized, metadata-stripped JPEG derivative, SHA-256 `0b366bdb0af4e3a815e80da202cefd838055148de69083697279b61619793aa1`; published in an accessible SVG wrapper, SHA-256 `3f0d56eb45ca9e3a31486bd8d4d0303a305546f589c039d77233d8216911f5e6` |

The image is accurately presented as a January 6, 2021 Capitol-security frame, not a booking photograph or a new portrait session.

## Withheld candidates and resume cursor

The highest-traffic unresolved queue was reviewed before taking this image:

- Frank Rocco Giustino’s available images derive from D.C. police body-camera footage or wire-service reproductions without a sufficiently clear reuse chain for a standing profile portrait.
- Andrew Alan Hernandez’s complaint reproduces a New York Times photograph, Getty footage and social-media material. Identity is strong, but those creators retain or may retain copyright.
- Scott Kevin Fairlamb’s complaint relies on D.C. police body-camera, civilian and social-media footage. None of the reviewed frames combined a clear portrait with a federal public-domain source.
- Anthony Vuksanaj’s clearest filing images come from an independently produced documentary; the Capitol-security frames are too distant for a strong portrait.
- Brian P. McCreary’s clearest filing images derive from his own or third-party video rather than a rights-cleared government camera.
- Thomas Sibick’s clear filing images derive from witness video, YouTube or D.C. police body-camera footage; no uncertain image was imported.

Resume the next batch after Mitchell Paul Vukich, continuing through remaining high-traffic archive cards before lower-traffic records. The previously withheld Kyle Fitzsimons, Rachel Powell, Robert Keith Packer, Klete Keller, Richard Barnett, Olivia Pollock, Jonathan Pollock, Jessica Watkins, Guy Reffitt, Julian Khater and Jake Lang candidates remain withheld unless materially better identity-and-rights evidence appears.

## Deployment sequencing

The static portrait must return successfully from the production image URL before the guarded database migration is applied. This asset-first sequence prevents the public profile from pointing to a file that production cannot yet serve.
