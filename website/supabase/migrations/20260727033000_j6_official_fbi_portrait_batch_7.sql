-- Replace four face-free archive cards with identity-verified portraits from
-- preserved FBI January 6 AFO image pages. These are published under the
-- archive's documented-editorial-use state: the official records establish
-- identity, but FBI publication alone does not establish that every embedded
-- source frame was created by a federal employee or is otherwise reusable.
--
-- Every portrait update is guarded by both the immutable profile UUID and the
-- original placeholder state so a later or better portrait cannot be
-- overwritten.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/jonathan-munafo.jpg',
  photo_alt_text = 'Jonathan Munafo, identified by the FBI as AFO number 170, in an archived January 6 evidence frame',
  photo_source_name = 'Federal Bureau of Investigation via Lawfare Jan. 6 DOJ Archive',
  photo_source_url = 'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-170carrest.jpg-image_view_fullscreen-099d3cad.html',
  photo_credit = 'FBI AFO #170 image page preserved by Lawfare from the Internet Archive; arrest-status band removed and image re-encoded for this archive',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the FBI Washington Field Office release dated 2021-07-06 explicitly identifies Jonathan Munafo as AFO #170; the DOJ defendant archive independently matches Jonathan J. Munafo to case 1:21-cr-330. Selected source: AFO #170 C arrested variant, 110x190 JPEG, SHA-256 e5a9e5330b8cecd72dce99a2f4f3ef969c03e27b093b5395c3ef8df9da150833. Local derivative: the red arrest-status band was removed, metadata was stripped, and the frame was re-encoded as a 110x155 JPEG, SHA-256 79f466e7439cfeb0822ad7983881f9f099c09bd0e5cdd67898e1a38341873734. Rights: the FBI published the source frame, but the underlying creator is not affirmatively established; publication is limited to documented editorial identification and does not represent the image as licensed or public domain.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = 'f32d9e67-59c9-4a57-837e-31532eea1045'
  and is_j6_defendant = true
  and slug = 'jonathan-munafo'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/nicholas-brockhoff.jpg',
  photo_alt_text = 'Nicholas James Brockhoff, identified by the FBI as AFO number 255, in an archived January 6 evidence frame',
  photo_source_name = 'Federal Bureau of Investigation via Lawfare Jan. 6 DOJ Archive',
  photo_source_url = 'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-255a.jpg-image_view_fullscreen-131e748a.html',
  photo_credit = 'FBI AFO #255 image page preserved by Lawfare from the Internet Archive; metadata stripped and image re-encoded for this archive',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the FBI Washington Field Office release dated 2021-07-06 explicitly identifies Nicholas Brockhoff as AFO #255; the DOJ defendant archive independently matches Nicholas James Brockhoff to case 21-cr-524. Selected source: AFO #255 A, 249x280 JPEG, SHA-256 d7e3cfd532524a02596e75a40686b25b860fe7010efe31658395724d202e0b90. Local derivative: metadata stripped and re-encoded as a 249x280 JPEG, SHA-256 09f337e379f4bce07db9c143dc525cdcec859969ff13a0ee5a94885f4d611267. Rights: the FBI published the source frame, but the underlying creator is not affirmatively established; publication is limited to documented editorial identification and does not represent the image as licensed or public domain.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = 'a728a9dc-a60b-4fbb-b634-33a9a72b6bc0'
  and is_j6_defendant = true
  and slug = 'nicholas-brockhoff'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/geoffrey-sills.jpg',
  photo_alt_text = 'Geoffrey William Sills, identified by the FBI as AFO number 153, in an archived January 6 evidence frame',
  photo_source_name = 'Federal Bureau of Investigation via Lawfare Jan. 6 DOJ Archive',
  photo_source_url = 'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-153b.png-image_view_fullscreen-c63165c1.html',
  photo_credit = 'FBI AFO #153 image page preserved by Lawfare from the Internet Archive; source WebP normalized to JPEG for this archive',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the FBI Washington Field Office release dated 2021-07-06 explicitly identifies Geoffrey Sills as AFO #153; the DOJ defendant archive independently matches Geoffrey William Sills to case 1:21-cr-40. Selected source: AFO #153 B, 249x269 WebP bytes published under a .png path, SHA-256 96f05f45f1c712630bd92f8cd963b68b322e09bc7459033d528a2be59075d4bc. Local derivative: metadata stripped and normalized as a 249x269 JPEG, SHA-256 2dc0e72f2e9492c0f1e24b0a083daf8403f4b7cb69295e115f8537613376a4e9. Rights: the FBI published the source frame, but the underlying creator is not affirmatively established; publication is limited to documented editorial identification and does not represent the image as licensed or public domain.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = '007dad1d-f518-4abb-b970-c98478b17b52'
  and is_j6_defendant = true
  and slug = 'geoffrey-sills'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  case_number = '1:23-cr-00368-TNM',
  photo_url = '/uploads/j6-profiles/justin-lee.jpg',
  photo_alt_text = 'Justin Lee, identified by the FBI as AFO number 533, in archived FBI frame E',
  photo_source_name = 'Federal Bureau of Investigation via Lawfare Jan. 6 DOJ Archive',
  photo_source_url = 'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-533e.jpg-view-068fc171.html',
  photo_credit = 'FBI AFO #533 image page preserved by Lawfare from the Internet Archive; metadata stripped and image re-encoded for this archive',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: DOJ USAO-DC release 23-636 dated 2023-10-19 explicitly states that the FBI Baltimore and Washington Field Offices identified Justin Lee as BOLO AFO #533. Official D.D.C. ECF 68 independently confirms case 1:23-cr-00368-TNM. Selected source: AFO #533 E, the clearest unmasked facial view among preserved frames A through E, 218x272 JPEG, 13,467 bytes, SHA-256 384459186a0d465ef495a82e872594495c0eacb6241f49b24c8814a5ae436f06. Local derivative: metadata stripped and re-encoded as a 218x272 JPEG, SHA-256 52923676fccf5120b79bf1013b13993ae2ac3c35656c976a5d9475862f394243. Rights: the FBI published the source frame, but the underlying creator is not affirmatively established; publication is limited to documented editorial identification and does not represent the image as licensed or public domain.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = '80c88653-dadc-4f9b-8a3d-eb62f5c217f9'
  and is_j6_defendant = true
  and slug = 'justin-lee'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
