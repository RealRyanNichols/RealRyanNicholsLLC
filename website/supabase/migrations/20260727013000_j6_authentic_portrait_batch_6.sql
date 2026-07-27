-- Replace Mitchell Paul Vukich's face-free archive card with an
-- identity-verified portrait extracted from the U.S. Capitol security-camera
-- evidence reproduced in his FBI statement of facts.
-- The fallback-state guards prevent this migration from overwriting an
-- authentic or otherwise better image.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/mitchell-vukich.svg',
  photo_alt_text = 'U.S. Capitol security-camera portrait of Mitchell Paul Vukich on January 6, 2021',
  photo_source_name = 'U.S. Capitol Police security camera via FBI statement of facts and GWU Program on Extremism',
  photo_source_url = 'https://extremism.gwu.edu/sites/g/files/zaxdzs5746/files/Mitchell%20Paul%20Vukich%20Statement%20of%20Facts.pdf',
  photo_credit = 'U.S. Capitol Police security-camera evidence reproduced in the FBI statement of facts; portrait extracted, color-normalized, resized, metadata stripped and embedded in an accessible SVG wrapper for the archive',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: page 6 of the FBI statement of facts says agents showed Mitchell Paul Vukich multiple U.S. Capitol security-camera stills during his April 26, 2021 interview and that Vukich affirmed he was the person shown wearing goggles and a distinctive T-shirt. The selected page-7 image is one of those stills. The filing identifies magistrate matter 1:21-mj-00476-GMH; the archive separately links Vukich to criminal case 1:21-cr-00539-TSC, and the DOJ defendant archive corroborates his identity and case. Capture date: 2021-01-06. Rights: the underlying security-camera frame is a work of the U.S. Capitol Police, a federal government agency, created in official duties and therefore public domain under 17 U.S.C. 105. GWU preserves the filed federal record. Source 9-page PDF, 1,512,375 bytes, SHA-256 966387e6b2b6453879877e6d0f7f7dd42043b43f2076021fcad647f2810656b4. Embedded source 436x604 JPEG SHA-256 076ca1e8064d998df5b12cd22bf42d6d15d48d2a69c2404df141ea6efa611dcb. Color-normalized 800x1108 metadata-stripped JPEG derivative SHA-256 0b366bdb0af4e3a815e80da202cefd838055148de69083697279b61619793aa1. Published 800x1108 accessible SVG wrapper SHA-256 3f0d56eb45ca9e3a31486bd8d4d0303a305546f589c039d77233d8216911f5e6.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'mitchell-vukich'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
