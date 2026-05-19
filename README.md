# realryannichols.com

The personal feed of Ryan Nichols — husband, father, builder. Healing in public.

This repo holds the Next.js frontend for [realryannichols.com](https://realryannichols.com). Posts, comments, reactions, and email signups all live in a Supabase project; the frontend reads and writes that database directly using Supabase RLS.

## Stack

- Next.js 15 (App Router), React 19, TypeScript 5
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Deployed on Vercel

## Local development

```bash
cd website
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm install
npm run dev
# open http://localhost:3000
```

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_URL` (e.g. `https://realryannichols.com`)

## Routes

- `/` — Feed (pinned + chronological posts from `public.posts`)
- `/posts/[slug]` — Single post with comments
- `/about`, `/jan-6`, `/support`, `/community-rules`, `/privacy` — Static pages
- `/login` — Magic-link sign-in
- `/auth/callback` — OAuth/OTP callback
- `/account` — Signed-in account view
- `/api/subscribe` — POST email to `notify_signups`
- `/api/comments` — POST comment (must be signed in)
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`, `/og/[slug]` — SEO surface

## Deploy to Vercel

1. Connect this repo on [vercel.com](https://vercel.com)
2. Set the three env vars above (Production + Preview)
3. Set the project root to `website/`
4. Add the custom domain `realryannichols.com` and `www.realryannichols.com`

Comments default to `status='pending'` and are approved through Supabase Studio until an admin UI ships.
