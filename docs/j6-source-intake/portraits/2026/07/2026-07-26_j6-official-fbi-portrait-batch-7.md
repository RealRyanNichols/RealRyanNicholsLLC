# J6 official FBI portrait batch 7

Date reviewed: 2026-07-26  
Publication state: documented editorial use  
Profiles: Jonathan Munafo, Nicholas James Brockhoff, Geoffrey William Sills, Justin Lee

## Scope

This batch replaces four face-free archive cards with real person images from preserved FBI January 6 AFO image pages. The identity crosswalks come from official FBI or DOJ records and are corroborated against each archive profile and case record.

The images are not described as licensed or public domain. FBI publication establishes the official evidentiary source, but it does not by itself establish who created each underlying frame. Lawfare and the Internet Archive preserve the retired FBI pages; neither mirror supplies a new license.

## Shared identity source for AFO 153, 170 and 255

- FBI Washington Field Office, July 6, 2021: <https://fbi.gov/contact-us/field-offices/washingtondc/news/press-releases/fbi-washington-field-office-releases-new-videos-of-suspects-in-violent-assaults-on-federal-officers-at-us-capitol-seeks-publics-help-in-identifying-them-070621>
- Contemporaneous Internet Archive capture: <https://web.archive.org/web/20210706192721/https://fbi.gov/contact-us/field-offices/washingtondc/news/press-releases/fbi-washington-field-office-releases-new-videos-of-suspects-in-violent-assaults-on-afc2484f.html>
- Lawfare preservation copy: <https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-dc-field-office/contact-us-field-offices-washingtondc-news-press-releases-fbi-washington-field-office-releases-new-videos-of-suspects-in-violent-assaults-on-afc2484f.html>

The release explicitly identifies:

- Jonathan Munafo as AFO #170
- Nicholas Brockhoff as AFO #255
- Geoffrey Sills as AFO #153

## Jonathan Munafo

- Profile UUID: `f32d9e67-59c9-4a57-837e-31532eea1045`
- Profile slug: `jonathan-munafo`
- Case: `1:21-cr-330`
- Selected frame: AFO #170 C, arrested variant
- Preserved image page: <https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-170carrest.jpg-image_view_fullscreen-099d3cad.html>
- Original FBI page: <https://fbi.gov/wanted/capitol-violence-images/capitol-170carrest.jpg/image_view_fullscreen>
- Source: 110×190 JPEG; SHA-256 `e5a9e5330b8cecd72dce99a2f4f3ef969c03e27b093b5395c3ef8df9da150833`
- Published derivative: 110×155 JPEG; arrest-status band removed, metadata stripped and re-encoded; SHA-256 `79f466e7439cfeb0822ad7983881f9f099c09bd0e5cdd67898e1a38341873734`

## Nicholas James Brockhoff

- Profile UUID: `a728a9dc-a60b-4fbb-b634-33a9a72b6bc0`
- Profile slug: `nicholas-brockhoff`
- Case: `21-cr-524`
- Selected frame: AFO #255 A
- Preserved image page: <https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-255a.jpg-image_view_fullscreen-131e748a.html>
- Original FBI page: <https://fbi.gov/wanted/capitol-violence-images/capitol-255a.jpg/image_view_fullscreen>
- Source: 249×280 JPEG; SHA-256 `d7e3cfd532524a02596e75a40686b25b860fe7010efe31658395724d202e0b90`
- Published derivative: 249×280 JPEG; metadata stripped and re-encoded; SHA-256 `09f337e379f4bce07db9c143dc525cdcec859969ff13a0ee5a94885f4d611267`

## Geoffrey William Sills

- Profile UUID: `007dad1d-f518-4abb-b970-c98478b17b52`
- Profile slug: `geoffrey-sills`
- Case: `1:21-cr-40`
- Selected frame: AFO #153 B
- Preserved image page: <https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-153b.png-image_view_fullscreen-c63165c1.html>
- Original FBI page: <https://fbi.gov/wanted/capitol-violence-images/capitol-153b.png/image_view_fullscreen>
- Source: 249×269 WebP bytes published under a `.png` path; SHA-256 `96f05f45f1c712630bd92f8cd963b68b322e09bc7459033d528a2be59075d4bc`
- Published derivative: 249×269 JPEG; metadata stripped and normalized to the declared format; SHA-256 `2dc0e72f2e9492c0f1e24b0a083daf8403f4b7cb69295e115f8537613376a4e9`

## Justin Lee

- Profile UUID: `80c88653-dadc-4f9b-8a3d-eb62f5c217f9`
- Profile slug: `justin-lee`
- Case: `1:23-cr-00368-TNM`
- Official identity source: DOJ USAO-DC release 23-636, October 19, 2023: <https://www.justice.gov/usao-dc/pr/maryland-man-indicted-assaulting-law-enforcement-and-other-charges-during-jan-6-capitol>
- Official case source: D.D.C. ECF 68 on GovInfo: <https://www.govinfo.gov/content/pkg/USCOURTS-dcd-1_23-cr-00368/pdf/USCOURTS-dcd-1_23-cr-00368-0.pdf>
- Selected frame: AFO #533 E, the clearest unmasked view among preserved frames A–E
- Preserved image page: <https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-533e.jpg-view-068fc171.html>
- Original FBI page: <https://fbi.gov/wanted/capitol-violence-images/capitol-533e.jpg/view>
- Source: 218×272 JPEG, 13,467 bytes; SHA-256 `384459186a0d465ef495a82e872594495c0eacb6241f49b24c8814a5ae436f06`
- Published derivative: 218×272 JPEG; metadata stripped and re-encoded; SHA-256 `52923676fccf5120b79bf1013b13993ae2ac3c35656c976a5d9475862f394243`

## Publication guards

Each database update requires:

- the exact immutable profile UUID;
- the expected public slug;
- `is_j6_defendant = true`;
- the original `portrait-needed` / `placeholder` state; and
- an empty `photo_url`.

The migration therefore cannot overwrite an already verified or concurrently improved portrait.
