# NPR documentary portrait sync

## Purpose

Replace face-free archive cards with real, low-resolution identification
images where the public J6 profile and NPR's *The Capitol Charges* database
have one unique exact full-name match.

This is an editorial display source, not a claim that the image is licensed,
public domain, owner approved, or available for downstream reuse.

## Source

- Database: https://apps.npr.org/jan-6-archive/database.html
- Asset namespace:
  `https://apps.npr.org/jan-6-archive/assets/synced/images/database/`
- NPR's database photo-credit line begins with `Department of Justice` and
  separately names exceptions.
- DOJ reuse guidance: https://www.justice.gov/legalpolicies

The live credit line is read on every sync. The job fails closed if it no
longer begins with the reviewed DOJ attribution or introduces a new named
exception.

## Publication rules

The automated sync may publish a source image only when all of these are true:

1. The site profile is public and marked as a January 6 defendant.
2. The profile has an explicit `portrait-needed` placeholder state.
3. Exactly one public profile and exactly one published NPR record share the
   same normalized full name.
4. NPR supplies a photo asset for that record.
5. The person is not one of NPR's separately credited press, wire, booking,
   legislative, or other named photo exceptions.
6. The asset remains inside NPR's reviewed J6 image namespace.
7. The response succeeds as JPEG, PNG, or WebP and its byte signature agrees
   with the declared content type.

Existing licensed, verified-public-domain, owner-approved, editorial, pending,
or rejected images are never overwritten by this job.

## Public labeling

Published rows use:

- `photo_rights_status = documented-editorial-use`
- `photo_identity_status = verified`
- `photo_is_placeholder = false`

Directory cards and profile pages label this state as documented editorial use
and link back to the source. They do not call it rights-cleared or
public-domain. A verified profile owner can replace it with an owner-supplied
photo after affirming publication rights.

## Audit and rollback

The workflow writes a JSON summary for every dry run and apply run. Updates are
guarded so a row that changed after discovery is skipped rather than
overwritten. Every synchronized row retains the NPR source URL, credit
language, validation timestamp, response type, and match methodology in its
portrait provenance fields.
