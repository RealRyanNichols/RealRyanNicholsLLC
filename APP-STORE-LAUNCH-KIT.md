# RealRyanNichols — App Store Launch Kit

**Goal:** get RealRyanNichols.com listed as a downloadable app on the Microsoft Store, Google Play, and the Apple App Store.

**Where we are:** the site is now a real installable app (PWA) — manifest, icons, offline service worker, and store-grade metadata are live in production at realryannichols.com. That's the hard part of the engineering. What's left is (1) packaging for each store, which I do, and (2) creating the three developer accounts, which only you can do because they need your ID and your card.

I never enter payment or create accounts in your name. Everything below marked **YOUR STEP** is yours. Everything marked **I DO** is on me.

---

## Part 1 — The three accounts (YOUR STEP)

Each store charges a one-time or yearly fee and verifies your identity. Do these in your own browser. Have a government ID and a card ready.

### 1. Microsoft Store — easiest, do this first
- Sign up: partner.microsoft.com/dashboard/registration
- Cost: about $19, one time
- Account type: **Individual** (fastest). Seller name shows as your name.
- Why first: Microsoft welcomes PWAs, review is fast, and it proves the whole pipeline works before you spend on Apple.

### 2. Google Play — biggest audience
- Sign up: play.google.com/console/signup
- Cost: $25, one time
- Account type: **Individual** is simplest. (Organization is possible but now needs a D-U-N-S number, which adds days.)
- Identity check: Google will ask for a photo of your ID and an address. Normal.

### 3. Apple App Store — iPhone reach, strictest review
- Enroll: developer.apple.com/programs/enroll
- Cost: $99 per year
- Account type decision:
  - **Individual** — fastest, seller name = "Ryan Nichols".
  - **Organization** ("Real Ryan Nichols LLC") — seller name shows the LLC, but requires a free D-U-N-S number that can take a few days to issue. Get the D-U-N-S first if you want the LLC as the public seller.
- You already have the Mac you'll need to build and submit the Apple version.

**Recommendation:** start Microsoft today, Google this week, Apple once those two are moving. Tell me the moment each account is live and I'll hand you the exact package to upload.

---

## Part 2 — Packaging (I DO)

Once an account exists, I generate the store package with PWABuilder (the free Microsoft tool that turns a PWA into store packages):

- **Microsoft** → `.msix` package. Upload straight to Partner Center.
- **Google Play** → Android package (Trusted Web Activity). I also create and host the domain-verification file (`assetlinks.json`) so Google confirms you own realryannichols.com and the app opens with no browser bar.
- **Apple** → an Xcode project. You open it on your Mac, I give you the click-by-click to sign it with your Apple Developer account and submit.

You'll never touch code. Your job is: create the account, then click Upload/Submit while I read you each field.

---

## Part 3 — The store listing copy (paste-ready)

Same core copy, trimmed per store's character limits. Written to pass review — measured on the listing, full voice inside the app.

**App name**
- Primary: `Ryan Nichols`
- With tagline (where allowed): `Ryan Nichols — The Record`

**Subtitle / short line** (Apple subtitle max 30 chars)
> Father. Builder. J6 survivor.

**Short description** (Google Play, max 80 chars)
> Ryan Nichols' own platform: the record, the case, and a direct line to me.

**Full description** (Apple / Google / Microsoft)

> This is my platform. Not rented from an algorithm. Not something a social media company can throttle, bury, or shut off.
>
> I'm Ryan Nichols — a United States Marine, a Search and Rescue veteran, a father, a Christian, and a January 6 defendant who was pardoned and whose federal case was dismissed with prejudice. I spent years in federal custody. I came home and built this instead of disappearing.
>
> This app is the front door to the record:
>
> • The Case — the documents, the timeline, and the evidence, sourced and preserved.
> • The J6 Evidence Nexus — a public archive for defendants, families, attorneys, and journalists.
> • Talk to Ryan — a direct line. Ask a real question, get a real answer. I read these.
> • The Book — my story, in my words.
> • Articles and investigations — the receipts, not the rumors.
>
> I believe in due process, equal justice, transparency, and the right to defend yourself in public. The record does not lie. Release the bodycam. Show the evidence. Let the tape speak.
>
> Download it, read it, and decide for yourself.

**Keywords** (Apple, 100-char comma list, no spaces)
> januarysix,j6,veteran,marine,dueprocess,bodycam,texas,journalist,record,evidence,pardon,firstamendment

**Category:** News (primary). Secondary: Reference.

**Age rating:** expect 17+ / Mature — it's news and legal/commentary content. Answer each store's rating questionnaire honestly; mature themes are fine, they just set the rating.

**URLs the stores will ask for**
- Privacy policy: https://www.realryannichols.com/privacy
- Support: https://www.realryannichols.com/support
- Marketing / homepage: https://www.realryannichols.com

---

## Part 4 — Data & privacy disclosures (important, be accurate)

Apple ("Privacy Nutrition Labels") and Google ("Data safety") make you declare what the app collects. Your site collects real data, so declare it — inaccurate labels are the #1 avoidable rejection. Declare:

- **Email address** — when someone joins the list or leaves contact info. Linked to the user. Used for functionality + your outreach.
- **Name** — optional, when given in the quiz or chat.
- **Messages / other user content** — the chat conversations (stored so you can reply).
- **Usage / analytics + advertising IDs** — Vercel Analytics, plus the TikTok / X / Google pixels for measurement and marketing.

I'll give you the exact toggles to check in each console when you get there.

---

## Part 5 — Honest heads-up on Apple review

Apple sometimes rejects apps that are "just a website in a wrapper" (their guideline 4.2). In your favor: this app has real app features — the interactive Talk to Ryan chat, offline install, and app shortcuts. To make Apple approval more likely, the strong next add is **push notifications** ("new article," "Ryan replied to you"), which also makes the app genuinely more useful than the website. Say the word and I'll build that in before the Apple submission.

Microsoft and Google are very unlikely to have this problem.

---

## The order of operations

1. **YOUR STEP:** create the Microsoft account (~$19). Tell me when it's live.
2. **I DO:** generate the Microsoft package + listing. You upload, I read you each field.
3. Repeat for Google ($25), then Apple ($99/yr).
4. **I DO (before Apple):** optionally add push notifications to strengthen the Apple submission.

Nothing here blocks you from using the site as an installable app right now — on a phone, "Add to Home Screen" already installs it.
