-- Replace six more face-free archive cards with identity-verified,
-- rights-cleared portraits. Every update is limited to the original fallback
-- state so a verified portrait can never be overwritten.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/enrique-tarrio.jpg',
  photo_alt_text = 'Photograph of Enrique Tarrio at CPAC in February 2025',
  photo_source_name = 'Gage Skidmore via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Enrique_Tarrio_(54351609240).jpg',
  photo_credit = 'Gage Skidmore, CC BY-SA 2.0; cropped and resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: Gage Skidmore''s Flickr/Commons caption names Enrique Tarrio at CPAC 2025; the Commons category identifies Tarrio, and the archive independently matches Henry "Enrique" Tarrio in docket 1:21-cr-00175-TJK. Captured 2025-02-20. License: CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0/. Original 8192x5464 JPEG SHA-256 e2401e347aeb96607dc00e62c8c35f66023754cb335f3eeacd35a8fced49b023. Local 800x1000 cropped derivative SHA-256 81e1e9812f25aeb421852e21bb51d4053af51f6cb3a0199042be2ea89c84eee2.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'enrique-tarrio'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/ethan-nordean.png',
  photo_alt_text = 'Photograph of Ethan Nordean near the U.S. Capitol on January 6, 2021',
  photo_source_name = 'Elvert Barnes via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Ethan_Nordean_headshot_cropped.png',
  photo_credit = 'Elvert Barnes, CC BY 2.0; cropped source image',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: Elvert Barnes''s Commons caption names Ethan Nordean near the U.S. Capitol on January 6, 2021; Commons structured data depicts Nordean, and the archive independently matches defendant Ethan Nordean in docket 1:21-cr-00175-TJK. Captured 2021-01-06. License: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/. Original and local 646x704 PNG SHA-256 c6483fb53ce1b6e59c85a2e42d0efec55171bbf0ff454088f4b9fb1790c09fe0.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'ethan-nordean'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/joseph-biggs.png',
  photo_alt_text = 'Seminole County Jail booking photograph of Joseph Randall Biggs from June 2021',
  photo_source_name = 'Seminole County Jail via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Proud_Boy_Joe_Biggs_-_Seminole_County_Jail.png',
  photo_credit = 'Seminole County Jail; Florida public record/public domain',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Seminole County Jail/Commons caption names Joe Biggs; Commons structured data depicts Joe Biggs, and the archive independently matches Joseph Randall Biggs in docket 1:21-cr-175. Captured 2021-06-28. Rights: Florida government public record/public domain. Original and local 301x376 PNG SHA-256 e31c55974a6841d32c75752f48d93f25f587c06cf7d9d0c9b07ff06761939315.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'joseph-biggs'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/stewart-rhodes.jpg',
  photo_alt_text = 'Photograph of Stewart Rhodes speaking at an event in 2011',
  photo_source_name = 'Gage Skidmore via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Stewart_Rhodes_2011.jpg',
  photo_credit = 'Gage Skidmore, CC BY 2.0; resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: Gage Skidmore''s Commons file names Stewart Rhodes; Commons structured data depicts Elmer Stewart Rhodes, and the archive independently matches Stewart Rhodes in docket 1:22-cr-00015-APM. Captured 2011. License: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/. Original 2460x2500 JPEG SHA-256 0e49c50e419b14519f2d21e7cdd522a40ff57c41a54ed6f9727481c2802d423a. Local 984x1000 resized derivative SHA-256 872122f22253ae3ddc87eccf06fd467f4e26adad3bf07b03be0bf8bf450cdd8c.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'stewart-rhodes'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/simone-gold.jpg',
  photo_alt_text = 'Photograph of Simone Melissa Gold speaking in December 2020',
  photo_source_name = 'Gage Skidmore via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Simone_Gold_(50755976658)_(1).jpg',
  photo_credit = 'Gage Skidmore, CC BY-SA 2.0; cropped source image resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: Gage Skidmore''s Flickr/Commons caption names Simone Gold at the 2020 Student Action Summit; the Commons category identifies Gold, and the archive independently matches Simone Melissa Gold in docket 1:21-cr-85. Captured 2020-12-20. License: CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0/. Original 2686x3584 JPEG SHA-256 3a9aeea2dbba9997cf7c08097b8e0e2bfa5304cde4c4dd15390c04233ee46a1d. Local 800x1067 resized derivative SHA-256 5b9accc053d81846dd1817e3d1b160e1aa680544fed80b736831d0172af5ab78.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'simone-gold'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/couy-griffin.jpg',
  photo_alt_text = 'Photograph of Couy Griffin riding a horse outside a New York courthouse in May 2024',
  photo_source_name = 'SWinxy via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:NYC_Trump_court_trial_2024-05-03_011.jpg',
  photo_credit = 'SWinxy, CC BY-SA 4.0; cropped and resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: photographer SWinxy''s Commons caption names Couy Griffin riding a horse outside the New York criminal courthouse; the Commons category identifies Griffin, and the archive independently matches Couy Griffin in docket 1:21-cr-92. Captured 2024-05-03. License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Original 3648x5472 JPEG SHA-256 4eb3c8cc2eb50c2a8ec2d355dc280703549092d865a7f8bc737ce6827f7722c8. Local 800x1000 cropped derivative SHA-256 587a559db679dd2b5d142d4d8c6180882d999f15f76eaa2a294827fd6a3e1dbc.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'couy-griffin'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
