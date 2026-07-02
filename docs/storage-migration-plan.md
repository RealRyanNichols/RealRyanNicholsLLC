# DRAFT — Evidence storage migration plan (needs Ryan's approval; do not execute)

## Current state (by Ryan's explicit call)
The five heavy exhibits (~90 MB total) ride in the git repo and deploy as
static assets from `website/public/uploads/`:

| File | Approx size |
| --- | --- |
| ex534-fbi-302-file.pdf | ~0.5 MB |
| ex535-tyler-detention-hearing-pt1.pdf | ~24 MB |
| ex536-tyler-detention-hearing-pt2.pdf | ~24 MB |
| ex539-fanone-rescue.mov | ~20 MB |
| ex541-gohmert-greene-jail-denial.mp4 | ~20 MB |

This works today: Vercel serves them from the CDN, URLs are stable, and the
`case_documents.file_url` values point at `/uploads/...`.

## Why migrate later
- Every clone/deploy carries ~90 MB of binary history forever; each future
  exhibit compounds it.
- Git is a poor home for large media (slow clones, no range requests
  guarantees, repo bloat is permanent even after deletion).
- Supabase Storage gives the archive an unlimited-growth home with the same
  public-read model the site already uses for `post-media` / `case-scans`.

## The plan (one sitting, ~30 minutes, reversible)
1. **Create bucket** `case-files` (public read, no public write):
   `insert into storage.buckets (id, name, public) values ('case-files','case-files', true);`
   plus RLS: allow `select` to `anon`, writes only via service role.
2. **Upload the five files** with the same basenames
   (`supabase storage cp` via CLI from the Mac, or dashboard drag-drop) →
   URLs become
   `https://rpchhzncxigczfojfdtc.supabase.co/storage/v1/object/public/case-files/<name>`.
3. **Rewrite the pointers** (data only, no deploy):
   `update case_documents set file_url = replace(file_url, '/uploads/', 'https://rpchhzncxigczfojfdtc.supabase.co/storage/v1/object/public/case-files/') where file_url like '/uploads/ex53%' or file_url like '/uploads/ex54%';`
   (Scoped to the five heavy files; `ex537/538/540/542` are small and can
   stay in-repo or move too — Ryan's call.)
4. **Verify** each document page renders + downloads (five clicks).
5. **Remove the repo copies** in a follow-up commit
   (`git rm website/public/uploads/ex53*.{pdf,mov} ex541*.mp4`), keeping a
   redirect map in `next.config` (`/uploads/ex535-… → storage URL`) for any
   link already shared in the wild.
   Note: git HISTORY keeps the blobs; if repo size matters later, a history
   rewrite (`git filter-repo`) is a separate, riskier decision — not part of
   this plan.
6. **Mux consideration** (from the original spec): `ex539-fanone-rescue.mov`
   can additionally be uploaded to Mux for inline PLAYBACK (the storage/repo
   copy stays the canonical download). That's an enhancement, not part of the
   move.

## Rollback
Step 3 is a single `update` with an exact inverse; the repo copies remain
deployed until step 5, so nothing breaks mid-migration.

**Status: awaiting Ryan's go/no-go. Nothing above has been executed.**
