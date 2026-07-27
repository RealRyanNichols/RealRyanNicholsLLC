# J6 official FBI portrait batch 8

Date reviewed: 2026-07-26  
Publication state: documented editorial use  
Profiles reviewed: 16  
New portraits published: 13  
Already populated by the NPR batch and preserved: 3

## Method

Official USAO releases were used to establish an exact legal-name-to-FBI-AFO-number crosswalk. Preserved FBI image pages were then inventoried from the Lawfare Jan. 6 DOJ Archive and the Internet Archive. The strongest recognizable frame for each person was visually reviewed against the official identity record and the existing archive case record.

Every accepted source was downloaded and hashed before any derivative was produced. Red FBI “ARRESTED” status bands were removed from seven display copies; the underlying source bytes and source hash remain recorded. All display files were normalized to metadata-stripped JPEGs.

The images are published as `documented-editorial-use`, not as licensed or public-domain files. The official records establish identity, but government publication alone does not prove the authorship or downstream reuse status of every embedded frame.

## Published portraits

| Person | Case | FBI image | Source | Display |
|---|---|---:|---|---|
| Barton Wade Shively | `1:21-cr-151` | AFO #55 | 889×874 PNG, `4b41dab…9726e` | 889×765 JPEG, `9fb25e8…b1450` |
| David Mehaffie | `1:21-cr-40` | AFO #86 | 888×692 PNG, `cf07334…b21a0` | 888×692 JPEG, `7b5413a…07824` |
| Devlyn Thompson | `1:21-cr-461` | AFO #67 | 748×692 PNG, `1e41b91…02cfe1` | 748×692 JPEG, `be8a38f…01a5` |
| Howard Charles Richardson | `1:21-cr-721` | AFO #362 | 373×537 JPEG, `dd2e53e…95629` | 373×537 JPEG, `7bdcf15…57282` |
| Hunter Seefried | `1:21-cr-287` | AFO #18 | 473×976 PNG, `0e974f2…455d7` | 473×867 JPEG, `f193689…f5f35` |
| John Thomas Gordon | `1:22-cr-343` | AFO #218 | 208×298 PNG, `7404e16…a0645` | 208×298 JPEG, `d9fc7f2…f2e5d` |
| Joshua Lee Hernandez | `1:22-cr-42` | AFO #27 | 955×866 JPEG, `f169c48…b81f` | 955×661 JPEG, `a2cbd8d…db16e` |
| Justin Jersey | `1:21-cr-35` | AFO #106 | 527×692 JPEG, `e0bed86…f953f` | 527×588 JPEG, `76661f4…c699` |
| Lewis Easton Cantwell | `1:21-cr-89` | AFO #143 | 304×370 JPEG, `a7ac8c7…e18326` | 304×311 JPEG, `3d23748…9ef2c` |
| Lucas Denney | `1:22-cr-70` | AFO #258 | 278×369 JPEG, `8c4b6a2…189377` | 278×369 JPEG, `581ece1…54ac3` |
| Paul Belosic | Case number pending archive completion | AFO #102 | 517×692 JPEG, `7817893…13daaf` | 517×692 JPEG, `4b627f2…bdf3d` |
| Peter Francis Stager | `1:21-cr-00035-RC` | AFO #80 | 381×692 PNG, `402d8b0…94ffb3` | 381×583 JPEG, `e06e8ab…c86fe8` |
| Ryan Stephen Samsel | `1:21-cr-00537-JMC` | AFO #51 | 315×400 PNG, `7541272…2d28` | 315×342 JPEG, `620d36f…6e912` |

## Already populated and preserved

Barry Bennet Ramey, Jacquelyn Jennifer Starer and John Anthony Schubert received source-documented NPR/DOJ portraits before this batch was applied. Their existing images were not overwritten.

## Guardrails

The database update requires, for every person:

- the immutable profile UUID;
- the exact expected slug and current legal name;
- `is_j6_defendant = true`;
- the original `portrait-needed` / `placeholder` state; and
- an empty `photo_url`.

This prevents the batch from replacing an existing or concurrently improved portrait.
