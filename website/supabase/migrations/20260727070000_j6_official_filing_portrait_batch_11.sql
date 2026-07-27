-- Replace 32 face-free archive cards with person-specific photographs
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
    "id": "0c498c3a-3f7e-434f-a587-72eb99ce2c42",
    "slug": "edward-kelley",
    "photo_url": "/uploads/j6-profiles/edward-kelley-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Edward J. Kelley",
    "photo_source_name": "U.S. Department of Justice filing: Kelley Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1499346/download",
    "photo_credit": "Image embedded in Kelley Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Paragraph 6 states that the affiant was familiar with Kelley's appearance from interviewing him and Tennessee DMV records and determined that the person in the January 5 and 6 photographs was Edward Kelley. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Kelley Statement of Facts; 14-page PDF, 5511593 bytes, SHA-256 44e3b554c1ed202991e6d776a19be3917bc499cf6988501d76b1dbfa52eb94cd. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 10; Lower-right image of Kelley in a red MAGA hat and black TCAPP shirt. Local derivative: 800x1000 JPEG, 94047 bytes, SHA-256 7d3d26d88569b209c92e6b1e885a564214c800591959f0497aebcf4230e3d453; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120007 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1499346/dl; capture digest GKGOXXFHEY36XUV55QHD6M6T2JXT4474. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "2d3e0cd8-2ffc-417a-bfc7-cb394ef21624",
    "slug": "edward-mcalanis",
    "photo_url": "/uploads/j6-profiles/edward-mcalanis-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Edward McAlanis",
    "photo_source_name": "U.S. Department of Justice filing: McAlanis Complaint",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1439611/download",
    "photo_credit": "Image embedded in McAlanis Complaint, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says a tipster who shared mutual friends with McAlanis provided Photos 1 and 2 and expressly describes Photo 1 as McAlanis outside the U.S. Capitol. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: McAlanis Complaint; 6-page PDF, 666625 bytes, SHA-256 448d14e4a2e112eeca1709c7ad90e4e8cf900cc65372a143509b324eaca0c623. Image locator: PDF page index 3; printed page Document 1-1, page 2 of 5; Photo 1, McAlanis outside the U.S. Capitol. Local derivative: 800x1000 JPEG, 169856 bytes, SHA-256 5ee91c3eec5526fb6e590e2fb593e95ebb188987323bc761d94fd079afc13c7b; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115946 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1439611/dl; capture digest VIHGJZB7AG6ERCHD5PBVRQG3X7RNXEK4. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "e13452d8-4f27-4936-9107-f1f9f461370c",
    "slug": "elijah-yazdani",
    "photo_url": "/uploads/j6-profiles/elijah-yazdani-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Elijah Yazdani",
    "photo_source_name": "U.S. Department of Justice filing: Yazdani Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1392641/download",
    "photo_credit": "Image embedded in Yazdani Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Witness 1 was shown Figures 5 through 9 and positively identified the individual as Yazdani; the affiant also compared the filing images with Yazdani's driver's-license photograph. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Yazdani Statement of Facts; 7-page PDF, 3263957 bytes, SHA-256 fd06368bb2020e48b9af6cb4ac81116d2e78516bdea83b5e7f7da9c1f5444e0c. Image locator: PDF page index 5; printed page Document 1-1, page 5 of 7; Figure 5, front-facing still of Yazdani in a red cap. Local derivative: 800x1000 JPEG, 95996 bytes, SHA-256 1c381a3f0c1e4777b6631f00ce1a43996a05466d0dc94007936e34dc046ed7ed; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115913 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1392641/dl; capture digest TNUM4FYZT3YUR3LBI2GUXGFV332BZMDG. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "e37704ef-5959-4a07-82c7-366258d9d1a3",
    "slug": "elliot-bishai",
    "photo_url": "/uploads/j6-profiles/elliot-bishai-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Elliot Bishai",
    "photo_source_name": "U.S. Department of Justice filing: Bishai & Irizarry - Statement of Facts Redacted",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1386286/download",
    "photo_credit": "Image embedded in Bishai & Irizarry - Statement of Facts Redacted, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the foreground person in Figure Six appears to be Bishai and is wearing the same clothing identified by three Civil Air Patrol witnesses who knew Bishai; a family member also confirmed that Bishai entered the Capitol and took selfies. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Bishai & Irizarry - Statement of Facts Redacted; 11-page PDF, 1070993 bytes, SHA-256 9766b387133ac68fb642978d4edf8f516ab12104a03cd24e3bd56559e360c373. Image locator: PDF page index 6; printed page Document 9-1, page 6 of 11; Figure Six, foreground person in red cap and red-and-black plaid shirt. Local derivative: 800x1000 JPEG, 91112 bytes, SHA-256 e9036ab93a1eac0fcfa309bf71c6cf959c17fa9ebd20b29095e4d4e66b0c4ecd; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120001 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1386286/dl; capture digest LKDN5IM55JMCYKTPR2CCG7ICNNMZUZ53. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "be9d2446-80f5-4bbf-988f-79f0f5266082",
    "slug": "elliot-resnick",
    "photo_url": "/uploads/j6-profiles/elliot-resnick-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Elliot Resnick",
    "photo_source_name": "U.S. Department of Justice filing: Resnick - Complaint/SOF",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1582541/download",
    "photo_credit": "Image embedded in Resnick - Complaint/SOF, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The Image 22 caption expressly identifies the red-boxed person as Resnick and states that the MPD body-camera still shows Resnick on the Capitol's west side at approximately 4:18 p.m. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Resnick - Complaint/SOF; 19-page PDF, 9192280 bytes, SHA-256 a6880d237d6677efa7f808d0a8ff0c2ed21e47de31dfa45c1353343b19ba61c8. Image locator: PDF page index 13; printed page Document 1-1, page 16 of 22; Image 22, red-boxed person at the right edge of the MPD body-camera still. Local derivative: 800x1000 JPEG, 68315 bytes, SHA-256 03eb7fbcc027128dc54d28062e46633d4efc6cb147529031f3ebbf38e5a21aba; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240920175058 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1582541/dl; capture digest GWSXVZ6ZGXR64LJWNTSGPY3OGJN4O7RN. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1a7ec10f-a4c8-4f51-bbba-e4b867d87f16",
    "slug": "eric-cantrell",
    "photo_url": "/uploads/j6-profiles/eric-cantrell-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Eric Andrew Cantrell",
    "photo_source_name": "U.S. Department of Justice filing: Cantrell Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481976/download",
    "photo_credit": "Image embedded in Cantrell Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the person in the Exhibit 8 red rectangle is Eric Andrew Cantrell, based on comparison with his Indiana BMV photograph, and that Witness 1 also identified him. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Cantrell Statement of Facts; 19-page PDF, 1276255 bytes, SHA-256 53645a3bc209ffe9938fced358e2b1d5f342cf0199b4d8a8afcb3333654ec5e9. Image locator: PDF page index 11; printed page Document 1-1, page 11 of 19; Exhibit 8, person in red rectangle wearing a plaid jacket and Carhartt hat. Local derivative: 800x1000 JPEG, 145070 bytes, SHA-256 90f51b4ff47fe3cf9d5e1c15e7e9e7a519b4ec1f59b165af382685cf088332ce; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240628010206 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481976/dl; capture digest GCODNSCE2DIZ7WKPMQSQ4XQFKUXNZX4G. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "7bc8cbea-93c2-432a-a2e5-a7f5b30dc214",
    "slug": "eric-bochene",
    "photo_url": "/uploads/j6-profiles/eric-bochene-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Eric Bochene",
    "photo_source_name": "U.S. Department of Justice filing: Bochene Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1394211/download",
    "photo_credit": "Image embedded in Bochene Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing captions Picture 4 as the Bochene Facebook profile and displays the account name Eric Bochene with the profile photograph. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Bochene Statement of Facts; 8-page PDF, 557592 bytes, SHA-256 4f66bb8faf18ac4fdf6e20a70ad0db8634c092c879bfdd79df0966bf25c21101. Image locator: PDF page index 6; printed page PDF page index 6; Picture 4, Eric Bochene Facebook profile image. Local derivative: 800x1000 JPEG, 121530 bytes, SHA-256 9817582cd7824f35d98004d14edcab98c1914af7dc37bf01a12ed8b416ce0569; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120043 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1394211/dl; capture digest 2P26FNO5X3XLGTTWVUNZBSOV555KYI5I. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f1713616-fd18-4f1d-9e5e-96aedd509bfe",
    "slug": "eric-torrens",
    "photo_url": "/uploads/j6-profiles/eric-torrens-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Eric Chase Torrens",
    "photo_source_name": "U.S. Department of Justice filing: Torrens - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371541/download",
    "photo_credit": "Image embedded in Torrens - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that an informant acquainted with Torrens identified the still-image subject in the fleece-lined white-and-gray hat as Eric Chase Torrens. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Torrens - Complaint & Statement of Facts; 9-page PDF, 483265 bytes, SHA-256 302e69d7d33e42f7b23e431b16fa4ebdefbeb44c791c83ccb1f6c7d5e8a53fda. Image locator: PDF page index 4; printed page Document 1-1, page 3 of 5; Enlarged still of the man in the fleece-lined white-and-gray hat. Local derivative: 800x1000 JPEG, 70906 bytes, SHA-256 30a682f2342eb41a56e6cb2c045f61b39300663052013a748ea0271c5bcd6c55; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240403085247 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371541/dl; capture digest M42JXNJGT2DID6RL6BFO55VRVBVKUXOB. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "750b2fda-c8ec-4d67-a890-98b2d30c906d",
    "slug": "ethan-seitz",
    "photo_url": "/uploads/j6-profiles/ethan-seitz-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Ethan C. Seitz",
    "photo_source_name": "U.S. Department of Justice filing: Seitz Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1381451/download",
    "photo_credit": "Image embedded in Seitz Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says the video shows Seitz outside the Capitol and that, in a related interview, Seitz gave his name and described entering the building; the filing circles him in the still. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Seitz Statement of Facts; 8-page PDF, 2577897 bytes, SHA-256 b1afcbc9688c8ec4e61dcfe13d9f58bea10c0db6aec01c2c5959822c1733dc0d. Image locator: PDF page index 5; printed page PDF page index 5; Red-circled seated person in the video still. Local derivative: 800x1000 JPEG, 108653 bytes, SHA-256 0f1589e7b9c7a1923b4875abd1fe6374a1d810d4e75da0a186900e490f961bcd; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120037 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1381451/dl; capture digest O74GPQBC6AUA5JQJIZZSZ2HSSJ6ICYDE. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5a0fda32-f0c9-4a65-aa5b-cca370cb56af",
    "slug": "ezekiel-stecher",
    "photo_url": "/uploads/j6-profiles/ezekiel-stecher-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Ezekiel Kurt Stecher",
    "photo_source_name": "U.S. Department of Justice filing: Stecher Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1393756/download",
    "photo_credit": "Image embedded in Stecher Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says a witness who had known Stecher for more than ten years was shown this still and positively identified Ezekiel Stecher, known to the witness as Zeke. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Stecher Complaint & Statement of Facts; 10-page PDF, 856614 bytes, SHA-256 7db4a1231a2b32f6c1be0283219aed19395e0f80218967ba913afcdeb962f26d. Image locator: PDF page index 4; printed page Document 1-1, page 3 of 9; Left-hand person in gray hood in the witness-identified still. Local derivative: 800x1000 JPEG, 99520 bytes, SHA-256 6099c4279a1b0ecf9f488348a41deba9838994fb8b38a089faa0583caece9b0c; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115952 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1393756/dl; capture digest 4OGNBZLZSYAAJENO7ZB3YRY6QRHLHHMB. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "015410ef-48d1-4a05-9439-7d9ea26508a5",
    "slug": "grayson-sherrill",
    "photo_url": "/uploads/j6-profiles/grayson-sherrill-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Grayson Sherrill",
    "photo_source_name": "U.S. Department of Justice filing: Sherrill - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1379331/download",
    "photo_credit": "Image embedded in Sherrill - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Witness One provided Figure Two and Witness Two, a family member, independently identified the person shown as Sherrill. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Sherrill - Statement of Facts; 7-page PDF, 700366 bytes, SHA-256 f4eac8e519e5ba8421b8e7e26988c1f1075e0a25c97da015302c71f9023cc3e8. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 7; Figure Two, Sherrill in a red sweatshirt by a statue. Local derivative: 800x1000 JPEG, 161391 bytes, SHA-256 802401ad65aa68226e6eaa9e5c2682d29e0215baf92a7721dcd0868b2e862b36; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240328191845 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1379331/dl; capture digest R6M3KIF2TZSONPCU337ZPUQJTXMXGFNA. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "b99a9e8b-a956-40a2-8d03-ad8f7cbb1892",
    "slug": "greg-rubenacker",
    "photo_url": "/uploads/j6-profiles/greg-rubenacker-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Greg Rubenacker",
    "photo_source_name": "U.S. Department of Justice filing: Rubenacker - Complaint & Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371506/download",
    "photo_credit": "Image embedded in Rubenacker - Complaint & Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies the Snapchat username as Greg Rubenacker and states that Rubenacker shows his face while recording himself inside the Capitol Rotunda. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Rubenacker - Complaint & Statement of Facts; 7-page PDF, 3733656 bytes, SHA-256 43f214857261f503be0f931a2d02b9b7a05096f6fd2707c795cdc3f2eac44024. Image locator: PDF page index 6; printed page Document 1-1, page 5 of 6; Figure Three, right-hand Snapchat still. Local derivative: 800x1000 JPEG, 85051 bytes, SHA-256 a9bd0c08fe6daf37d2a3dd5a164660b37ddc5b950783394bb9f8f27c7a40df66; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240130054240 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371506/dl; capture digest BWC6JJ7HEMHZFBXVLSMBADMV5RLX2THR. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "f9ad8d22-8fe9-4654-994e-650ed0fb7a40",
    "slug": "gregory-purdy",
    "photo_url": "/uploads/j6-profiles/gregory-purdy-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Gregory Richard Purdy",
    "photo_source_name": "U.S. Department of Justice filing: Purdy et al Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1458956/download",
    "photo_credit": "Image embedded in Purdy et al Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Witness 1 identified the Instagram account user GREGG54321 as Gregory Richard Purdy and that Purdy is the person shown in Figure 1. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Purdy et al Statement of Facts; 27-page PDF, 2481317 bytes, SHA-256 92e54b6a88945c14ed9f7e402d16b5ce3bb91f423a402e99cadcdb087defcf60. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 27; Figure 1, Purdy in red-white-and-blue jacket and red cap. Local derivative: 800x1000 JPEG, 111993 bytes, SHA-256 4915d9d4daabd30af47e2956cb1911429907a0dff223f2e1be8e5768620ca9f7; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115909 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1458956/dl; capture digest SWPCAVST6DAQ4U5WXWC7LWNBXVBMU4BN. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "0371d790-2d27-4590-b4b5-44c0531e5e63",
    "slug": "hatchet-speed",
    "photo_url": "/uploads/j6-profiles/hatchet-speed-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Hatchet M. Speed",
    "photo_source_name": "U.S. Department of Justice filing: Speed - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1514551/download",
    "photo_credit": "Image embedded in Speed - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies the Figure 2 person as Speed after describing witness, records, and driver-license comparison evidence specific to Hatchet M. Speed. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Speed - Statement of Facts; 11-page PDF, 5953066 bytes, SHA-256 db5ac61e460753591cda9a672e64ab9e08a8ea697397b9b17da59aa7e7f8289d. Image locator: PDF page index 6; printed page Document 1-1, page 6 of 11; Figure 2, left-hand full-body photograph. Local derivative: 800x1000 JPEG, 138456 bytes, SHA-256 0c9e2a62c9d82a485fbc19fbbeafaab7e4a23e87560d39e348a83f6c647d2c1b; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240326061528 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1514551/dl; capture digest O2NDUOUCA2DEP7AR5RFXXR7HFJPGUERU. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "352ad101-fd90-457b-a544-1fc9a7e9723a",
    "slug": "jake-maxwell",
    "photo_url": "/uploads/j6-profiles/jake-maxwell-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jake Maxwell",
    "photo_source_name": "U.S. Department of Justice filing: Maxwell Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1473291/download",
    "photo_credit": "Image embedded in Maxwell Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing labels the red-boxed person MAXWELL and the adjoining text expressly describes Maxwell's conduct in the depicted struggle. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Maxwell Statement of Facts; 10-page PDF, 1198857 bytes, SHA-256 5872404ebd54bed3ccbf4035a3d62bb12b411ab72f300c531ed9ff8518521904. Image locator: PDF page index 4; printed page PDF page index 4; Red-boxed face in MPD body-camera still. Local derivative: 800x1000 JPEG, 93037 bytes, SHA-256 b151074a5d8256ece3d6bd750e25f07902b89c41173d1379e826b169109e0852; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240331121140 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1473291/dl; capture digest FBVP4X2CUBWGRKWKGOYVMAYFF7CU45NE. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1c4555f3-bfcf-496f-a8e4-219b2e8cf944",
    "slug": "jalise-middleton",
    "photo_url": "/uploads/j6-profiles/jalise-middleton-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jalise Middleton",
    "photo_source_name": "U.S. Department of Justice filing: mmiddleton-sof.pdf",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1388961/download",
    "photo_credit": "Image embedded in mmiddleton-sof.pdf, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that JMIDDLETON posted this photograph to her Facebook account and claimed that it depicted her face after being pepper sprayed. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: mmiddleton-sof.pdf; 15-page PDF, 2237255 bytes, SHA-256 6db19478bac305537e2e8e1ce3cc1e352012b4ba2fca5febcc0c1c794324a769. Image locator: PDF page index 12; printed page Document 1-1, page 12 of 15; Left-hand aftermath photograph posted by JMIDDLETON. Local derivative: 800x1000 JPEG, 103240 bytes, SHA-256 928f51487d3be3c77bc54853634a1e260b3ece9fae6745ddb9bd029517bef7fa; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240214004352 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1388961/dl; capture digest ZFEDXFNREOJSDISHZKLFSXLXHGWURV2N. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "33ac6ada-476a-40da-9edb-7d5e73b681af",
    "slug": "james-haffner",
    "photo_url": "/uploads/j6-profiles/james-haffner-filing.jpg",
    "photo_alt_text": "Verified filing photograph of James Haffner",
    "photo_source_name": "U.S. Department of Justice filing: Haffner Loehrke Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1459171/download",
    "photo_credit": "Image embedded in Haffner Loehrke Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. Paragraph 38 says Haffner's wife's account contains multiple photographs of a person who appears to be Haffner and is identical in all material respects to the person the affiant had already identified as Haffner. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Haffner Loehrke Statement of Facts; 25-page PDF, 20120710 bytes, SHA-256 51423f263871201f9c0a66dc4fe235df4f26363f8403ddd836922121fce9e2f2. Image locator: PDF page index 23; printed page PDF page index 23, paragraph 38; Lower social-media photograph from Haffner's wife's account. Local derivative: 800x1000 JPEG, 129838 bytes, SHA-256 025f479f8ae8407521595aa2ec4c58f80e07eb37f49d9b5dbaa853b89c2e7bc4; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240524204404 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1459171/dl; capture digest YYGH6KMF4B3D7OXVW4LZ3LOLI62SGP6I. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "e21b670e-f189-4573-9d64-a25c47da1520",
    "slug": "james-little",
    "photo_url": "/uploads/j6-profiles/james-little-filing.jpg",
    "photo_alt_text": "Verified filing photograph of James Little",
    "photo_source_name": "U.S. Department of Justice filing: Little Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1385926/download",
    "photo_credit": "Image embedded in Little Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing presents the close-ups as photographs of Little and states that an FBI-recorded interview and Capitol images identified the pictured person as James Little. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Little Statement of Facts; 5-page PDF, 1990927 bytes, SHA-256 da13ab95f666cc9cff2e39be886a6593605212de0086ed360fd7ee5dc7ff6eca. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 5; Left-hand close-up at top of page. Local derivative: 800x1000 JPEG, 78624 bytes, SHA-256 7734b5a8574c21c771b2fb5d6ac2ee342b94d91e85f123834253b90d09af04c7; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240511094318 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1385926/dl; capture digest PJUVHFZUW6CJW7QHCIS3JB76WPQT53XI. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "29134606-5836-4ff4-9fd8-a6cee251a1c2",
    "slug": "james-robinson",
    "photo_url": "/uploads/j6-profiles/james-robinson-filing.jpg",
    "photo_alt_text": "Verified filing photograph of James Robinson",
    "photo_source_name": "U.S. Department of Justice filing: Robinson - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1525366/download",
    "photo_credit": "Image embedded in Robinson - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing captions the yellow-circled person as Robinson and states that a witness who had known him for fifteen years positively identified him. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Robinson - Statement of Facts; 10-page PDF, 610673 bytes, SHA-256 3e86a0bc52867acba3783dada771262f834b211a38ea53f04379339a85809383. Image locator: PDF page index 5; printed page Document 1-1, page 5 of 10; Top surveillance still, yellow-circled person. Local derivative: 800x1000 JPEG, 114031 bytes, SHA-256 959ce45464a233a57cadad835b92345660312d0530017f3e19ad5116c367b6ac; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20220816072415 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1525366/download; capture digest 3MZLKC2MEJJEODAE35YYLOYTMNR3OCSL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "b6300f5c-7e29-4692-aba6-60cf1b34320f",
    "slug": "james-brooks",
    "photo_url": "/uploads/j6-profiles/james-brooks-filing.jpg",
    "photo_alt_text": "Verified filing photograph of James Wayne Brooks",
    "photo_source_name": "U.S. Department of Justice filing: Brooks - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481136/download",
    "photo_credit": "Image embedded in Brooks - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies the images as posts from Brooks's Facebook page and compares them with Brooks's Tennessee driver's-license photograph. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Brooks - Statement of Facts; 10-page PDF, 1177875 bytes, SHA-256 f7780adb96ac49bf74e4754f61cbff5e207f343fe1891a34c9f5de107be01a1b. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 10; Upper solo image from Brooks's Facebook page. Local derivative: 800x1000 JPEG, 74203 bytes, SHA-256 af1c074c71bfbfdd3b38c6e915eb011119b89aac254af87c25e4c71899f1bb6f; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115909 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481136/dl; capture digest BRTJHDQWCNCDCUM7VNY4L6MPQLYZIHPL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "8ca26700-6cf9-4b5a-ab1b-351edebdcab3",
    "slug": "jared-cantrell",
    "photo_url": "/uploads/j6-profiles/jared-cantrell-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jared Paul Cantrell",
    "photo_source_name": "U.S. Department of Justice filing: Cantrell Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481936/download",
    "photo_credit": "Image embedded in Cantrell Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Exhibit 1 was posted to Jared Paul Cantrell's personal Instagram account and that Witness 1, who knew him, identified Cantrell in the related exhibit sequence. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Cantrell Statement of Facts; 19-page PDF, 1276255 bytes, SHA-256 53645a3bc209ffe9938fced358e2b1d5f342cf0199b4d8a8afcb3333654ec5e9. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 19; Exhibit 1, Jared Paul Cantrell Instagram selfie. Local derivative: 800x1000 JPEG, 111372 bytes, SHA-256 d3343263ad6f1fec6ad6e564f18dec6c84b8e4a6534de7b956a44dde55f634b8; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120017 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481936/dl; capture digest GCODNSCE2DIZ7WKPMQSQ4XQFKUXNZX4G. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "e5d87f69-116b-4169-93ee-4662f8e4b5d5",
    "slug": "jeffrey-register",
    "photo_url": "/uploads/j6-profiles/jeffrey-register-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jeffrey Register",
    "photo_source_name": "U.S. Department of Justice filing: Register Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1389961/download",
    "photo_credit": "Image embedded in Register Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says Register is circled in red in the page's three images and specifically describes the clothing and face-visible still. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Register Statement of Facts; 8-page PDF, 744092 bytes, SHA-256 1933f085fe4220f09a26d07b4f5e4bfbb309b48446f93ba3a94b1d841e128775. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 8; Top video still, red-circled person. Local derivative: 800x1000 JPEG, 80367 bytes, SHA-256 e7809f807767ec9d0d7549133f4429cddb2dbb16f40fc0f1d3758e2432b1fadc; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627115932 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1389961/dl; capture digest Z5YXX73Z5LCZ3XMA2VQHU77HPT7RASPA. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "a74aada3-84e3-4159-a8a6-647b8eeb3565",
    "slug": "jennifer-horvath",
    "photo_url": "/uploads/j6-profiles/jennifer-horvath-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jennifer Horvath",
    "photo_source_name": "U.S. Department of Justice filing: Horvath - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1499091/download",
    "photo_credit": "Image embedded in Horvath - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says a colleague with personal knowledge of Horvath's appearance reviewed this image and identified the woman in the red cap as Jennifer Horvath. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Horvath - Statement of Facts; 8-page PDF, 898828 bytes, SHA-256 0b63ed3d826fd956b39d90e367edc2279067570b0c89faeea73f18ffbecef248. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 8; Video still of woman in red cap holding a phone. Local derivative: 800x1000 JPEG, 88316 bytes, SHA-256 f6d4152084d78775cd8d0b8fc250a3c2cfea0c97acee75790395832a12b1d4cd; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240622160005 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1499091/dl; capture digest YXPIB6AXTKLASHSE3DWVCBLGKBEIEYWS. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "0402ec30-9341-4052-9b40-78dcbacdd324",
    "slug": "jeremiah-carollo",
    "photo_url": "/uploads/j6-profiles/jeremiah-carollo-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jeremiah Carollo",
    "photo_source_name": "U.S. Department of Justice filing: Carollo - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481606/download",
    "photo_credit": "Image embedded in Carollo - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing places a person-specific Jeremiah Carollo label directly on the red-boxed face in Photo 2 after describing driver-license comparisons for the named Carollo defendants. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Carollo - Statement of Facts; 8-page PDF, 483363 bytes, SHA-256 916cede7655bbf0242d814186637b89ce8bce2710a5ab3a704d007ae86acc8ba. Image locator: PDF page index 5; printed page Document 1-1, page 5 of 8; Photo 2, person labeled Jeremiah Carollo. Local derivative: 800x1000 JPEG, 88471 bytes, SHA-256 5ddd7ea4702e891b307b646ac715783e973c83674a4eb5bed4d4e75b7c334c1e; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240523072204 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481606/dl; capture digest RF53ADU3NAHCLURZSXP4IBCDPYVWJALL. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5a6c9a82-7ce9-46df-b04e-c1cb036ab810",
    "slug": "jesse-watson",
    "photo_url": "/uploads/j6-profiles/jesse-watson-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jesse Watson",
    "photo_source_name": "U.S. Department of Justice filing: Watson - Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1545616/download",
    "photo_credit": "Image embedded in Watson - Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing presents Image 1 as Watson and states that a subsequent public video captured Watson identifying himself by name. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Watson - Affidavit; 24-page PDF, 7047910 bytes, SHA-256 78a317962519a01d010a48495bc9755630743907f9cda10f6fa172709e0a8e5c. Image locator: PDF page index 6; printed page Document 1-1, page 6 of 24; Image 1, upper portrait in red knit cap. Local derivative: 800x1000 JPEG, 110355 bytes, SHA-256 76093bf3b84b2d559c89371407e54c62375883e26ff1b528e81bed0664323be7; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20221027063632 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1545616/download; capture digest 6XB3VFP2PW24N2RTL7UJGSMBIP7JGXWU. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1e826742-2235-4bfb-9839-11b0a23de928",
    "slug": "john-andries",
    "photo_url": "/uploads/j6-profiles/john-andries-filing.jpg",
    "photo_alt_text": "Verified filing photograph of John Daniel Andries",
    "photo_source_name": "U.S. Department of Justice filing: Andries - Complaint, Statement of Facts, & Information",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1371276/download",
    "photo_credit": "Image embedded in Andries - Complaint, Statement of Facts, & Information, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the lower USCP still shows Andries entering through a broken window and identifies him with the red arrow. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Andries - Complaint, Statement of Facts, & Information; 11-page PDF, 3275901 bytes, SHA-256 7755d882740795472e6b95970c4d42cccaa8348d1dceed550b003ec6f7cbd219. Image locator: PDF page index 5; printed page Document 1-1, page 4 of 7; Lower surveillance still, person beneath red arrow. Local derivative: 800x1000 JPEG, 104426 bytes, SHA-256 95432c0acc73d2dfbbeb67e50ad68c3f3120c8d82b482c16a0f28d6ea4699294; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240627120004 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1371276/dl; capture digest MFYBH2JSMCWOFFNHNP4WCLULAPGKNKSG. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "5b5b80ea-44f1-47e4-b2c8-d3bae435f377",
    "slug": "john-crowley",
    "photo_url": "/uploads/j6-profiles/john-crowley-filing.jpg",
    "photo_alt_text": "Verified filing photograph of John Edward Crowley",
    "photo_source_name": "U.S. Department of Justice filing: Crowley - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1529796/download",
    "photo_credit": "Image embedded in Crowley - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The John Edward Crowley section says the page contains images of Crowley from Capitol surveillance and open-source videos; witness and driver-license evidence later identifies him. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Crowley - Statement of Facts; 40-page PDF, 8389056 bytes, SHA-256 6fee3c360f0e6097c3f0818299b6c0b609546f0abe6e0ba6e09392bc2b892112. Image locator: PDF page index 11; printed page Document 5-1, page 11 of 40; Upper-right filing image under the John Edward Crowley heading. Local derivative: 800x1000 JPEG, 119945 bytes, SHA-256 7eedbcd0ee100973d88f6cb6229be2bf3a04be1911de63b9fbb1799fc645ac1c; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20220902094757 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1529796/download; capture digest IXQMYW5KUTH3QD3B32MDP4YMNTQMMC4W. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "26e174c6-a909-4e71-a7d4-73f91a6b1d73",
    "slug": "john-juran",
    "photo_url": "/uploads/j6-profiles/john-juran-filing.jpg",
    "photo_alt_text": "Verified filing photograph of John Juran",
    "photo_source_name": "U.S. Department of Justice filing: Juran Complaint & Affidavit",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1395351/download",
    "photo_credit": "Image embedded in Juran Complaint & Affidavit, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that Photo 1 is a known image of Juran obtained from the New York State Department of Motor Vehicles. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Juran Complaint & Affidavit; 10-page PDF, 1000242 bytes, SHA-256 894ef226d5fe7ca0c640b91ec04064c8979aa7a49471866a75e250af55ed5069. Image locator: PDF page index 4; printed page PDF page index 4, Photo 1; Photo 1, New York DMV photograph. Local derivative: 800x1000 JPEG, 94011 bytes, SHA-256 bbbdfb1a5e672049d9978b3923bb71e4b2bb045a8ce2c9472b0369f57651b461; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20240330175717 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1395351/dl; capture digest KBWJLWDGU7MU7XJFGFCA3QINTHWF6QVN. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "31a290e3-003a-4642-908a-74354c298ec0",
    "slug": "john-cameron",
    "photo_url": "/uploads/j6-profiles/john-cameron-filing.jpg",
    "photo_alt_text": "Verified filing photograph of John M. Cameron",
    "photo_source_name": "U.S. Department of Justice filing: Cameron - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1481126/download",
    "photo_credit": "Image embedded in Cameron - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing identifies the Facebook account as John Cameron's and presents Figure 4 as an image Cameron posted of himself. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Cameron - Statement of Facts; 6-page PDF, 416704 bytes, SHA-256 eee4c8b4d964ae29e0b62dc0eca28c9ff1acee0d1c87fde427b2e570efcfec09. Image locator: PDF page index 4; printed page Document 1-1, page 4 of 6; Figure 4, John Cameron Facebook self-post. Local derivative: 800x1000 JPEG, 85186 bytes, SHA-256 074765a0eb2165de3e412ca8c8ab5d8d06766b8be8348647e7798c2f2433c88a; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20250121162018 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1481126/dl; capture digest 2ED5QCDFP7BTPFLKDHW5JS7NIIRHQMHT. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "ea0b5c01-9e98-4175-bf53-f9a47d8eac88",
    "slug": "jon-mott",
    "photo_url": "/uploads/j6-profiles/jon-mott-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jon Thomas Mott",
    "photo_source_name": "U.S. Department of Justice filing: Mott Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1394311/download",
    "photo_credit": "Image embedded in Mott Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing states that the Freedom News video records a person later identified as Jon Thomas Mott and places a red circle around him in the still. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Mott Statement of Facts; 10-page PDF, 5430875 bytes, SHA-256 7b85ba6892422dbacdb69718f1ffe624e5fa4cd1e204b29d906562758a2750dd. Image locator: PDF page index 2; printed page PDF page index 2; Red-circled Freedom News video still. Local derivative: 800x1000 JPEG, 130789 bytes, SHA-256 479efb84114d70d912406557ec8a38cab5d504665edea4ed27d109d97818ee0a; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20210514195350 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1394311/download; capture digest TVKN4XXCMRUP6F53PQY5H36KLG5YEAAI. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "6042c004-bf65-4448-8a59-6fe3d086f203",
    "slug": "jonathan-copeland",
    "photo_url": "/uploads/j6-profiles/jonathan-copeland-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Jonathan Joseph Copeland",
    "photo_source_name": "U.S. Department of Justice filing: Copeland - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1528781/download",
    "photo_credit": "Image embedded in Copeland - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing says two witnesses identified Copeland and that Witness 2 specifically contacted the FBI about the person in Photograph 192, reproduced as Figure 1. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Copeland - Statement of Facts; 16-page PDF, 1841121 bytes, SHA-256 e274b03ea0b3b1451077ded685f9d679c41fe9ee29c4d9dcff178edfe7ecaa84. Image locator: PDF page index 2; printed page Document 1-1, page 2 of 16; Figure 1, left FBI AOM photograph. Local derivative: 800x1000 JPEG, 85046 bytes, SHA-256 8863d9f692da4c5fe8d82bb56c94c49244e0edcc9c03f6244a677266dd27de79; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20220902094123 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1528781/download; capture digest YLANC7EAOJHUUYDMVWQCPATD7OSOPXQR. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
  },
  {
    "id": "1144d87f-cdc2-4708-a32c-71c777d0d575",
    "slug": "joseph-howe",
    "photo_url": "/uploads/j6-profiles/joseph-howe-filing.jpg",
    "photo_alt_text": "Verified filing photograph of Joseph Howe",
    "photo_source_name": "U.S. Department of Justice filing: Howe - Statement of Facts",
    "photo_source_url": "https://www.justice.gov/usao-dc/case-multi-defendant/file/1548736/download",
    "photo_credit": "Image embedded in Howe - Statement of Facts, filed in U.S. District Court; derivative crop by RealRyanNichols.com.",
    "photo_verification_notes": "Manually reviewed against the filing's person-specific wording and figure placement. The filing expressly states that the video showed Howe and describes him in the left still; the adjacent transcript attributes his on-camera statements by name. Identity is treated as verified for documentary display; copyright or reuse-license status is not inferred. Source file: Howe - Statement of Facts; 18-page PDF, 1121491 bytes, SHA-256 ff09ecfcdf733dd2692643a4b3d9c9e28415e1173f41b7d559e7a238a2d0ff42. Image locator: PDF page index 3; printed page Document 1-1, page 3 of 18; Left video still of Howe in blue knit cap and camouflage jacket. Local derivative: 800x1000 JPEG, 110060 bytes, SHA-256 84399db5ef5e77ea09be28c1eaa24b7e4aa1e084805f2abfbb84bbdb9932d960; Person-specific crop from the cited filing image, rendered at 300 dpi and resized to 800x1000 JPEG; no generative content. Acquisition: Internet Archive capture 20221110210744 of https://www.justice.gov/usao-dc/case-multi-defendant/file/1548736/download; capture digest WNMMCO6DR6EOGIXDLZVBFPPY2VMQSFYW. Rights: Identity and provenance are documented by the cited court filing. The filing does not establish copyright ownership, a public-domain dedication, or a reusable license for the embedded source image. Use only as a contextual editorial/documentary derivative with the filing citation and this rights warning; do not label it public domain or freely licensed."
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
