-- Replace four more face-free archive cards with identity-verified,
-- rights-cleared portraits. Every update is restricted to the original
-- fallback state so an authentic or otherwise better image cannot be
-- overwritten by this migration.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/zachary-rehl.jpg',
  photo_alt_text = 'Photograph of Zachary Rehl at a Philadelphia political event on November 1, 2020',
  photo_source_name = 'Rhea Ball via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Zach_Rehl_-_Leader_of_the_Philly_Proud_Boys_(50558087973)_(cropped).jpg',
  photo_credit = 'Rhea Ball, CC BY 2.0; cropped by the Commons source and resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: photographer Rhea Ball''s Commons/Flickr caption names Zach Rehl as the leader of the Philadelphia Proud Boys; DOJ''s 2023 sentencing release independently identifies Zachary Rehl of Philadelphia, and the archive matches him to case 1:21-cr-175. Captured 2020-11-01. License: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/. Original 1940x1941 JPEG SHA-256 c8d94b528cf89b3491fa66aaa063108b9a10f9c6109cf3ecd14bb740e5d84b91. Local 800x800 derivative SHA-256 108df043cfb88791ce5a47db31d5ded27ca1063d485f992f57afb19c1e9ec9ca.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'zachary-rehl'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/jeremy-bertino.jpg',
  photo_alt_text = 'Photograph of Jeremy Bertino at a Raleigh political event on November 28, 2020',
  photo_source_name = 'Anthony Crider via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Proud_Boy_Jeremy_Bertino_wearing_a_Right_Wing_Death_Squad_(RWDS)_patch_in_Raleigh_(2020_Nov)_(3x4_cropped).jpg',
  photo_credit = 'Anthony Crider, CC BY 2.0; cropped by the Commons source and resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: photographer Anthony Crider''s Commons/Flickr caption names Jeremy Bertino at a Raleigh event; DOJ''s 2022 plea release independently identifies Jeremy Bertino, and the archive matches him to case 1:22-cr-329. Captured 2020-11-28. License: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/. Original 3600x4806 JPEG SHA-256 0ceeac01ff5ea5828d11db64932fcad91964dd9eb9d408241edb0d3f229c1a2c. Local 800x1068 derivative SHA-256 57835798bfdb99f09631115bf1cc3433e2a07bdd130b7dd7a2593b8e423ef412.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'jeremy-bertino'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/jay-johnston.jpg',
  photo_alt_text = 'D.C. police body-camera still showing Jay James Johnston among officers and the Capitol crowd on January 6, 2021',
  photo_source_name = 'Metropolitan Police Department of the District of Columbia via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Jay_Johnston_Capitol-riot-actor-arrested.jpg',
  photo_credit = 'Metropolitan Police Department of the District of Columbia; public domain/CC0; metadata stripped for the archive',
  photo_rights_status = 'public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons caption identifies Jay Johnston in a D.C. police body-camera still at the Capitol; DOJ independently identifies Jay James Johnston as FBI AFO/BOLO 247, and the archive matches him to magistrate case 23-mj-00115. Captured 2021-01-06. Rights: D.C. government work marked public domain and CC0 by Commons. Original 780x439 JPEG SHA-256 f923530dd238374b6b5b4a7866d55f72e768cae68645057c89aee9ed5ab4aa2b. Local 780x439 metadata-stripped derivative SHA-256 309cdf089b68926f1c25762d44a469efaf54db754b3cb1c46bdeaa63d72d35b6.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'jay-johnston'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/joseph-hackett.jpg',
  photo_alt_text = 'Pinellas County Sheriff booking photograph of Joseph Hackett',
  photo_source_name = 'Pinellas County Sheriff''s Office via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Joseph_Hackett_Mugshot.jpg',
  photo_credit = 'Pinellas County Sheriff''s Office public record; Wikimedia Commons PD Florida; resized and metadata stripped for the archive',
  photo_rights_status = 'public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons record identifies this as Joseph Hackett''s Pinellas County Sheriff booking photograph and categorizes it with the Oath Keepers; DOJ independently identifies Joseph Hackett of Florida, and the archive matches him to case 1:22-cr-00015-APM. Commons records 2021-05-26 for the photograph, while DOJ says Hackett was arrested on 2021-05-28; the two-day discrepancy is preserved and not resolved by inference. Rights: public record marked PD Florida by Commons. Original 828x1055 JPEG SHA-256 8a315e33290580bbd35ce4e423863ec7a9f45a4b08a155348164522a1d111a07. Local 800x1019 metadata-stripped derivative SHA-256 7145a5784ce44a3260a0e2528fd4d1a34058549dab7a32ded830b223b8e0bec5.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'joseph-hackett'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
