# J6 NPR malformed portrait recovery

## Purpose

Recover three exact-match profile photographs that the automated NPR portrait
sync rejected because the remote server labeled non-JPEG bytes as
`image/jpeg`.

The images are published as `documented-editorial-use`, not as licensed,
public-domain, owner-approved, or generally reusable files.

## Shared source and rights boundary

- NPR database: https://apps.npr.org/jan-6-archive/database.html
- NPR database credit: `Department of Justice`, with separately named
  exceptions excluded from automated and manual publication
- Rights label: `documented-editorial-use`
- Rights statement: NPR's database-wide credit attributes each non-exception
  asset to the Department of Justice, but that credit and government
  republication do not establish public-domain status or a transferable
  license. Reuse rights are not represented as cleared.

## Robert C. Chapman

- Profile UUID: `4f049384-c0e7-4f09-8e7d-03dbf42c5731`
- Slug: `robert-chapman`
- NPR source:
  https://apps.npr.org/jan-6-archive/assets/synced/images/database/chapman-robert-c.jpg
- Remote response: `image/jpeg`
- Actual remote format: PNG, 200×200 RGBA
- Remote bytes: 79,590
- Remote SHA-256:
  `fbeb7dd30b1ece4838ff312d648811ca1e6bc67713647d6ab52e5363a22a454f`
- Identity record:
  https://www.justice.gov/usao-dc/case-multi-defendant/file/1389166/download
- Identity location: PDF page 5, Figure 5
- Identity result: exact same arrest portrait
- Local file:
  `/uploads/j6-profiles/robert-chapman-npr-portrait.png`
- Local format and dimensions: embedded-sRGB PNG, 200×200 RGBA
- Local bytes: 99,923
- Local SHA-256:
  `02373a95a0e2bd68aa0bdee70af6d2c35ff8521664076c24cf757968b6703aa1`

The federal record identifies the source as a New York State Police arrest
photograph. It is not labeled federal public domain.

## Willard Jake Peart

- Profile UUID: `513c12ab-4269-4360-8df3-1965be1a06b9`
- Slug: `willard-peart`
- NPR source:
  https://apps.npr.org/jan-6-archive/assets/synced/images/database/peart-willard-jake.jpg
- Remote response: `image/jpeg`
- Actual remote format: PNG, 200×200 RGBA
- Remote bytes: 87,707
- Remote SHA-256:
  `653317fb474a7fa53b3e556ae1cda3f7a9eeb52e91c5b2b998b944548a743227`
- Identity record:
  https://www.justice.gov/usao-dc/case-multi-defendant/file/1389176/download
- Identity location: PDF page 2, Figure One
- Identity result: exact same beanie, crowd, and flag photograph
- Local file:
  `/uploads/j6-profiles/willard-peart-npr-portrait.png`
- Local format and dimensions: embedded-sRGB PNG, 200×200 RGBA
- Local bytes: 120,343
- Local SHA-256:
  `72c7e88edc6b078520d97ec971d66cd59182b59f8fadb00d43f2201606314867`

The record states that Peart posted or supplied the photograph. It is not
labeled public domain.

## Terrell Andrew Roberts

- Profile UUID: `56902185-98c0-4d90-999b-c2303f1c621b`
- Slug: `terrell-roberts`
- NPR source:
  https://apps.npr.org/jan-6-archive/assets/synced/images/database/roberts-terrell-andrew.jpg
- Remote response: `image/jpeg`
- Actual remote format: Photoshop document, 200×201 RGB
- Remote bytes: 243,069
- Remote SHA-256:
  `c287a1e4b160db298ed883e1de645bffb68c0c40cbaa528d83de8f240994639b`
- Identity record:
  https://storage.courtlistener.com/recap/gov.uscourts.dcd.264416/gov.uscourts.dcd.264416.1.1.pdf
- Identity location: PDF page 4, Figure 3
- Identity result: exact crop beside the gray wall outside the Senate Wing
  Door
- Recovery: ImageMagick decoded the composite; both PSD scenes were
  pixel-identical. Sharp normalized the result to embedded-sRGB PNG.
- Local file:
  `/uploads/j6-profiles/terrell-roberts-npr-portrait.png`
- Local format and dimensions: embedded-sRGB PNG, 200×201 RGB
- Local bytes: 67,822
- Local SHA-256:
  `d42d75e72535343b40661d47b29d7c8ab4d0ccb59ab69a7cc670a05c94a353b2`

The complaint describes Figure 3 as an open-source photograph. It is not
labeled public domain.

## Rejected comparison asset

Jonathan Joshua Munafo's malformed NPR file was decoded and confirmed against
the DOJ record, but it is not published. His existing FBI AFO #170 portrait is
the stronger official-source image and remains unchanged.

## Publication safeguards

- Every update requires the exact immutable profile UUID and slug.
- Every update requires the existing `portrait-needed` placeholder state.
- A newer or already verified portrait cannot be overwritten.
- Production database changes must occur only after the corresponding image
  files are live and return the expected PNG type and hashes.
