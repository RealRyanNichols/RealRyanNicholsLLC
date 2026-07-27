-- Replace 24 face-free archive cards with person-specific photographs
-- embedded in official January 6 case filings. Each candidate was manually
-- reviewed against the filing's own attribution text and figure placement.
--
-- These images are documented editorial-use derivatives, not public-domain
-- or licensed assets. Every update is guarded by immutable UUID, slug, public
-- J6 status, and the original placeholder state so a later image cannot be
-- overwritten.

with portrait_data as (
  select *
  from jsonb_to_recordset(
    $portraits$
[
  {
    "id": "7e0c97bc-da24-4ebc-be8f-ec99b7e1a7f2",
    "slug": "mahailya-pryer",
    "photo_url": "/uploads/j6-profiles/mahailya-pryer-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Mahailya Pryer",
    "photo_source_name": "U.S. Department of Justice filing: Hentschel and Pryer Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1457716/download",
    "photo_credit": "Image embedded in Hentschel and Pryer Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing describes the woman on the left in Image 3 as wearing the red-white-blue stocking hat marked “45” and says that, after witness interviews and meeting her in person, the affiant identified her as Mahailya Pryer. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Hentschel and Pryer Statement of Facts; 14-page PDF, 1116761 bytes, SHA-256 25cacb4b0de0ad0e8a90091edf994ed90c9204f16da68c968033ffb85608da51. Image locator: PDF page index 5; printed page PDF page 5; Image 3, left-hand woman wearing the red-white-blue “45” stocking hat. Local derivative: 800x1000 JPEG, 88467 bytes, SHA-256 602b9ce2a2f604364d4e7f90b53ac0f6e71f63271e8bdf9332ca64ec546ae780; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250206033910 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1457716/dl; capture digest OP2KO3RFJMIKKVQFLQQJ7VV2YL6KOTF6. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1c9ae9fe-7be4-4be7-b596-9efdad4a7542",
    "slug": "mandy-robinson-hand",
    "photo_url": "/uploads/j6-profiles/mandy-robinson-hand-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Mandy Robinson-Hand",
    "photo_source_name": "U.S. Department of Justice filing: Robinson-Hand Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1482891/download",
    "photo_credit": "Image embedded in Robinson-Hand Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. A witness who knew Hand and Robinson-Hand through personal interactions positively identified both people in the CCTV screenshots. The filing separately describes Robinson-Hand as the brown-haired woman in a red shirt, black hooded jacket, ripped blue jeans, and dark sneakers. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Robinson-Hand Statement of Facts; 10-page PDF, 756841 bytes, SHA-256 9bc6b7e42e06b76a0fdfbb74252507b472de17936cc847096960602b0bc728a9. Image locator: PDF page index 3; printed page PDF page 3; CCTV composite, lower-left woman. Local derivative: 800x1000 JPEG, 82942 bytes, SHA-256 ad14b56a5130392f5276955c128015b7555c63f38c7e3b0c5a8c511eb8b920ff; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250206180046 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1482891/dl; capture digest OGUXE6QMHT5X5YSO46ME754UQHBOKPMO. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "09e66919-60d5-48a1-8f26-d5f92cf5b31b",
    "slug": "marc-bru",
    "photo_url": "/uploads/j6-profiles/marc-bru-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Marc Bru",
    "photo_source_name": "U.S. Department of Justice filing: Bru Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1382591/download",
    "photo_credit": "Image embedded in Bru Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing says two tipsters recognized the person in the Facebook profile screenshot as Marc Bru and that the affiant compared the photographs with Bru’s Washington Department of Licensing photograph and believed they showed the same person. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Bru Statement of Facts; 15-page PDF, 1945686 bytes, SHA-256 2000ca988ca77a4b306151c933043414140dd298a1649f384519c3714ab9d56e. Image locator: PDF page index 3; printed page Document 1-1, page 3; Facebook profile screenshot under the name Marc Bru. Local derivative: 800x1000 JPEG, 89317 bytes, SHA-256 9f8936ed5547bcd8f52de692545159e39557e5978f6f2d09d836f79ca84cac55; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250524021600 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1382591/dl; capture digest A2B4KX4QCLZQGXYKX7Z345NNFBDEWVYC. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "cb92c029-e2e3-43b2-9897-a2dbc641d964",
    "slug": "marilyn-fassell",
    "photo_url": "/uploads/j6-profiles/marilyn-fassell-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Marilyn Fassell",
    "photo_source_name": "U.S. Department of Justice filing: Fassell - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1520861/download",
    "photo_credit": "Image embedded in Fassell - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing states that Marilyn Fassell took this selfie-style photograph of herself smoking a cigarette and that a witness who knew the couple confirmed it was the same photograph previously shown to her. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Fassell - Statement of Facts; 7-page PDF, 544303 bytes, SHA-256 078585950af6f1be7eb15f93d0fb4c97883afb4f3d51386c5c6b34c962049c92. Image locator: PDF page index 4; printed page Document 1-1, page 4; Selfie-style cigarette photograph. Local derivative: 800x1000 JPEG, 70225 bytes, SHA-256 d5ab073646c7df2127dc45b6798fce4caf42fc82ca960377e183df26a064ecbd; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250206074455 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1520861/dl; capture digest HX6SGC7O3M3KTZ44HJR3Z5I4W5IY4BAL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "4dd69a3d-8706-4706-a1b8-58567265abe5",
    "slug": "mark-ponder",
    "photo_url": "/uploads/j6-profiles/mark-ponder-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Mark K. Ponder",
    "photo_source_name": "U.S. Department of Justice filing: Ponder - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1379091/download",
    "photo_credit": "Image embedded in Ponder - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing states that officers arrested the person later identified as Mark Ponder, reviewed identification taken from him, and that the body-worn-camera frame depicts that identity-document review. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Ponder - Statement of Facts; 11-page PDF, 777747 bytes, SHA-256 f237fd1b4f1c81c2d83a2a12bfe283bb066b39c721586a711b50949fd0fa1634. Image locator: PDF page index 9; printed page PDF page 9; Body-worn-camera frame during identity-document review. Local derivative: 800x1000 JPEG, 108313 bytes, SHA-256 7b62d79a8cfe8d04b417f63372d859873c1607c4055aa7f8fe7ed4503e9c25e5; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250524023146 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1379091/dl; capture digest 6KZBN2ZPG4NSYVVIEMVC3F5PUKL5NTW7. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "4bf60e5b-ebc1-40e0-82c2-9ce87f4754e2",
    "slug": "mark-rebegila",
    "photo_url": "/uploads/j6-profiles/mark-rebegila-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Mark Roger Rebegila",
    "photo_source_name": "U.S. Department of Justice filing: Rebegila - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1379146/download",
    "photo_credit": "Image embedded in Rebegila - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing says the photograph was sent by Rebegila as a photograph of himself and expressly identifies Rebegila as the person on the right wearing a dark blue jacket and Trump 2020 stocking cap. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Rebegila - Statement of Facts; 6-page PDF, 751380 bytes, SHA-256 ddf60e8b57a2aea9d633984e83d23cb602a29d2161adcbaa11e12297451df1e4. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 6; Defendant-supplied photograph, right-hand man. Local derivative: 800x1000 JPEG, 88255 bytes, SHA-256 9426f55633e0354ffcff02e12ed8803c90f4756f91fca8dfcf880cac38189f85; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250524023224 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1379146/dl; capture digest PS57AE46EV27MWQNI4YZMVM3TVRDIN44. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "a6471429-8282-4167-8428-4a58779988a7",
    "slug": "matthew-baggott",
    "photo_url": "/uploads/j6-profiles/matthew-baggott-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Matthew Baggott",
    "photo_source_name": "U.S. Department of Justice filing: Parks Baggott Complaint & Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1401226/download",
    "photo_credit": "Image embedded in Parks Baggott Complaint & Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. A witness who knew Stewart Parks identified the red-sweatshirt, dark-cap person as Matthew Baggott. The affiant then compared that person with Baggott’s driver-license photograph and stated that the images in paragraphs 14 and 16 depict Matthew Baggott. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Parks Baggott Complaint & Affidavit; 15-page PDF, 1068110 bytes, SHA-256 fbe95b1a8bd9a78c29ef57eca3a82bc93ae430f190480299f8e01aa3196ffc7f. Image locator: PDF page index 11; printed page PDF page 11; Paragraph 16 Capitol-surveillance image, red sweatshirt and dark cap. Local derivative: 800x1000 JPEG, 66748 bytes, SHA-256 90e11ac3afdab57ecb31972cb9cd1f646839f029e351ead8cc2c330e63bc5a37; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250123105239 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1401226/dl; capture digest SQLVZ62J3HW3JGHUMNV5WNXKKNQ47IOM. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5876f8fa-a21b-4799-835f-9cef6429f08a",
    "slug": "michael-brock",
    "photo_url": "/uploads/j6-profiles/michael-brock-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Michael Leon Brock",
    "photo_source_name": "U.S. Department of Justice filing: Brock Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1413551/download",
    "photo_credit": "Image embedded in Brock Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing identifies the yellow-circled man in Figure One as Michael Leon Brock. Two confidential witnesses who had known Brock for approximately twenty years and two years, respectively, separately identified the same circled person as Brock. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Brock Complaint & Statement of Facts; 6-page PDF, 453118 bytes, SHA-256 4be4bc2da701a0a45ba159aa77f3607329573617ed7fe4d053c7952c16e2711f. Image locator: PDF page index 3; printed page PDF page 3; Figure One, yellow-circled man in green hoodie. Local derivative: 800x1000 JPEG, 93071 bytes, SHA-256 22c9641e3c1a143270ddd06901313ce6c7c6ea478d7f77a750a1934c5c87f8aa; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250227130649 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1413551/dl; capture digest ZRO7CUVDHFYXWR4KVHBAXPUIUEP3JUS6. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "bcc5819c-4bb6-4656-99d1-0a4b2bf9a068",
    "slug": "michael-pomeroy",
    "photo_url": "/uploads/j6-profiles/michael-pomeroy-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Michael Pomeroy",
    "photo_source_name": "U.S. Department of Justice filing: Pomeroy - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1507526/download",
    "photo_credit": "Image embedded in Pomeroy - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing reproduces the group photograph twice and expressly states that Michael Pomeroy is the person circled in red in the second copy, the second person from the left. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Pomeroy - Statement of Facts; 13-page PDF, 1759345 bytes, SHA-256 805cecba0d6928d4e48be59ced66f6a671f3f641224be351c7beded36f3bda19. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 13; Free PA group photograph, second person from the left. Local derivative: 800x1000 JPEG, 93893 bytes, SHA-256 63658be9b3e7dca7fa2331a2bd17594b2ef9c90ad7ad00ff3406c7013f81ee7a; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250206064425 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1507526/dl; capture digest 3AQRTEN7FDS4VJNKNMFLDGWCMRGUVNBA. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "b231204a-6902-47de-8921-3d0136c6aea5",
    "slug": "michael-timbrook",
    "photo_url": "/uploads/j6-profiles/michael-timbrook-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Michael Timbrook",
    "photo_source_name": "U.S. Department of Justice filing: Timbrook Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1388356/download",
    "photo_credit": "Image embedded in Timbrook Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing identifies the red-boxed person in Figure 1 as the person law enforcement had probable cause to believe was Michael Timbrook. A tipster later identified Timbrook from Figure 1, and the affiant then interviewed Timbrook. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Timbrook Statement of Facts; 5-page PDF, 974478 bytes, SHA-256 f2dad8bfdb199bda06976f193ad64cde36c19c6fd95fd6fcf137f0ef77900f30. Image locator: PDF page index 2; printed page PDF page 2; Figure 1, red-boxed man in orange beanie. Local derivative: 800x1000 JPEG, 87234 bytes, SHA-256 c61dcfee963ab0342741e3624817724688d74305949009ac95d63cf4f608b9b5; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250524023555 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1388356/dl; capture digest YSY3ZNSA5SOOUNVYZHV23ZMASIHOCQOM. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "65ef6560-8157-4d2e-b4cb-e9ef23cd5738",
    "slug": "nicholas-fuller",
    "photo_url": "/uploads/j6-profiles/nicholas-fuller-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Nicholas John Fuller",
    "photo_source_name": "U.S. Department of Justice filing: Fuller Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1593096/download",
    "photo_credit": "Image embedded in Fuller Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing’s person-specific wording and figure placement. The filing states that investigators received information identifying #415-AFO as Nicholas Fuller, compared the footage with a current Minnesota driver-license photograph, and obtained an independent identification from a county sheriff’s deputy who recognized the person in Exhibits F1–F4 and G as Nicholas Fuller. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Fuller Statement of Facts; 21-page PDF, 7343620 bytes, SHA-256 d742fdac00d57ad4c8cc733e605c1221196a4e075202e4e54c5ff6e3d5540b6d. Image locator: PDF page index 11; printed page PDF page 11; Exhibit G, lower-right body-worn-camera frame. Local derivative: 800x1000 JPEG, 83727 bytes, SHA-256 ee571f748874c944b4ac94c8e87dc5d052b4ab771ae1befe80dbd21bdef59f8c; Person-specific 4:5 crop from the cited filing image, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20250206064015 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1593096/dl; capture digest SIDPXS6QD4G74O5XDVEYXG6FFGJNUDHL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f8dafed1-2aa2-4892-9ddf-ea73f7b6e830",
    "slug": "nicholas-languerand",
    "photo_url": "/uploads/j6-profiles/nicholas-languerand-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Nicholas John Languerand",
    "photo_source_name": "U.S. Department of Justice filing: Languerand Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1388821/download",
    "photo_credit": "Image embedded in Languerand Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. A witness who knew Nicholas Languerand personally told the FBI that he posted this picture of himself. The filing then expressly states that Languerand can be seen in the pictured Instagram post and describes his face, red knit hat, clothing, and Capitol background. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Languerand Statement of Facts; 6-page PDF, 2895977 bytes, SHA-256 7302048a8ff8ca5d38ac7d1a9750c2a7a91285b09a2b31b5fff459d6a93d4596. Image locator: PDF page index 2; printed page PDF page 2; Instagram self-portrait posted by the account blesthisimmunity_17. Local derivative: 800x1000 JPEG, 126800 bytes, SHA-256 f6c76a70e5ba4b6ad7753f1832f4bb45de1685d80d23546dda3622523b20ccd9; Person-specific crop from the filing's embedded Instagram image; 390x423 source-pixel crop at +0+174, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20240831175640 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1388821/dl; capture digest TFYKMEI3TRIW3UKR2ZUB25PD74TRCXII. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "95aa415a-2f82-4555-8dc1-7c07792ce037",
    "slug": "nicholas-hendrix",
    "photo_url": "/uploads/j6-profiles/nicholas-hendrix-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Nicholas Patrick Hendrix",
    "photo_source_name": "U.S. Department of Justice filing: Hendrix Complaint & Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1404506/download",
    "photo_credit": "Image embedded in Hendrix Complaint & Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing directly captions the full-length image as a photograph of Hendrix recovered from his phone and taken on January 6, 2021. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Hendrix Complaint & Affidavit; 7-page PDF, 727705 bytes, SHA-256 945d38e5e8b8528ff4d001339717f79badeea322672a2de320012707af981cda. Image locator: PDF page index 4; printed page Document 1-1, page 4; Top photograph captioned “Photograph of HENDRIX from his phone taken on January 6, 2021”. Local derivative: 800x1000 JPEG, 123341 bytes, SHA-256 3cf904bbd11ceefa7ee48dd6ee525c015db4f4a9e50f9dfb25be85f3b7f60fbb; Person-specific 178x390 source-pixel crop from the filing's embedded photograph, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250524022443 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1404506/dl; capture digest P7P3YB76CXF5VG6I6A5BPL3GKBKMRAPX. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f47264d2-43a8-4f7c-8ddc-abe93151489d",
    "slug": "patrick-king",
    "photo_url": "/uploads/j6-profiles/patrick-king-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Patrick John King",
    "photo_source_name": "U.S. Department of Justice filing: King Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1488266/download",
    "photo_credit": "Image embedded in King Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing calls Figure 6 a close-up screen capture of King's face. Witness 1, who had known King since middle school, positively identified King in Figures 2, 4, and 6. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: King Statement of Facts; 8-page PDF, 734125 bytes, SHA-256 9d3edb34eb437edbcf1d88bdbdae5c57be1fd2445df9c9b412b1023539d55e05. Image locator: PDF page index 5; printed page Document 1-1, page 5 of 8; Figure 6, close-up surveillance screen capture. Local derivative: 800x1000 JPEG, 65736 bytes, SHA-256 b35cf35624d876aab2e4c912b47e7afd842b35875930613a80cf63ce8cf4684c; Full 192x241 source image used without person substitution, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250206065202 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1488266/dl; capture digest XARE6RQD32NQYLG6TBLUCVMJQ63IVCX7. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "445a171c-a355-4183-ab1b-8d347c57b047",
    "slug": "paul-kovacik",
    "photo_url": "/uploads/j6-profiles/paul-kovacik-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Paul Edward Kovacik",
    "photo_source_name": "U.S. Department of Justice filing: Kovacik - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1516081/download",
    "photo_credit": "Image embedded in Kovacik - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Figure 17 is expressly captioned as booking photographs of Paul Kovacik from the Wisconsin Department of Corrections. The filing also states that an MPD officer identified the Capitol subject as Kovacik and that the affiant compared the booking images with the Capitol and body-camera imagery. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Kovacik - Statement of Facts; 10-page PDF, 1321935 bytes, SHA-256 6c1ddf7b5b6679ed05f6c55559e88de1525f5380704bc0f632df303d9938c742. Image locator: PDF page index 10; printed page Document 1-1, page 10 of 10; Figure 17, booking photographs of Paul Kovacik. Local derivative: 800x1000 JPEG, 72450 bytes, SHA-256 e68ddb7acefbaa3d0b89cb459c44139347998829754ca9a705051b8424b04de1; First frontal booking image isolated with a 180x268 source-pixel crop at +3+0, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250206005433 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1516081/dl; capture digest LMI7ZZSTMNETOWZV3JS7MNEPT5UPV2KE. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f1a04505-18da-40af-b428-44d195d1c62a",
    "slug": "pauline-bauer",
    "photo_url": "/uploads/j6-profiles/pauline-bauer-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Pauline Bauer",
    "photo_source_name": "U.S. Department of Justice filing: Bauer Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1395396/download",
    "photo_credit": "Image embedded in Bauer Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that MPD body-worn cameras recorded a person inside the Rotunda later identified as Pauline Bauer and introduces the displayed stills as frames of Bauer speaking during the confrontation. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Bauer Statement of Facts; 15-page PDF, 7536799 bytes, SHA-256 aa5812995182a89b1aedf378582742554c170ad2e609a71f995f62e60a31f2c9. Image locator: PDF page index 13; printed page PDF page 13; Upper MPD body-worn-camera still. Local derivative: 800x1000 JPEG, 78167 bytes, SHA-256 d6167146368b5922872ae47f6ff2c9ad3e25ddac0bbc0824ba560addd40edab0; Person-specific 450x430 crop at +300+280 from the rendered official filing page, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20240627120407 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1395396/dl; capture digest OSRUDRNQCAIJV2IUBPED6UW4RGHMZT3O. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "65167259-2069-4c89-90dd-a6ba2c481aa9",
    "slug": "peter-schwartz",
    "photo_url": "/uploads/j6-profiles/peter-schwartz-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Peter J. Schwartz",
    "photo_source_name": "U.S. Department of Justice filing: Schwartz, Peter - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1364696/download",
    "photo_credit": "Image embedded in Schwartz, Peter - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the affiant observed Peter Schwartz in the Action 8 video, describes his distinctive checked shirt, and says the displayed screen captures show Schwartz approaching and leaving the west terrace tunnel. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Schwartz, Peter - Complaint & Statement of Facts; 9-page PDF, 1219372 bytes, SHA-256 ef6509820e1183aa23004c0c5dcd987fd1a272b2dd90351a7050ea6b792a55f4. Image locator: PDF page index 4; printed page Document 1-1, page 4; Action 8 video frame, center photograph with red oval. Local derivative: 800x1000 JPEG, 93919 bytes, SHA-256 424e5c03004758e209cd26ba7a5dbec769e017d3777e1cb545127655e2572a8a; Person-specific 330x330 crop at +580+545 from the rendered official filing page, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250524023354 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1364696/dl; capture digest CCMWATCFCLYMNUYGAWEX5AQ5MI5IHLZY. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "31a809b7-1c90-46f3-b46f-a236c13a8636",
    "slug": "philip-grillo",
    "photo_url": "/uploads/j6-profiles/philip-grillo-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Philip Sean Grillo",
    "photo_source_name": "U.S. Department of Justice filing: Grillo - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371396/download",
    "photo_credit": "Image embedded in Grillo - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Witness 2, who had known Grillo for decades and knew his face, identified Grillo in CNN footage. It says the red oval was inserted by the affiant to identify Grillo and displays the supplied close-up. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Grillo - Complaint & Statement of Facts; 14-page PDF, 659904 bytes, SHA-256 9c6f4bcc4803c7d3c510cfc109bb8b6a76b8d32d2e1ebc0258795f52c86e10a8. Image locator: PDF page index 4; printed page Document 1-1, page 3 of 13; WITNESS 2 CNN close-up supplied to the FBI. Local derivative: 800x1000 JPEG, 95540 bytes, SHA-256 5c030ac29d0e025960136ea65c4b43162198f29e8a55acd79e011efa0679100f; Person-specific 185x226 source-pixel crop at +0+0, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250524022354 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371396/dl; capture digest XN4G2ANL4K53RO24DXKDVY3SNELQYA3Z. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "b21f1333-f210-4bac-97d9-516f89ee27d9",
    "slug": "phillip-bromley",
    "photo_url": "/uploads/j6-profiles/phillip-bromley-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Phillip Andrew Bromley",
    "photo_source_name": "U.S. Department of Justice filing: Bromley - Complaint & Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371306/download",
    "photo_credit": "Image embedded in Bromley - Complaint & Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing introduces the stills as images of Bromley while he provides his narrative, records that he states his name is Phillip Bromley, and says the affiant compared the speaker with Bromley's Alabama driver's-license photograph. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Bromley - Complaint & Affidavit; 9-page PDF, 529265 bytes, SHA-256 0f8fa0a6c7f0b7820d55950a5a177e4f68ae5a8b4aa8d4f39119056a2817cc5f. Image locator: PDF page index 6; printed page Document 1-1, page 5 of 8; Video 1 still of Bromley providing his narrative. Local derivative: 800x1000 JPEG, 101692 bytes, SHA-256 8fa4a7deb6bf16a339c3968efedc2cb433434828c05cece90d496d0796b174b5; Person-specific 381x560 source-pixel crop at +0+0, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250524021551 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371306/dl; capture digest 3GDXFY65ZVF2RKDFQGF6BF2O6QWYW6SQ. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "56d80e4c-df00-468b-9124-25c983a0ac76",
    "slug": "quentin-cantrell",
    "photo_url": "/uploads/j6-profiles/quentin-cantrell-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Quentin G. Cantrell",
    "photo_source_name": "U.S. Department of Justice filing: Cantrell Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481966/download",
    "photo_credit": "Image embedded in Cantrell Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Witness 1 positively identified the person on the left as Quentin Cantrell. The affiant states that he recognized Quentin because he met him during the investigation and compared the image with Quentin's Indiana Bureau of Motor Vehicles photograph. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Cantrell Statement of Facts; 19-page PDF, 1276255 bytes, SHA-256 53645a3bc209ffe9938fced358e2b1d5f342cf0199b4d8a8afcb3333654ec5e9. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 19; Exhibit 2, left-hand person. Local derivative: 800x1000 JPEG, 94611 bytes, SHA-256 222aa70a0416dfca97a3a98290f19e19c45d180dc1f021373e8b3a67ba6721ac; Left-hand person isolated with a 320x600 source-pixel crop at +0+650, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250206074126 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481966/dl; capture digest GCODNSCE2DIZ7WKPMQSQ4XQFKUXNZX4G. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "7a00efa5-4f44-42f1-8061-6e72fa7ae539",
    "slug": "ralph-celentano",
    "photo_url": "/uploads/j6-profiles/ralph-celentano-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Ralph Celentano",
    "photo_source_name": "U.S. Department of Justice filing: Celentano Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481351/download",
    "photo_credit": "Image embedded in Celentano Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that two people who knew Celentano positively identified him in the displayed photographs and that the affiant compared those images with Celentano's New York driver's-license photograph. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Celentano Statement of Facts; 11-page PDF, 905923 bytes, SHA-256 9395fddbde07a1d10aa3b2630da70e5b87dc3da5f589f9e93901108ed54919d9. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 11; Image 4. Local derivative: 800x1000 JPEG, 76589 bytes, SHA-256 c15144ae28684a77e499acc7ad8d5a1f33ce2b1313fe16551d78d730b08c2d55; Person-specific 300x272 source-pixel crop at +25+0 from Image 4, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: Internet Archive capture 20250207000022 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481351/dl; capture digest 6XUQMKTWXJM77SC6QTV4TTZOCXOXOFVJ. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1831dd8e-3ce4-4fdd-affa-dab03dbc73ee",
    "slug": "ralph-kahler",
    "photo_url": "/uploads/j6-profiles/ralph-kahler-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Ralph Kahler",
    "photo_source_name": "U.S. Department of Justice filing: Kahler Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1591061/download",
    "photo_credit": "Image embedded in Kahler Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Image 1 expressly identifies R. Kahler as the green-circled person. The filing later states that law-enforcement officers compared the Capitol imagery with known photographs and identified R. Kahler as the person shown. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Kahler Statement of Facts; 7-page PDF, 1337891 bytes, SHA-256 f667eb57bde88413949bc26eebbb058cdca4d67575de56157651e6e6f7345e1a. Image locator: PDF page index 2; printed page PDF page 2; Image 1, R. KAHler expressly circled in green. Local derivative: 800x1000 JPEG, 83605 bytes, SHA-256 d93f13eec1485043c9c80da6e453503987a368b040de59192cae2f04f5509956; Person-specific 120x150 source-pixel crop isolating the green-circled R. Kahler face in Image 1, resized to 800x1000 JPEG with mild source-pixel sharpening; no generative content. Acquisition: Internet Archive capture 20240831195518 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1591061/dl; capture digest HXU6QMCZ246ZANWKCZYP7Q5RHVK37VGE. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5d42cb22-33fa-492b-a1b9-71bca7a99ef1",
    "slug": "rebecca-lavrenz",
    "photo_url": "/uploads/j6-profiles/rebecca-lavrenz-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Rebecca Lavrenz",
    "photo_source_name": "U.S. Department of Justice filing: Lavrenz - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1560707/download",
    "photo_credit": "Image embedded in Lavrenz - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Lavrenz provided this photograph to agents and identified herself as the only person facing the camera while wearing a red scarf and white hat. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Lavrenz - Statement of Facts; 5-page PDF, 2070965 bytes, SHA-256 330250e3f7d8105bf8356c054d2fc81ed1df19734012449c8a52171773daa7e9. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 5; Defendant-provided Capitol photograph, yellow-circled person. Local derivative: 800x1000 JPEG, 137801 bytes, SHA-256 bcd3b9080b7c6396f199f61688243b8e704b4f817ea6ca0cb0531f97cb83df5b; Person-specific 450x500 crop at +320+1080 from the rendered official filing page, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: reviewed from the cited official DOJ filing URL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "a67933a4-6aaa-4a11-822f-395afd182b3e",
    "slug": "robert-fairchild",
    "photo_url": "/uploads/j6-profiles/robert-fairchild-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Robert Flynt Fairchild Jr.",
    "photo_source_name": "U.S. Department of Justice filing: Fairchild Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/opa/case-multi-defendant/file/1428251/download",
    "photo_credit": "Image embedded in Fairchild Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Exhibit C shows Fairchild at the West Plaza security barriers. It also says a Georgia law-enforcement officer identified Fairchild in the source photographs and that the affiant compared those images with Fairchild's Florida driver's-license photograph. Identity is treated as verified for contextual documentary display; copyright or reuse-license status is not inferred. Source file: Fairchild Complaint & Statement of Facts; 11-page PDF, 6398779 bytes, SHA-256 2e980802f62c9a62f99e97be2d8371757252a4aafc852bae612a834594b1bb49. Image locator: PDF page index 6; printed page PDF page 6; Exhibit C, upper body-worn-camera frame. Local derivative: 800x1000 JPEG, 105492 bytes, SHA-256 5b00f81450f40c76c374554a91b9fa54ab5252818f64528b09b7db289714a91c; Person-specific 510x610 crop at +420+320 from the rendered official filing page, resized and centered over a blurred source-pixel backdrop at 800x1000. No generative changes. Acquisition: reviewed from the cited official DOJ filing URL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  }
]
    $portraits$::jsonb
  ) as data (
    id uuid,
    slug text,
    photo_url text,
    photo_alt_text text,
    photo_source_name text,
    photo_source_url text,
    photo_credit text,
    photo_verification_notes text
  )
)
update public.case_people as person
set
  photo_url = portrait_data.photo_url,
  photo_alt_text = portrait_data.photo_alt_text,
  photo_source_name = portrait_data.photo_source_name,
  photo_source_url = portrait_data.photo_source_url,
  photo_credit = portrait_data.photo_credit,
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = portrait_data.photo_verification_notes,
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
from portrait_data
where person.id = portrait_data.id
  and person.slug = portrait_data.slug
  and person.visibility = 'public'
  and person.is_j6_defendant = true
  and person.photo_is_placeholder = true
  and person.photo_identity_status = 'placeholder'
  and person.photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(person.photo_url, '')), '') is null;
