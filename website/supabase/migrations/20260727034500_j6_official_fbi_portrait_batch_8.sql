-- Replace 13 face-free archive cards with identity-verified portraits from
-- preserved FBI January 6 AFO image pages. Official USAO records establish
-- the exact name-to-AFO-number crosswalk for every row.
--
-- The source frames remain in the conservative documented-editorial-use
-- state because official publication does not, by itself, prove that the
-- underlying frame was created by a federal employee or is otherwise free of
-- third-party rights.

with portrait_source (
  profile_id,
  expected_slug,
  expected_name,
  afo_number,
  source_variant,
  source_dimensions,
  source_format,
  source_bytes,
  source_sha256,
  lawfare_page,
  original_fbi_url,
  official_identity_source_url,
  local_url,
  local_dimensions,
  crop_box,
  local_sha256
) as (
  values
    (
      '86e81065-ff96-419d-8201-39444f5c2b8a'::uuid,
      'barton-shively',
      'Barton Wade Shively',
      55,
      'Photograph #55 - AFO (Arrested)',
      '889x874',
      'PNG',
      659541,
      '4b41dab68f24106d0743f927da3b63aac1b2451ab33f19b5c74ee5225779726e',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-photograph-55-afo-arrested.png-image_view_fullscreen-9dbc1df5.html',
      'https://fbi.gov/wanted/capitol-violence-images/photograph-55-afo-arrested.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/pennsylvania-man-sentenced-assaulting-officers-during-jan-6-capitol-breach-1',
      '/uploads/j6-profiles/barton-shively.jpg',
      '889x765',
      '0,0,889,765',
      '9fb25e8fe9d967e7b3ea56311e50a9d01e29f877806184a79a179f19239b1450'
    ),
    (
      '227ffc24-ad70-4fcd-9124-39a35d9bd6e6'::uuid,
      'david-mehaffie',
      'David Mehaffie',
      86,
      'Photograph #86 - AFO',
      '888x692',
      'PNG',
      518893,
      'cf0733499cfe6e258d2bd99be9fbe723c18be7d0f4df4b13a81f347c066b21a0',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-photograph-86-afo-1-19-2021.png-image_view_fullscreen-9a8d563d.html',
      'https://fbi.gov/wanted/capitol-violence-images/photograph-86-afo-1-19-2021.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/connecticut-man-sentenced-felony-and-misdemeanor-charges-related-capitol-breach',
      '/uploads/j6-profiles/david-mehaffie.jpg',
      '888x692',
      null,
      '7b5413a8aed67b4034c16a700ade9f3cc92b0e38734c70ca3d478bbed4f07824'
    ),
    (
      '0aa28314-6aeb-4e82-a80c-78ccf2f3d2ff'::uuid,
      'devlyn-thompson',
      'Devlyn Thompson',
      67,
      'Photograph #67 - AFO',
      '748x692',
      'PNG',
      338858,
      '1e41b91196ac3414ef1d0cfe6fdbedd8df4c5c542ad74443dd29f4496802cfe1',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-photograph-67-afo.png-image_view_fullscreen-7bb6a8bb.html',
      'https://fbi.gov/wanted/capitol-violence-images/photograph-67-afo.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/seattle-man-sentenced-46-months-prison-assaulting-law-enforcement-during-capitol-breach',
      '/uploads/j6-profiles/devlyn-thompson.jpg',
      '748x692',
      null,
      'be8a38f4bff209bf7c93070bf6e23890eb53071356735fcbfb16ec31263101a5'
    ),
    (
      'c77f6b12-7ea8-42da-a372-b0e47f616bcb'::uuid,
      'howard-richardson',
      'Howard Charles Richardson',
      362,
      'Photograph #362 - AFO B',
      '373x537',
      'JPEG',
      31675,
      'dd2e53e3c9ab32aea70089f5b2285f7b69237b293158468489e904abc4395629',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-362b.jpg-image_view_fullscreen-9d27fa45.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-362b.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/pennsylvania-man-charged-assault-law-enforcement-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/howard-richardson.jpg',
      '373x537',
      null,
      '7bdcf15e90373e292a977a1f3411a01a27d41aca236e71bd4ef13dbdb4657282'
    ),
    (
      'b9226105-4b42-4cba-8afe-a0dc033e9466'::uuid,
      'hunter-seefried',
      'Hunter Seefried',
      18,
      'Photograph #18 (Arrested)',
      '473x976',
      'PNG',
      313544,
      '0e974f2631ad98455c3422506439b37344217e560c1e418ceac9964a89f455d7',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-18-arrested.png-image_view_fullscreen-41f509f6.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-18-arrested.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/delaware-men-found-guilty-charges-actions-related-capitol-breach-0',
      '/uploads/j6-profiles/hunter-seefried.jpg',
      '473x867',
      '0,0,473,867',
      'f1936892bd8bd0968e7f8c85afa9934c3adc378beb90f3c8ab1b21cfd6cf5f35'
    ),
    (
      'cec73387-aa09-48eb-890c-a94c7646bce9'::uuid,
      'john-gordon',
      'John Thomas Gordon',
      218,
      'Photograph #218 - AFO A',
      '208x298',
      'PNG',
      121695,
      '7404e16dc59b0d64109491f7fa99c408da57a26105bd8837b72242cf1b0a0645',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-photograph-218-afo-a.png-image_view_fullscreen-fe8571f3.html',
      'https://fbi.gov/wanted/capitol-violence-images/photograph-218-afo-a.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/west-virginia-man-sentenced-felony-charge-actions-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/john-gordon.jpg',
      '208x298',
      null,
      'd9fc7f26bcc90a7588be7eb04a0dff8200a385d1e0e92a6488788c1c38cf2e5d'
    ),
    (
      'ce3a772b-1daf-4d78-a4a8-b10c0d771b5d'::uuid,
      'joshua-hernandez',
      'Joshua Lee Hernandez',
      27,
      'Photograph #27 (Arrested)',
      '955x866',
      'JPEG',
      156868,
      'f169c48ce63557214211ee5004cee71648fbe408200379ff1b2463a5024bb81f',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-27arrest.jpg-image_view_fullscreen-3ccdd176.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-27arrest.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/texas-man-pleads-guilty-felony-charges-actions-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/joshua-hernandez.jpg',
      '955x661',
      '0,0,955,661',
      'a2cbd8d071c9102688e37113e7f44e09cb7b5321bcbb954ff2e29cd716adb16e'
    ),
    (
      'dc29431f-eba7-461e-865b-f944eb10523f'::uuid,
      'justin-jersey',
      'Justin Jersey',
      106,
      'Photograph #106 - AFO (Arrested)',
      '527x692',
      'JPEG',
      33146,
      'e0bed86bcfa26aef93f824986a8495b7b0bbcf3ba34f5593037405a1c75f953f',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-106arrest.jpg-image_view_fullscreen-0a143b2d.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-106arrest.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/michigan-man-pleads-guilty-assaulting-officers-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/justin-jersey.jpg',
      '527x588',
      '0,0,527,588',
      '76661f4196cce181f06c09619cc6d4db0dde0907c97a63797f30e1b2d083c699'
    ),
    (
      'cc93d0e9-409f-485a-8417-d0a77487becc'::uuid,
      'lewis-cantwell',
      'Lewis Easton Cantwell',
      143,
      'Photograph #143 - AFO (Arrested)',
      '304x370',
      'JPEG',
      12177,
      'a7ac8c7355d712bda3fb9df92b6f1dd669b9236bdcfbd295a2d4cb3d30e18326',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-143arrest.jpg-image_view_fullscreen-8338f2b9.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-143arrest.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/north-carolina-man-sentenced-offenses-committed-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/lewis-cantwell.jpg',
      '304x311',
      '0,0,304,311',
      '3d23748c215484f297ee7d12f2e930b5d27af07578dd1f3184bbad926c29ef2c'
    ),
    (
      'ed2bd3d2-54ab-45d5-93b6-662034172add'::uuid,
      'lucas-denney',
      'Lucas Denney',
      258,
      'Photograph #258 - AFO C',
      '278x369',
      'JPEG',
      14197,
      '8c4b6a2c9586d7317d967c9750e33763c53d55f87a92b650b4ca3f2696189377',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-258c.jpg-image_view_fullscreen-9a5b5f92.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-258c.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/texas-man-sentenced-prison-assaulting-law-enforcement-officers-during-jan-6-capitol',
      '/uploads/j6-profiles/lucas-denney.jpg',
      '278x369',
      null,
      '581ece199b08427fe4f5f500c83b5ed138001df5b105ce0780a73848cab54ac3'
    ),
    (
      'ba7d96bb-2def-4516-a184-c97a06ff2480'::uuid,
      'paul-belosic',
      'Paul Belosic',
      102,
      'Photograph #102 - AFO',
      '517x692',
      'JPEG',
      21299,
      '7817893c8e273fe2c1b52adb4f75e422ce3b7f5d050dcc50dbcf9c3a8d13daaf',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-102.jpg-image_view_fullscreen-ff97e297.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-102.jpg/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/california-man-indicted-conspiracy-and-other-offenses-related-jan-6-capitol-breach',
      '/uploads/j6-profiles/paul-belosic.jpg',
      '517x692',
      null,
      '4b627f215f6b886ad3b462464fea2320a8a2da761866a5e4133b8f7517cbdf3d'
    ),
    (
      'ec1bd031-eec4-48b8-ae71-0e19f063b1a7'::uuid,
      'peter-stager',
      'Peter Francis Stager',
      80,
      'Photograph #80 - AFO (Arrested)',
      '381x692',
      'PNG',
      215545,
      '402d8b09fca61084c6a8b1d81d0d77d21a46d17b87a8b55d94a6cb8da594ffb3',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-80-arrested.png-image_view_fullscreen-4e45998c.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-80-arrested.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/arkansas-man-pleads-guilty-felony-charge-actions-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/peter-stager.jpg',
      '381x583',
      '0,0,381,583',
      'e06e8ab157c0dfb3f11777fc8472f8129be5c658f32d23d5afd6b0daf1c86fe8'
    ),
    (
      '8af5a27c-98ce-4821-9185-954e0f7d3074'::uuid,
      'ryan-samsel',
      'Ryan Stephen Samsel',
      51,
      'Photograph #51 - AFO (Arrested)',
      '315x400',
      'PNG',
      147526,
      '754127272c5d0c3577fab22bec684eb66a28e624fd2d4155d6261531f0622d28',
      'https://lawfaremedia.github.io/jan6-doj-archive/pages/fbi-wanted/wanted-capitol-violence-images-capitol-51-arrested.png-image_view_fullscreen-2465152c.html',
      'https://fbi.gov/wanted/capitol-violence-images/capitol-51-arrested.png/image_view_fullscreen',
      'https://justice.gov/usao-dc/pr/pennsylvania-man-indicted-assault-law-enforcement-during-jan-6-capitol-breach',
      '/uploads/j6-profiles/ryan-samsel.jpg',
      '315x342',
      '0,0,315,342',
      '620d36fa05d64236487f2100754d57c84d0cbe5494f6b5ff00e7552ac306e912'
    )
)
update public.case_people as person
set
  photo_url = portrait.local_url,
  photo_alt_text = format(
    '%s, identified by the FBI as AFO number %s, in an archived January 6 evidence frame',
    portrait.expected_name,
    portrait.afo_number
  ),
  photo_source_name = 'Federal Bureau of Investigation via Lawfare Jan. 6 DOJ Archive',
  photo_source_url = portrait.lawfare_page,
  photo_credit = format(
    'FBI AFO #%s image page preserved by Lawfare from the Internet Archive; display image cropped where needed, metadata stripped and normalized to JPEG for this archive',
    portrait.afo_number
  ),
  photo_rights_status = 'documented-editorial-use',
  photo_identity_status = 'verified',
  photo_verification_notes = format(
    'Identity: the official USAO record at %s explicitly identifies %s as AFO #%s; the archive record independently matches this person to case %s. Selected source: %s, %s %s, %s bytes, SHA-256 %s. Original FBI page: %s. Local display derivative: %s JPEG%s, SHA-256 %s. Rights: the FBI published the source frame, but the underlying creator is not affirmatively established; publication is limited to documented editorial identification and does not represent the image as licensed or public domain.',
    portrait.official_identity_source_url,
    portrait.expected_name,
    portrait.afo_number,
    coalesce(person.case_number, 'not yet recorded'),
    portrait.source_variant,
    portrait.source_dimensions,
    portrait.source_format,
    portrait.source_bytes,
    portrait.source_sha256,
    portrait.original_fbi_url,
    portrait.local_dimensions,
    case
      when portrait.crop_box is null then '; metadata stripped and re-encoded'
      else format('; crop %s removed the FBI arrest-status band, then metadata was stripped and the image was re-encoded', portrait.crop_box)
    end,
    portrait.local_sha256
  ),
  photo_verified_at = now(),
  photo_is_placeholder = false,
  updated_at = now()
from portrait_source as portrait
where person.id = portrait.profile_id
  and person.slug = portrait.expected_slug
  and person.name = portrait.expected_name
  and person.is_j6_defendant = true
  and person.photo_is_placeholder = true
  and person.photo_identity_status = 'placeholder'
  and person.photo_rights_status = 'portrait-needed'
  and nullif(trim(coalesce(person.photo_url, '')), '') is null;
