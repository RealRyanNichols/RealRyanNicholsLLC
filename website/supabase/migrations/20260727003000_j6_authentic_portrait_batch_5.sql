-- Replace Josiah Kenyon's face-free archive card with an identity-verified,
-- rights-cleared crop from the FBI's public-domain AFO #94 evidence video.
-- The fallback-state guards prevent this migration from overwriting an
-- authentic or otherwise better image.

update public.case_people
set
  photo_url = '/uploads/j6-profiles/josiah-kenyon.jpg',
  photo_alt_text = 'FBI AFO number 94 evidence-video portrait of Josiah Kenyon',
  photo_source_name = 'Federal Bureau of Investigation via Wikimedia Commons',
  photo_source_url = 'https://commons.wikimedia.org/wiki/File:Capitol-violence-94-afo-010621.ogv',
  photo_credit = 'Federal Bureau of Investigation public-domain AFO #94 evidence video; portrait inset cropped and metadata stripped for the archive',
  photo_rights_status = 'verified-public-domain',
  photo_identity_status = 'verified',
  photo_verification_notes = 'Identity: the FBI evidence video labels the depicted subject AFO/BOLO #94; DOJ''s December 3, 2021 arrest release independently states that the FBI identified Josiah Kenyon as #94, and the archive matches him to case 1:21-cr-726. The April 11, 2023 sentencing release repeats the #94 identification. Captured from the FBI composite at approximately 00:10; the underlying case footage is dated 2021-01-06. Rights: Wikimedia Commons identifies the FBI-authored 55-second video as a U.S. federal government work in the public domain under 17 U.S.C. 105. Source video 1920x1080 OGV SHA-256 e5d89ce1cd72992c0c46bd298e46f61e92885f1e2efef3e9c8f2acdabffa1453. Local 286x468 metadata-stripped JPEG derivative SHA-256 e72d21b2d78d82b38072e1feef8c5cd0f7fc7394872b38e25de9a1aaa8707416.',
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
where is_j6_defendant = true
  and slug = 'josiah-kenyon'
  and photo_is_placeholder = true
  and photo_identity_status = 'placeholder'
  and photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(photo_url, '')), '') is null;
