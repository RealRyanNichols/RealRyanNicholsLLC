-- Replace six face-free archive cards with identity-verified, rights-cleared
-- portraits. Every update is deliberately limited to the placeholder state so
-- a later or concurrently verified image can never be overwritten.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/adam-johnson.jpg',
  photo_alt_text = 'Booking photograph of Adam Christian Johnson in the January 6 case archive',
  photo_source_name = 'Pinellas County Sheriff''s Office via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Adam_Johnson_mugshot,_Florida.jpg',
  photo_credit = 'Pinellas County Sheriff''s Office; public-domain Florida public record',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons file caption names Adam Johnson and identifies the Pinellas County Sheriff''s Office booking image; the archive record independently matches DOJ defendant Adam Johnson, docket 1:21-cr-00648-RBW. Captured circa January 2021. Rights: Florida public record/public domain. Original 291x360 JPEG SHA-256 db16b673cf24fd1d72060597c5e71f41c38b4f712186f66bfc1b5109821e8a5d. Local copy is byte-identical.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'adam-johnson'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/jacob-chansley.jpg',
  photo_alt_text = 'Photograph of Jacob Anthony Chansley speaking at AmericaFest in December 2023',
  photo_source_name = 'Gage Skidmore via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Jacob_Chansley_(53423556636)_(cropped).jpg',
  photo_credit = 'Gage Skidmore, CC BY-SA 2.0; resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the photographer''s Flickr/Commons caption names Jacob Chansley at AmericaFest 2023; Commons structured data depicts Jacob Chansley, and the archive record independently matches DOJ defendant Jacob Anthony Chansley, docket 1:21-cr-00003-RCL. Captured 2023-12-18. License: CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0/. Original 3354x4475 JPEG SHA-256 477f4c0539bb85b8c341d2696ff2ede9fa635db09129335eec1b9d1c25d164e6. Local 899x1200 resized derivative SHA-256 cc8965485c4a75d873a376a8713f26d6e2093f7e8940d00fb34cb3e969fecc57.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'jacob-chansley'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/brandon-straka.jpg',
  photo_alt_text = 'Photograph of Brandon Straka speaking at CPAC in February 2020',
  photo_source_name = 'Jared Holt via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Brandon_Straka_CPAC_2020.jpg',
  photo_credit = 'Jared Holt, CC BY-SA 4.0; resized for the archive',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: Jared Holt''s Commons caption names Brandon Straka speaking at CPAC 2020; Commons structured data depicts Brandon Straka, and the archive record independently matches DOJ defendant Brandon Straka, docket 1:21-cr-579. Captured 2020-02-28. License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Original 2708x1523 JPEG SHA-256 74359a66976843b16c41a5a700f002d4e1f6cc1baca0f0ed5df86e7307987680. Local 1600x900 resized derivative SHA-256 1e25c51d7631958ed49bffcb34d3b4f97ee0c1e41876ef95af53c656dbc229af.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'brandon-straka'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/derrick-evans.jpg',
  photo_alt_text = 'Photograph of Derrick Evans outside the Ohio Statehouse in March 2019',
  photo_source_name = 'Becker1999 via Wikimedia Commons and Flickr',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Derrick_Evans.jpg',
  photo_credit = 'Becker1999, CC BY 4.0',
  photo_rights_status = 'licensed',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons/Flickr description identifies Derrick Evans outside the Ohio Statehouse; Commons structured data depicts Derrick Evans, and the archive record independently matches DOJ defendant Derrick Evans, docket 1:21-cr-00337-RCL. Captured 2019-03-30. License: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Original and local 523x698 JPEG SHA-256 f30fb4ef004e3bdaf5e9c763d91975e791f4a066b71a80af84ef79d7bd1f3ea6.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'derrick-evans'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/kelly-meggs.jpg',
  photo_alt_text = 'Booking photograph of Kelly Meggs in the January 6 case archive',
  photo_source_name = 'U.S. Marshals Service Orlando Office via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Kelly_Meggs_mug_shot.jpg',
  photo_credit = 'U.S. Marshals Service Orlando Office; public domain',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons file description names Kelly Meggs and attributes the booking image to the U.S. Marshals Service Orlando Office; Commons structured data depicts Kelly Meggs, and the archive record independently matches DOJ defendant Kelly Meggs, docket 1:22-cr-00015-APM. Captured 2021-02-17. Rights: U.S. government/public-domain image; Commons also marks the file as a Florida public record. Original and local 530x606 JPEG SHA-256 7496d69c54c6bbd19ac57f9125598a616f868fd96f9fe40e95fb9e4ae3706c52.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'kelly-meggs'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/dominic-pezzola.png',
  photo_alt_text = 'FBI photograph of Dominic Pezzola after his January 2021 arrest',
  photo_source_name = 'Federal Bureau of Investigation via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Proud_Boy_Dominic_Pezzola_photo_of_January_30,_2021.png',
  photo_credit = 'Federal Bureau of Investigation; U.S. government public domain',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the Commons file caption names Dominic Pezzola after arrest and attributes the image to the FBI; Commons structured data and category identify Pezzola, and the archive record independently matches DOJ defendant Dominic Pezzola, docket 1:21-cr-175. Captured 2021-01-30. Rights: U.S. federal government work/public domain. Original and local 466x557 PNG SHA-256 605ba465b556755cd39e27fb339049687930603ec7246db15eaf2ddeebf730dd.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'dominic-pezzola'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
