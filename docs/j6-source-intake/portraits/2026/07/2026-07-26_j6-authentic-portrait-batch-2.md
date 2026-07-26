# J6 authentic portrait backfill — batch 2

## Scope

This batch replaces six face-free “Portrait Needed” archive cards with authentic photographs whose identity and publication rights were verified together. It does not change an article, global layout, menu, URL or unrelated record.

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
| Henry “Enrique” Tarrio | [Gage Skidmore / Commons caption](https://commons.wikimedia.org/wiki/File:Enrique_Tarrio_(54351609240).jpg) names Tarrio at CPAC 2025; Commons categorization and archive docket `1:21-cr-00175-TJK` corroborate identity | CC BY-SA 2.0 | 8192×5464 JPEG; SHA-256 `e2401e347aeb96607dc00e62c8c35f66023754cb335f3eeacd35a8fced49b023` | 800×1000 cropped JPEG; SHA-256 `81e1e9812f25aeb421852e21bb51d4053af51f6cb3a0199042be2ea89c84eee2` |
| Ethan Nordean | [Elvert Barnes / Commons caption](https://commons.wikimedia.org/wiki/File:Ethan_Nordean_headshot_cropped.png) names Nordean near the Capitol on January 6, 2021; structured depiction and archive docket `1:21-cr-00175-TJK` corroborate identity | CC BY 2.0 | 646×704 PNG; SHA-256 `c6483fb53ce1b6e59c85a2e42d0efec55171bbf0ff454088f4b9fb1790c09fe0` | Byte-identical |
| Joseph Randall Biggs | [Seminole County Jail / Commons caption](https://commons.wikimedia.org/wiki/File:Proud_Boy_Joe_Biggs_-_Seminole_County_Jail.png) names Joe Biggs; structured depiction and archive docket `1:21-cr-175` corroborate identity | Florida government public record/public domain | 301×376 PNG; SHA-256 `e31c55974a6841d32c75752f48d93f25f587c06cf7d9d0c9b07ff06761939315` | Byte-identical |
| Stewart Rhodes | [Gage Skidmore / Commons file](https://commons.wikimedia.org/wiki/File:Stewart_Rhodes_2011.jpg) names Rhodes; structured depiction and archive docket `1:22-cr-00015-APM` corroborate identity | CC BY 2.0 | 2460×2500 JPEG; SHA-256 `0e49c50e419b14519f2d21e7cdd522a40ff57c41a54ed6f9727481c2802d423a` | 984×1000 resized JPEG; SHA-256 `872122f22253ae3ddc87eccf06fd467f4e26adad3bf07b03be0bf8bf450cdd8c` |
| Simone Melissa Gold | [Gage Skidmore / Commons caption](https://commons.wikimedia.org/wiki/File:Simone_Gold_(50755976658)_(1).jpg) names Gold at the 2020 Student Action Summit; Commons categorization and archive docket `1:21-cr-85` corroborate identity | CC BY-SA 2.0 | 2686×3584 JPEG; SHA-256 `3a9aeea2dbba9997cf7c08097b8e0e2bfa5304cde4c4dd15390c04233ee46a1d` | 800×1067 resized JPEG; SHA-256 `5b9accc053d81846dd1817e3d1b160e1aa680544fed80b736831d0172af5ab78` |
| Couy Griffin | [SWinxy / Commons caption](https://commons.wikimedia.org/wiki/File:NYC_Trump_court_trial_2024-05-03_011.jpg) names Griffin riding outside the New York courthouse; Commons categorization and archive docket `1:21-cr-92` corroborate identity | CC BY-SA 4.0 | 3648×5472 JPEG; SHA-256 `4eb3c8cc2eb50c2a8ec2d355dc280703549092d865a7f8bc737ce6827f7722c8` | 800×1000 cropped JPEG; SHA-256 `587a559db679dd2b5d142d4d8c6180882d999f15f76eaa2a294827fd6a3e1dbc` |

## Withheld candidates

- The available Klete Keller file was not used because the reviewed license prohibited commercial use and derivatives.
- The Robert Keith Packer file was not used because the Commons public-domain label conflicted with the stated non-federal jail source.
- No Rachel Powell, Richard Barnett, Jonathan Pollock or Olivia Pollock image was imported in this batch because a sufficiently strong combined identity-and-rights package was not completed during this pass.

These candidates remain face-free archive cards rather than being published on an uncertain basis.
