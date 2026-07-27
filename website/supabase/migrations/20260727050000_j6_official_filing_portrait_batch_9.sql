-- Replace 28 face-free archive cards with person-specific photographs
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
    "id": "460c6084-6665-4a78-a431-fe053c9d46cc",
    "slug": "alexander-sheppard",
    "photo_url": "/uploads/j6-profiles/alexander-sheppard-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Alexander Bennett Sheppard",
    "photo_source_name": "U.S. Department of Justice filing: Sheppard - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371511/download",
    "photo_credit": "Image embedded in Sheppard - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says an unknown male was later identified as Sheppard on the alexsheppard.ig Instagram page; Photo 3 then identifies Sheppard by the same clothing shown in Photos 1 and 2. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Sheppard - Complaint & Statement of Facts; 6-page PDF, 1794615 bytes, SHA-256 f78d083336c2a04b72feb495bbf51a51112cf10236b07f8e40f3fadadfa181cf. Image locator: PDF page index 4; printed page Document 1-1, page 3 of 5; Photo 1, left-hand person in red cap and blue hoodie. Local derivative: 800x1000 JPEG, 115397 bytes, SHA-256 a5abd6f460f94a88bec2cf3ef335cca7e56ffa247f25791f76076f478b6d5c0d; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240524204410 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371511/dl; capture digest ZNPFNNLXTSINM5UNUIO62JW66DMKHQX7. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "b09bda87-a5a2-4d0b-b217-a0d245dcac7f",
    "slug": "andrew-cavanaugh",
    "photo_url": "/uploads/j6-profiles/andrew-cavanaugh-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Andrew Michael Cavanaugh",
    "photo_source_name": "U.S. Department of Justice filing: Cavanaugh - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1378536/download",
    "photo_credit": "Image embedded in Cavanaugh - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing connects the unique Tactical Citizen cap to Cavanaugh's company and social accounts, then says Cavanaugh's Montana driver-license photograph bears a strong resemblance to the pictured man. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Cavanaugh - Statement of Facts; 6-page PDF, 829532 bytes, SHA-256 e92175310338ecf6877256abce1170ca7c3576ca821176d4d9c44c2eb7785ebe. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 6; Unnumbered Parler-video screen capture of the man wearing the Tactical Citizen cap. Local derivative: 800x1000 JPEG, 82364 bytes, SHA-256 ff58700ffbf54552d5de3bef30e3e880d84234055954d36936d877362f9199f0; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115952 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1378536/dl; capture digest HAL4D27YD6GFLCPNSPHJCQN52T5RCET4. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "a26b6504-503f-4abc-9e31-b1d50adc1c76",
    "slug": "andrew-morgan",
    "photo_url": "/uploads/j6-profiles/andrew-morgan-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Andrew Jackson Morgan Jr.",
    "photo_source_name": "U.S. Department of Justice filing: Morgan Complaint and Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1385531/download",
    "photo_credit": "Image embedded in Morgan Complaint and Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Morgan turns the camera on himself in Figure Nine and that motor-vehicle records and other identifying records and photographs confirmed that the person filming was Andrew Jackson Morgan Jr. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Morgan Complaint and Affidavit; 9-page PDF, 2875155 bytes, SHA-256 a5ba8f866034f3052fbb66229b43a9f1079ecf587ad15ed05dfc456ce92d1096. Image locator: PDF page index 7; printed page Document 1, header page 8 of 12; Figure Nine. Local derivative: 800x1000 JPEG, 71120 bytes, SHA-256 1f128048d16edf508f6bc0898ee52693347946d5370c0d43c55967b7a110dc2f; Person-specific source frame reconstructed from contiguous PDF image strips, then centered over a blurred enlargement to preserve the full face in an 800x1000 profile canvas. Acquisition: Internet Archive capture 20240524140205 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1385531/dl; capture digest 2JCFUGYS6Q4FFLI4VHZCLGYF5TO3EIVK. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "0eb9976f-3e67-4d4f-aebc-085c4d819f32",
    "slug": "anthony-antonio",
    "photo_url": "/uploads/j6-profiles/anthony-antonio-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Anthony Alexander Antonio",
    "photo_source_name": "U.S. Department of Justice filing: Antonio Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1389341/download",
    "photo_credit": "Image embedded in Antonio Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Witness 2 identified the person in the photograph as Antonio, supplied Antonio's first and last name and hometown, and the filing further corroborates his distinctive face and neck tattoos and social accounts. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Antonio Statement of Facts; 23-page PDF, 1695205 bytes, SHA-256 95c4c6334218ba2fe3ada3dc8cf486b44282ae9b7d8b9c7b4e3e3fea192873c4. Image locator: PDF page index 4; printed page Statement-of-facts page containing the Identification of Anthony Alexander Antonio section; Unnumbered Instagram photograph. Local derivative: 800x1000 JPEG, 138660 bytes, SHA-256 dd94db45587238884367d2c8f31fa99d8f4280f359ec25a537eb46e34590cd63; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240327133534 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1389341/dl; capture digest AUBZSXQZDEDEMW6OAJRDN2SM2IQJY55T. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "081309af-fd73-401b-b9d8-78509bc82082",
    "slug": "anthony-carollo",
    "photo_url": "/uploads/j6-profiles/anthony-carollo-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Anthony Carollo",
    "photo_source_name": "U.S. Department of Justice filing: Carollo - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481596/download",
    "photo_credit": "Image embedded in Carollo - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says the video-frame appearances were compared with each man's Illinois driver-license photograph and explicitly labels the lower person in Photo 1 as Anthony Carollo. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Carollo - Statement of Facts; 8-page PDF, 483363 bytes, SHA-256 916cede7655bbf0242d814186637b89ce8bce2710a5ab3a704d007ae86acc8ba. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 8; Photo 1, lower person explicitly labeled Anthony Carollo. Local derivative: 800x1000 JPEG, 62761 bytes, SHA-256 68cc53517c5565daa67a5ead5ce5c6ee416fa7abb0d1cbbb71a643b00f58866c; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115913 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481596/dl; capture digest RF53ADU3NAHCLURZSXP4IBCDPYVWJALL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "fc782f76-db1d-4d80-b826-861c09c5e567",
    "slug": "anthony-mazzio",
    "photo_url": "/uploads/j6-profiles/anthony-mazzio-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Anthony Michael Mazzio Jr.",
    "photo_source_name": "U.S. Department of Justice filing: Mazzio Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1490456/download",
    "photo_credit": "Image embedded in Mazzio Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies the pictured person as Mazzio, ties the same appearance across Capitol CCTV and open-source footage, and records Mazzio's admission that he alone used the associated phone found inside the Capitol. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Mazzio Statement of Facts; 9-page PDF, 1120733 bytes, SHA-256 bf1070d3cccbddd45c8ee73f0c6bc1feeb8126eaaeac051cb4b185ce393c18c7. Image locator: PDF page index 6; printed page Document 1-1, page 6 of 9; Image 5. Local derivative: 800x1000 JPEG, 93756 bytes, SHA-256 68d1ec46e2c98a00ca5614250c0282ba90945d8c013d8c5f10e0747e88c0ba8d; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120051 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1490456/dl; capture digest E35RQ2R3D35UXBN5BAHWYNELG5X7JKX4. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "011d14a0-82b6-48f1-95eb-9b871f86f864",
    "slug": "anthony-nolf",
    "photo_url": "/uploads/j6-profiles/anthony-nolf-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Anthony Nolf",
    "photo_source_name": "U.S. Department of Justice filing: Nolf - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1583116/download",
    "photo_credit": "Image embedded in Nolf - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing introduces the image set as images of Anthony Nolf, describes his beard, mustache, camouflage hat, gray sweatshirt and jeans, and consistently tracks that clothing in later footage. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Nolf - Statement of Facts; 15-page PDF, 2857085 bytes, SHA-256 ea2bc9bd6612755fc590e82fedbaed9758a4416600b8fb52cd4ada05a00f2584. Image locator: PDF page index 5; printed page Statement-of-facts page 5; Image 5, right-hand close frame. Local derivative: 800x1000 JPEG, 227968 bytes, SHA-256 f6e5fb94787ccd5f4fb50679f40cc36a9b958e88f3398e0620f3c81499d209e9; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240523052315 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1583116/dl; capture digest 6RI3QZPAO27V6UVU2XHUROTCCTRUU646. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f380c672-cec7-4ded-92f3-b672a0327258",
    "slug": "anthony-scirica",
    "photo_url": "/uploads/j6-profiles/anthony-scirica-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Anthony Joseph Scirica",
    "photo_source_name": "U.S. Department of Justice filing: SCIRICA Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1405461/download",
    "photo_credit": "Image embedded in SCIRICA Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says two separately interviewed witnesses were shown the red-circled photograph and both identified the individual as Scirica; both were former coworkers. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: SCIRICA Complaint & Statement of Facts; 6-page PDF, 326647 bytes, SHA-256 a400f0615a70441ad2c63cf6b096fc4e4e7177f3bf8b3c4cff79e8e37126e1c1. Image locator: PDF page index 3; printed page Statement-of-facts page 2; Red-circled Inside Edition screen capture above the witness-identification paragraph. Local derivative: 800x1000 JPEG, 115578 bytes, SHA-256 2c5c1b6f7bc6cd67b79fa7e338520bc2b5f53455164cbd84423e67f982250e69; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115928 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1405461/dl; capture digest NV25NC7TEDRVUPTPNOH6LA66OPBSWZ2E. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "3af9afce-a38b-418a-b871-04fc614af7a1",
    "slug": "antonio-lamotta",
    "photo_url": "/uploads/j6-profiles/antonio-lamotta-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Antonio Lamotta",
    "photo_source_name": "U.S. Department of Justice filing: Lamotta - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1526741/download",
    "photo_credit": "Image embedded in Lamotta - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that FBI Special Agent Matthew King, who had personally interviewed Lamotta, viewed the depicted images and source videos and identified Lamotta in them. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Lamotta - Statement of Facts; 6-page PDF, 872468 bytes, SHA-256 b6c4306d5c7d89b295fe28babfb68c7d7356ad5ef62b662d471add5551666e52. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 6; Upper MPD body-worn-camera still. Local derivative: 800x1000 JPEG, 87389 bytes, SHA-256 4df5ad932c40420abdea890043b9d458016dd3ab75d063511ac214cac9e3666e; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20220829093802 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1526741/download; capture digest QAEXTR3EBELM6PLOH2PSZFQRISC7QKFF. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "85246835-4e0c-4676-ab54-dc4c873d4156",
    "slug": "arthur-jackman",
    "photo_url": "/uploads/j6-profiles/arthur-jackman-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Arthur Jackman",
    "photo_source_name": "U.S. Department of Justice filing: Jackman Statement of Facts",
    "photo_source_url": "https://www.justice.gov/opa/case-multi-defendant/file/1381346/download",
    "photo_credit": "Image embedded in Jackman Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says a childhood friend received a self-photo from Jackman inside the Capitol and sent it to a second witness, who provided it to investigators; the displayed still is used in the filing's Jackman identification sequence. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Jackman Statement of Facts; 18-page PDF, 3977233 bytes, SHA-256 2dec4eaa0b24cac2f80ab8714b898a7ca8ec8de2948944420ab7da694ced91c5. Image locator: PDF page index 11; printed page Statement-of-facts page 11; Unnumbered still immediately above paragraph 24. Local derivative: 800x1000 JPEG, 98447 bytes, SHA-256 f5a43c6a7aced713b7692dafcc64749489247ac89c62b775ed3cd072e6859796; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: reviewed from the cited official DOJ filing URL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "e10f37f1-f706-4030-a85c-6c59f05c07db",
    "slug": "audrey-southard-rumsey",
    "photo_url": "/uploads/j6-profiles/audrey-southard-rumsey-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Audrey Ann Southard-Rumsey",
    "photo_source_name": "U.S. Department of Justice filing: Southard-Rumsey Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1401016/download",
    "photo_credit": "Image embedded in Southard-Rumsey Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says the tipster captured Southard-Rumsey's own Facebook post, and a records check showed her to be the same person pictured on the audreyann.southard Facebook account. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Southard-Rumsey Complaint & Statement of Facts; 12-page PDF, 5794512 bytes, SHA-256 4e3e8f69722a0a1d10e42d7985bf292f223a0c7dfb560f2bd4511797d3322023. Image locator: PDF page index 3; printed page Statement-of-facts page 2; Facebook post captioned DC Taking it back!!. Local derivative: 800x1000 JPEG, 95423 bytes, SHA-256 cbae1c889c505f4e367119b97b89e3b4a92da4d032637259d5feb288bf26c022; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120025 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1401016/dl; capture digest KN7GCKQYKJOROWIGEQK6RZHWF2GLTSHU. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "852b92ec-9dd5-4934-8cb3-2a041c6fb226",
    "slug": "benjamin-cole",
    "photo_url": "/uploads/j6-profiles/benjamin-cole-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Benjamin Cole",
    "photo_source_name": "U.S. Department of Justice filing: Cole - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1529786/download",
    "photo_credit": "Image embedded in Cole - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing labels the section Benjamin James Cole, describes his clothing and appearance, and states that the three displayed images are images of Cole obtained from open-source footage on the restricted Capitol grounds. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Cole - Statement of Facts; 40-page PDF, 8389056 bytes, SHA-256 6fee3c360f0e6097c3f0818299b6c0b609546f0abe6e0ba6e09392bc2b892112. Image locator: PDF page index 10; printed page Document 5-1, page 10 of 40; Left image in the three-image Benjamin James Cole row. Local derivative: 800x1000 JPEG, 99289 bytes, SHA-256 b316a763a558287e696896bdb83c032f65a09e5106b233a15326f266e52eb295; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20220902094833 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1529786/download; capture digest IXQMYW5KUTH3QD3B32MDP4YMNTQMMC4W. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "4841329c-1f9b-4792-8629-20e0915c5a96",
    "slug": "benjamin-robinson",
    "photo_url": "/uploads/j6-profiles/benjamin-robinson-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Benjamin Scott Robinson",
    "photo_source_name": "U.S. Department of Justice filing: Robinson - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1507551/download",
    "photo_credit": "Image embedded in Robinson - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing labels the person Benjamin Robinson in the family photograph and says a witness identified Benjamin Scott Robinson in the related Capitol photographs using the same color-coding. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Robinson - Statement of Facts; 8-page PDF, 1800208 bytes, SHA-256 2e7f1bb96a02b8986741039da74385868223549a9365a9608f2faa169cb5b804. Image locator: PDF page index 4; printed page Entry 3, page 4 of 8; Family photograph, person explicitly labeled BENJAMIN ROBINSON. Local derivative: 800x1000 JPEG, 134080 bytes, SHA-256 5944875c4a06ebde2a22b79d4449b6114f5bb9d1d64b0b1e450bcab8fc63c379; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240420005214 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1507551/dl; capture digest WXPPKQBQB6FFW5K5QKHOKFTRNXSZYDDY. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "bdea8f0a-10d1-4542-aecf-9be488669ffe",
    "slug": "brian-gundersen",
    "photo_url": "/uploads/j6-profiles/brian-gundersen-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Brian Gundersen",
    "photo_source_name": "U.S. Department of Justice filing: Gundersen - Statement of Facts for Stipulated Trial",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1550941/download",
    "photo_credit": "Image embedded in Gundersen - Statement of Facts for Stipulated Trial, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says an FBI digital-media search returned tips and pictures of Gundersen wearing the same distinctive Byram Hills jacket; Figures 3 through 5 are introduced as pictures of Gundersen, and Facebook legal process confirmed brian.gundersen.3. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Gundersen - Statement of Facts for Stipulated Trial; 6-page PDF, 588649 bytes, SHA-256 9ad0894891c07db21d3543e573049f689ac9df238f084dc543715eee4db3c030. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 6; Figure 4. Local derivative: 800x1000 JPEG, 100851 bytes, SHA-256 d124e73fc00631b966fde856dbe78081587b4742d090e274913c18569f2e19e6; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20230330074503 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1550941/download; capture digest NQFICQ7TIP75QD7KO2GZLYB6SSRJCZM6. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "d934af77-e435-40c3-9c25-585006929bdd",
    "slug": "brian-korte",
    "photo_url": "/uploads/j6-profiles/brian-korte-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Brian Korte",
    "photo_source_name": "U.S. Department of Justice filing: Korte - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1507506/download",
    "photo_credit": "Image embedded in Korte - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing explicitly states that Brian Korte is circled in red in the Free PA Photograph and separately describes his camouflage hat, TRUMP lettering, blue hoodie and camouflage backpack. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Korte - Statement of Facts; 13-page PDF, 1759345 bytes, SHA-256 805cecba0d6928d4e48be59ced66f6a671f3f641224be351c7beded36f3bda19. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 13; Free PA Photograph, leftmost person circled in red. Local derivative: 800x1000 JPEG, 98282 bytes, SHA-256 77f26fdf010225a9ccb80ffe0959114bc9db7d4331a3b695da4586881d0e8593; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115957 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1507506/dl; capture digest 3AQRTEN7FDS4VJNKNMFLDGWCMRGUVNBA. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1ac798ab-a90f-432d-b268-429aeb0351bc",
    "slug": "brian-sizer",
    "photo_url": "/uploads/j6-profiles/brian-sizer-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Brian Douglas Sizer",
    "photo_source_name": "U.S. Department of Justice filing: Sizer - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1549201/download",
    "photo_credit": "Image embedded in Sizer - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Julia Sizer identified her husband Brian Sizer and his clothing, then states that the affiant compared Brian Sizer's Pennsylvania driver-license photograph with the pictured man and concluded the man was Brian Sizer. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Sizer - Statement of Facts; 5-page PDF, 794079 bytes, SHA-256 2b035c7cdf0458e3112d7cd1a91abf8bedf9920e8f80cb90e75ef7cb115357d6. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 5; Photograph from Julia Sizer's phone; man in tan jacket and gray hood holding a phone. Local derivative: 800x1000 JPEG, 113865 bytes, SHA-256 9fa6984a57ba617f2c613952ddcb4785d3eb886822b9c11609932d5e4098083f; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20221103190252 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1549201/download; capture digest KFNQLEM2IKQUOVQDUCWW63VJX6DTHPRW. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "fd1cbed7-7b07-485a-8243-8ff7c5e06b02",
    "slug": "brittany-robinson",
    "photo_url": "/uploads/j6-profiles/brittany-robinson-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Brittany Nicole Robinson",
    "photo_source_name": "U.S. Department of Justice filing: Robinson - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1507571/download",
    "photo_credit": "Image embedded in Robinson - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says a witness identified Brittany Robinson from her Facebook page and identified Brittany Nicole Robinson in the Capitol photographs, where she is consistently marked with the green circle. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Robinson - Statement of Facts; 8-page PDF, 1800208 bytes, SHA-256 2e7f1bb96a02b8986741039da74385868223549a9365a9608f2faa169cb5b804. Image locator: PDF page index 4; printed page Entry 3, page 4 of 8; Lower field photograph, woman circled in green. Local derivative: 800x1000 JPEG, 119105 bytes, SHA-256 70decf2766ec83b63f25fd11f368b178dfff111530bf6427208910a2b2c45334; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115926 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1507571/dl; capture digest EZ2WZWUFZNWHRNML6T7M4VYNYJXM7I6P. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "c7c7690a-d785-40dd-9037-83a513b2d384",
    "slug": "cale-clayton",
    "photo_url": "/uploads/j6-profiles/cale-clayton-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Cale Douglas Clayton",
    "photo_source_name": "U.S. Department of Justice filing: Clayton Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1489221/download",
    "photo_credit": "Image embedded in Clayton Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says agents interviewed Clayton and then identified him in MPD body-worn-camera footage by his red cap, Chiefs sweatshirt, khaki vest, jeans and boots; the displayed still is part of that identified sequence. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Clayton Statement of Facts; 11-page PDF, 2418380 bytes, SHA-256 1e63243f44f60a7b9404a8d690c7527c1085ce2a164650fd097c2044106fcd12. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 11; MPD body-worn-camera still under the scaffolding. Local derivative: 800x1000 JPEG, 120583 bytes, SHA-256 dbaba727ac091575767be47b886323f838a9e49a3d56c852058f3366991e6542; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120009 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1489221/dl; capture digest UW2NAOZ43B7U44F5FDBPLSYYE4VZE5S5. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "209d1d8f-93f9-4dd5-8fde-42984891da48",
    "slug": "caleb-jones",
    "photo_url": "/uploads/j6-profiles/caleb-jones-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Caleb Jones",
    "photo_source_name": "U.S. Department of Justice filing: Jones Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1381496/download",
    "photo_credit": "Image embedded in Jones Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The affiant states that stills of Jones were compared with Jones's Facebook page, driver license and self-photographs and confirmed the pictured person's appearance was consistent with Jones; Witnesses 1 and 2 also knew Jones and supplied his images and messages. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Jones Statement of Facts; 5-page PDF, 140064 bytes, SHA-256 e596c4b3a8e66e6cbedac44d86b4b8892acfabc7a6c07e36952ec90df55ab665. Image locator: PDF page index 4; printed page Statement-of-facts page 4; Upper-left comparison photograph. Local derivative: 800x1000 JPEG, 71690 bytes, SHA-256 d68363b64a445f795dd4e1f2f9cb47e0567ee8e657eddf3259fc21c3e9e44295; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115941 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1381496/dl; capture digest FH3EKYXC4COPQHEMXDKYOH2J3KZW7GUI. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5671efbd-f431-4eb1-a963-532fd42ddd5a",
    "slug": "casey-tryon-castro",
    "photo_url": "/uploads/j6-profiles/casey-tryon-castro-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Casey Jane Tryon-Castro",
    "photo_source_name": "U.S. Department of Justice filing: TRYON-CASTRO - Statement of facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1567231/download",
    "photo_credit": "Image embedded in TRYON-CASTRO - Statement of facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies 060-AFO as Casey Jane Tryon-Castro; during an FBI interview she was shown 060-AFO photographs and stated that she was the woman pictured, after which agents identified Tryon-Castro as 060-AFO. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: TRYON-CASTRO - Statement of facts; 16-page PDF, 1984565 bytes, SHA-256 bb3947f6f82a09614e980944bff794452e288494bce84f53b1e38ac2513be002. Image locator: PDF page index 12; printed page Document 22-1, page 12 of 16; Upper body-worn-camera still, 060-AFO circled in red. Local derivative: 800x1000 JPEG, 102501 bytes, SHA-256 31d75f70ddef50fac77b6bc8a92f8b473f7c7e07903dd236a0fad622e4079c91; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240612151953 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1567231/dl; capture digest 7ERRXTIPBZULJNCDCSO36KLWDFKRJLZW. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f51c30a5-f0cd-4af1-b230-86df86d095ce",
    "slug": "charles-hand",
    "photo_url": "/uploads/j6-profiles/charles-hand-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Charles Hand III",
    "photo_source_name": "U.S. Department of Justice filing: Hand - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1482881/download",
    "photo_credit": "Image embedded in Hand - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. A witness who knew Hand personally identified him, and the filing says the identification was corroborated by comparison with Hand's driver-license photograph and his consistently described Georgia cap, beard, white shirt and dark vest. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Hand - Statement of Facts; 10-page PDF, 756826 bytes, SHA-256 e86ec2eeea5852cb5a0a38b01989b372d0d658d2de075c4f8ad196084364112e. Image locator: PDF page index 5; printed page Document 1-1, page 5 of 10; Lower composite, right-hand close frame of the man in the Georgia cap. Local derivative: 800x1000 JPEG, 66546 bytes, SHA-256 ead3feb41898d300fd8e7cf12008effce37b6d2a074628b7af22d019481be2b3; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120017 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1482881/dl; capture digest OYV4DKJEHSWRXUBLD7KKZKW4JK2C55ZV. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "4e6d0d41-0842-49dd-b30b-b58042e7a526",
    "slug": "christopher-price",
    "photo_url": "/uploads/j6-profiles/christopher-price-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Christopher John Price",
    "photo_source_name": "U.S. Department of Justice filing: Price-Ballenger Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1422746/download",
    "photo_credit": "Image embedded in Price-Ballenger Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing explicitly captions the surveillance still as showing Price and provides the inset close frame; it also says an interviewed witness identified Price and Ballenger in photographs Price sent on January 6. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Price-Ballenger Complaint & Statement of Facts; 10-page PDF, 5812866 bytes, SHA-256 3012cdd5b0597f87a05f012745306561c8c14f49bdaf0efb346f8d3b1b1562d8. Image locator: PDF page index 6; printed page Affidavit page 5; Inset portrait below the surveillance still explicitly described as showing PRICE. Local derivative: 800x1000 JPEG, 104667 bytes, SHA-256 0d93b1363a361c75d64cecd5dbcc4f28e4a10530dbac772a4bf2f2fb232a188f; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627190249 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1422746/dl; capture digest 6XOGWYRJD2DR2QZ464DMVU2CURC5R4PV. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "3b6557bb-244f-4ac6-b590-3b064dc2f508",
    "slug": "cody-vollan",
    "photo_url": "/uploads/j6-profiles/cody-vollan-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Cody Vollan",
    "photo_source_name": "U.S. Department of Justice filing: Vollan Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1496171/download",
    "photo_credit": "Image embedded in Vollan Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says the video-frame appearances were compared with Illinois driver-license photographs and explicitly labels the upper person in Photo 1 as Cody Vollan. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Vollan Statement of Facts; 8-page PDF, 459710 bytes, SHA-256 a791c49b81159d037249301eab4a38330eb68a7f39ac3d419193e6a3c1cda4be. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 8; Photo 1, upper person explicitly labeled Cody Vollan. Local derivative: 800x1000 JPEG, 69652 bytes, SHA-256 14aeccd4d1e779ccd5f8705b2090353b82001a4b89ca81e88e325faa9ba2f182; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240622161922 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1496171/dl; capture digest NYEBSFS4HQYSXDNYMJFVE4TFKJMXWYT6. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "11b53e9e-5f11-4281-8f35-038cb4e9387e",
    "slug": "colton-wargo",
    "photo_url": "/uploads/j6-profiles/colton-wargo-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Colton Wargo",
    "photo_source_name": "U.S. Department of Justice filing: Wargo - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1505781/download",
    "photo_credit": "Image embedded in Wargo - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Photos 1, 2 and 3 were surveillance images matched to an Ohio Bureau of Motor Vehicles image of Colton Wargo and obtained device-location corroboration. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Wargo - Statement of Facts; 11-page PDF, 1335676 bytes, SHA-256 736c88ac821a8204882063a1510d9ed7e1bb2d76d96423e7c12ad0f906c7c0c9. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 11; Photo 2 in the Photos 1, 2 and 3 row. Local derivative: 800x1000 JPEG, 63314 bytes, SHA-256 4f2648e80c9e5917d430c4c193ed5b622dc7910976263288a4d4a16bbb1e4184; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120007 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1505781/dl; capture digest JTS4GYB64GX7T2IAPJNMVG2QO72QSFTV. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "edfee42e-3b96-4946-8675-874562990ea8",
    "slug": "cynthia-ballenger",
    "photo_url": "/uploads/j6-profiles/cynthia-ballenger-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Cynthia Catherine Ballenger",
    "photo_source_name": "U.S. Department of Justice filing: Price-Ballenger Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1422746/download",
    "photo_credit": "Image embedded in Price-Ballenger Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing explicitly captions the surveillance still as showing Ballenger and provides the inset close frame; it also says an interviewed witness identified Ballenger and Price in photographs Price sent on January 6. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Price-Ballenger Complaint & Statement of Facts; 10-page PDF, 5812866 bytes, SHA-256 3012cdd5b0597f87a05f012745306561c8c14f49bdaf0efb346f8d3b1b1562d8. Image locator: PDF page index 5; printed page Affidavit page 4; Inset portrait below the surveillance still explicitly described as showing BALLENGER. Local derivative: 800x1000 JPEG, 86727 bytes, SHA-256 f39119f0eb4fcd19579ae86e0a0e9358fe5fd3c952399b76fa512cc7e290f90e; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627190249 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1422746/dl; capture digest 6XOGWYRJD2DR2QZ464DMVU2CURC5R4PV. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "372ada23-c71b-43ff-8296-0f90a58fdcce",
    "slug": "daniel-donnelly",
    "photo_url": "/uploads/j6-profiles/daniel-donnelly-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Daniel Donnelly, Jr.",
    "photo_source_name": "U.S. Department of Justice filing: Donnelly Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1593301/download",
    "photo_credit": "Image embedded in Donnelly Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Image 1 comes from Donnelly's Rally Runner Facebook video; the FBI agent who later interviewed Donnelly in person viewed the filing images and verified that Donnelly was the same person interviewed. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Donnelly Statement of Facts; 12-page PDF, 4354022 bytes, SHA-256 f85d1b4a7a9eea3148af470c80dcd4303230d2ce4e0bbed24b9ee823257f5490. Image locator: PDF page index 2; printed page Statement-of-facts page containing Image 1; Image 1. Local derivative: 800x1000 JPEG, 72811 bytes, SHA-256 efa24b89cbe03ada90e8a88ab144b31ffeca6a0462c65e9b58ff4d1e84e3d925; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240730132344 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1593301/dl; capture digest 6QGOUH5WHAII3V3WZWEJPTE5BZCIARBV. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "c6f8a842-be0a-45d3-87bd-76fe4a2c8f2b",
    "slug": "daniel-shaw",
    "photo_url": "/uploads/j6-profiles/daniel-shaw-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Daniel Shaw",
    "photo_source_name": "U.S. Department of Justice filing: Shaw Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1459181/download",
    "photo_credit": "Image embedded in Shaw Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing labels the photograph as Shaw, ties the associated phone and Facebook account to Shaw through records, and says an acquaintance and employer records corroborated his identity. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Shaw Statement of Facts; 6-page PDF, 404868 bytes, SHA-256 e55427cc259757b195bb506806032617e4bff1681acda58467912a79b4af5d0d. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 6; Photograph of SHAW from his publicly available Facebook page. Local derivative: 800x1000 JPEG, 94001 bytes, SHA-256 dcdd705a9857b0f0bbf84c38a6e793852068882989538cba5a866f0f731259f0; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115952 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1459181/dl; capture digest FGGJT562WE7ZZ3XY4AWDZM6SNEWM6LQD. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "900cde70-92f2-4d68-94f1-b920179f2460",
    "slug": "dennis-sidorski",
    "photo_url": "/uploads/j6-profiles/dennis-sidorski-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Dennis Sidorski",
    "photo_source_name": "U.S. Department of Justice filing: Sidorski - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371516/download",
    "photo_credit": "Image embedded in Sidorski - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the affiant obtained this Virginia DMV photograph of Dennis Sidorski by name and date of birth and found it consistent with the man shown in the ADESA and Capitol video evidence. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Sidorski - Complaint & Statement of Facts; 9-page PDF, 595012 bytes, SHA-256 17120283fcfc9a1d62ce6ba68105ccc9b2522eadbad84780bd1e92e032a49a9c. Image locator: PDF page index 6; printed page Document 1-1, page 5 of 6; Virginia DMV photograph. Local derivative: 800x1000 JPEG, 79199 bytes, SHA-256 98fb363b8f5fcdc839add31b92d12db448390a3f6a39683df34bcbff8f1968f6; Person-specific crop from the cited filing image, resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115938 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371516/dl; capture digest VVII7OAUQ3GUS6UK6W6I27ELP4MUHSH3. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
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
