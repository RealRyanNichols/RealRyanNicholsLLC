# J6 authentic portrait backfill — batch 3

## Scope

This batch replaces four face-free “Portrait Needed” archive cards with authentic photographs whose identity and publication rights were verified together. It does not change an article, global layout, menu, URL or unrelated record.

Every database update requires all of the following pre-existing values:

- `is_j6_defendant = true`
- `photo_is_placeholder = true`
- `photo_identity_status = 'placeholder'`
- `photo_rights_status = 'portrait-needed'`
- no existing `photo_url`

That guard prevents the migration from overwriting a better or concurrently verified image.

## Verified portraits

| Profile | Source and identity evidence | Rights basis | Original | Published derivative |
|---|---|---|---|---|
| Jon Ryan Schaffer | [dr_zoidberg / Commons caption](https://commons.wikimedia.org/wiki/File:Jon_Schaffer_2013.jpg) names Jon Schaffer performing with Iced Earth in Madrid; structured depiction and archive case `1:21-cr-306` corroborate identity | CC BY-SA 2.0 | 630×950 JPEG; SHA-256 `0a9842300748c63d107e4d40af300ed28107c48d2c494be6d373b60c893fd8fb` | 630×950 JPEG; SHA-256 `c8d55da76d8d331a839279df66b5ccaa20c0976f871247f93418f21190e44310` |
| Jonathon Owen Shroyer | [Avery Jensen / Commons caption](https://commons.wikimedia.org/wiki/File:Owen_Shroyer.jpg) names Owen Shroyer for Infowars at the 2019 Women’s March; structured depiction and archive case `1:21-mj-572` corroborate identity | CC BY-SA 4.0 | 2590×3456 JPEG; SHA-256 `51e4e433cfd6edf398c202d45a8d355e33e703869b6159066e2bcc717c6c9fa3` | 800×1067 JPEG; SHA-256 `d3eb4f6aacb899432a455df0267352f6d77ea32a649dbee10c8c9d98326220c3` |
| John Earle Sullivan | [Jaydenxtime / Commons caption](https://commons.wikimedia.org/wiki/File:John_Earle_Sullivan_(cropped).jpg) identifies Sullivan at the Washington Monument; structured depiction and archive case `1:21-cr-78` corroborate identity | CC BY-SA 4.0 | 686×991 JPEG; SHA-256 `054b681d6aa4a831584bff1e1fe2828652a26729411554feb7ee2f338b90be2a` | 686×991 JPEG; SHA-256 `ea1a771e55070711a9804c2023c571f04a485e0894c007eec6acfa4b3e99f119` |
| Carol O’Neal Kicinski | [Carol Kicinski / Commons description](https://commons.wikimedia.org/wiki/File:Photo_of_Carol_Kicinski_in_kitchen,_2013.jpg) names the gluten-free author shown in the kitchen; Commons categorization, VRTS permission and archive case `1:22-cr-61` corroborate identity | CC BY-SA 3.0 with VRTS permission confirmed | 800×1196 JPEG; SHA-256 `759fa5d3094b142038f3092280c6f8ab9f0e5514e9e8e7031a2a2c72bb2af0ad` | 800×1196 JPEG; SHA-256 `c362f26d8da72c83c3ec93abd8e45981c9638eb148a95bcef4ca81c5dbea3a7f` |

## Withheld candidates

- Rachel Powell’s Commons file was not used. Its metadata calls the image a mugshot while the uploader claims “own work,” so the asserted CC license does not establish the underlying photograph’s rights.
- Robert Keith Packer remains withheld because the federal-public-domain label conflicts with the stated non-federal regional-jail source.
- Klete Keller remains withheld because the reviewed portrait license prohibits commercial use and derivatives.
- No Richard Barnett, Olivia Pollock, Jonathan Pollock, Jessica Watkins, Guy Reffitt, Julian Khater or Jake Lang image was imported because a combined identity-and-rights package was not completed in this pass.

These profiles retain their face-free archive cards rather than receiving a rights-unclear or identity-uncertain image.
