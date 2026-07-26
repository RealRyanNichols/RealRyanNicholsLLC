-- Replace four more face-free archive cards with identity-verified,
-- rights-cleared portraits. Every update is restricted to the original
-- fallback state so an authentic or otherwise better image cannot be
-- overwritten by this migration.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/jon-schaffer.jpg',
  photo_alt_text = 'Photograph of Jon Ryan Schaffer performing with Iced Earth in Madrid in October 2013',
  photo_source_name = 'dr_zoidberg via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Jon_Schaffer_2013.jpg',
  photo_credit = 'dr_zoidberg, CC BY-SA 2.0; metadata stripped for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the photographer''s Flickr/Commons caption names Jon Schaffer performing with Iced Earth in Madrid; Commons structured data depicts Jon Schaffer, and the archive independently matches Jon Ryan Schaffer in case 1:21-cr-306. Captured 2013-10-23. License: CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0/. Original 630x950 JPEG SHA-256 0a9842300748c63d107e4d40af300ed28107c48d2c494be6d373b60c893fd8fb. Local 630x950 metadata-stripped derivative SHA-256 c8d55da76d8d331a839279df66b5ccaa20c0976f871247f93418f21190e44310.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'jon-schaffer'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/owen-shroyer.jpg',
  photo_alt_text = 'Photograph of Jonathon Owen Shroyer at the 2019 Women''s March in Washington, D.C.',
  photo_source_name = 'Avery Jensen via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Owen_Shroyer.jpg',
  photo_credit = 'Avery Jensen, CC BY-SA 4.0; resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: photographer Avery Jensen''s Commons caption names Owen Shroyer for Infowars at the 2019 Women''s March; Commons structured data depicts Owen Shroyer, and the archive independently matches Jonathon Owen Shroyer in case 1:21-mj-572. Captured 2019-01-20. License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Original 2590x3456 JPEG SHA-256 51e4e433cfd6edf398c202d45a8d355e33e703869b6159066e2bcc717c6c9fa3. Local 800x1067 resized derivative SHA-256 d3eb4f6aacb899432a455df0267352f6d77ea32a649dbee10c8c9d98326220c3.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'owen-shroyer'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/john-sullivan.jpg',
  photo_alt_text = 'Photograph of John Earle Sullivan at the Washington Monument in January 2021',
  photo_source_name = 'Jaydenxtime via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:John_Earle_Sullivan_(cropped).jpg',
  photo_credit = 'Jaydenxtime, CC BY-SA 4.0; source-cropped image with metadata stripped for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: photographer Jaydenxtime''s Commons caption states that the image depicts John Earle Sullivan at the Washington Monument; Commons structured data depicts John Earle Sullivan, and the archive independently matches John Earle Sullivan in case 1:21-cr-78. Captured 2021-01-28. License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Original 686x991 JPEG SHA-256 054b681d6aa4a831584bff1e1fe2828652a26729411554feb7ee2f338b90be2a. Local 686x991 metadata-stripped derivative SHA-256 ea1a771e55070711a9804c2023c571f04a485e0894c007eec6acfa4b3e99f119.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'john-sullivan'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/carol-kicinski.jpg',
  photo_alt_text = 'Photograph of Carol O''Neal Kicinski in a kitchen in 2013',
  photo_source_name = 'Carol Kicinski via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Photo_of_Carol_Kicinski_in_kitchen,_2013.jpg',
  photo_credit = 'Carol Kicinski, CC BY-SA 3.0; resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons description names gluten-free author Carol Kicinski and states that the image shows her in a kitchen; Commons categorization and VRTS permission identify the subject, and the archive independently matches Carol O''Neal Kicinski in case 1:22-cr-61. Captured/published 2013. License: CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/, with Wikimedia VRTS permission confirmed. Original 800x1196 JPEG SHA-256 759fa5d3094b142038f3092280c6f8ab9f0e5514e9e8e7031a2a2c72bb2af0ad. Local 800x1196 resized/recompressed derivative SHA-256 c362f26d8da72c83c3ec93abd8e45981c9638eb148a95bcef4ca81c5dbea3a7f.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'carol-kicinski'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
