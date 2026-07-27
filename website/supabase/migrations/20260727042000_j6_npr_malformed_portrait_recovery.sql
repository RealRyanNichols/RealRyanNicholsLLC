-- Recover three exact-match NPR J6 portraits whose remote .jpg URLs contain
-- valid non-JPEG bytes. Each local derivative was decoded, normalized to
-- embedded-sRGB PNG, visually reviewed, and tied to the named person through
-- a federal case record.
--
-- These are documented editorial-use images, not public-domain or licensed
-- assets. Every update is guarded by immutable UUID, slug, J6 status, and the
-- original placeholder state so a later portrait cannot be overwritten.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/robert-chapman-npr-portrait.png',
  photo_alt_text = 'Robert C. Chapman in the arrest photograph used to identify him in his January 6 case record',
  photo_source_name = 'NPR The Capitol Charges / U.S. Department of Justice',
  photo_source_url = 'https://apps.npr.org/jan-6-archive/database.html',
  photo_credit = 'NPR''s The Capitol Charges; database photo credit: Department of Justice (all named credit exceptions excluded)',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: NPR source asset https://apps.npr.org/jan-6-archive/assets/synced/images/database/chapman-robert-c.jpg is the exact New York State Police arrest portrait reproduced as Figure 5 on PDF page 5 of the DOJ Statement of Facts at https://www.justice.gov/usao-dc/case-multi-defendant/file/1389166/download. The DOJ record states that investigators compared the arrest photograph with Capitol footage and DMV records. Remote asset: HTTP declared image/jpeg, but the 79,590-byte file is a 200x200 RGBA PNG, SHA-256 fbeb7dd30b1ece4838ff312d648811ca1e6bc67713647d6ab52e5363a22a454f. Local derivative: decoded, embedded-sRGB 200x200 PNG, 99,923 bytes, SHA-256 02373a95a0e2bd68aa0bdee70af6d2c35ff8521664076c24cf757968b6703aa1. Rights: documented editorial use only. NPR''s database-wide credit attributes this non-exception asset to the Department of Justice, but that credit and government republication do not establish public-domain status or a transferable license; reuse rights are not represented as cleared.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = '4f049384-c0e7-4f09-8e7d-03dbf42c5731'
  and is_j6_defendant = true
  and slug = 'robert-chapman'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
update public.case_people
set
  photo_url = '/uploads/j6-profiles/willard-peart-npr-portrait.png',
  photo_alt_text = 'Willard Jake Peart in the photograph used to identify him in his January 6 case record',
  photo_source_name = 'NPR The Capitol Charges / U.S. Department of Justice',
  photo_source_url = 'https://apps.npr.org/jan-6-archive/database.html',
  photo_credit = 'NPR''s The Capitol Charges; database photo credit: Department of Justice (all named credit exceptions excluded)',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: NPR source asset https://apps.npr.org/jan-6-archive/assets/synced/images/database/peart-willard-jake.jpg is the exact beanie, crowd, and flag photograph reproduced as Figure One on PDF page 2 of the DOJ Statement of Facts at https://www.justice.gov/usao-dc/case-multi-defendant/file/1389176/download. The record states that Peart posted or supplied the photograph and describes corroboration using Capitol surveillance, Utah DMV records, and an in-person meeting. Remote asset: HTTP declared image/jpeg, but the 87,707-byte file is a 200x200 RGBA PNG, SHA-256 653317fb474a7fa53b3e556ae1cda3f7a9eeb52e91c5b2b998b944548a743227. Local derivative: decoded, embedded-sRGB 200x200 PNG, 120,343 bytes, SHA-256 72c7e88edc6b078520d97ec971d66cd59182b59f8fadb00d43f2201606314867. Rights: documented editorial use only. NPR''s database-wide credit attributes this non-exception asset to the Department of Justice, but that credit and government republication do not establish public-domain status or a transferable license; reuse rights are not represented as cleared.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = '513c12ab-4269-4360-8df3-1965be1a06b9'
  and is_j6_defendant = true
  and slug = 'willard-peart'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;

update public.case_people
set
  photo_url = '/uploads/j6-profiles/terrell-roberts-npr-portrait.png',
  photo_alt_text = 'Terrell Andrew Roberts outside the Senate Wing Door on January 6, 2021',
  photo_source_name = 'NPR The Capitol Charges / U.S. Department of Justice',
  photo_source_url = 'https://apps.npr.org/jan-6-archive/database.html',
  photo_credit = 'NPR''s The Capitol Charges; database photo credit: Department of Justice (all named credit exceptions excluded)',
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: NPR source asset https://apps.npr.org/jan-6-archive/assets/synced/images/database/roberts-terrell-andrew.jpg is the exact crop reproduced as Figure 3 on PDF page 4 of the complaint affidavit in case 1:24-mj-00032-GMH at https://storage.courtlistener.com/recap/gov.uscourts.dcd.264416/gov.uscourts.dcd.264416.1.1.pdf. The complaint documents driver-license facial-recognition matches and identification by a former employer. Remote asset: HTTP declared image/jpeg, but the 243,069-byte file is a 200x201 RGB Photoshop document with two pixel-identical scenes, SHA-256 c287a1e4b160db298ed883e1de645bffb68c0c40cbaa528d83de8f240994639b. Local derivative: the composite was decoded and normalized to an embedded-sRGB 200x201 PNG, 67,822 bytes, SHA-256 d42d75e72535343b40661d47b29d7c8ab4d0ccb59ab69a7cc670a05c94a353b2. Rights: documented editorial use only. NPR''s database-wide credit attributes this non-exception asset to the Department of Justice, but that credit and government republication do not establish public-domain status or a transferable license; reuse rights are not represented as cleared.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where id = '56902185-98c0-4d90-999b-c2303f1c621b'
  and is_j6_defendant = true
  and slug = 'terrell-roberts'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
