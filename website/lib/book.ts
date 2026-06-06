// Single source of truth for the Fighting Shadows book section.
//
// Phase 1 is UI-only. Prices and copy live here so that later phases can map
// each tier `slug` to a real Stripe Price ID (Phase 3) and a fulfillment
// record (Phase 4) without touching page markup. To change a price or the
// copy, edit this file.

export const BOOK = {
  title: "Fighting Shadows",
  subtitle: "A memoir of January 6, political persecution, and fighting back.",
  author: "Ryan Nichols",
  cover: "/uploads/book-cover.png",
  ogImage: "/uploads/book-og.png",
  // The working positioning paragraph — first person, careful, direct.
  positioning:
    "This is a first-person account of January 6 — the road into it, the “Summer of Love,” the 2020 election, the events in Washington, D.C., the D.C. jail, forced vaccination, solitary confinement, abuse, coerced plea pressure, due process violations, and the fight to put the full record in public view.",
} as const;

export type BookTierSlug =
  | "early_release_digital"
  | "signed_paperback_preorder"
  | "founding_supporter_edition";

export type BookTier = {
  slug: BookTierSlug;
  name: string;
  priceUsd: number;
  tagline: string;
  includes: string[];
  featured?: boolean;
  /** If set, the edition is capped at this many — drives the scarcity badge. */
  limited?: number;
};

// The three pre-order offers. `priceUsd` is the suggested price; Phase 3 will
// attach a Stripe Price ID per slug.
export const BOOK_TIERS: BookTier[] = [
  {
    slug: "early_release_digital",
    name: "Early Release Digital Edition",
    priceUsd: 29,
    tagline: "Read it first, the moment it is ready.",
    includes: [
      "Early digital edition",
      "Final PDF copy",
      "Book update emails",
      "Chapter release updates when available",
    ],
  },
  {
    slug: "signed_paperback_preorder",
    name: "Signed Paperback Preorder",
    priceUsd: 79,
    tagline: "A signed copy, plus the digital edition.",
    includes: [
      "Signed paperback when printed",
      "Digital edition",
      "Book update emails",
    ],
    featured: true,
  },
  {
    slug: "founding_supporter_edition",
    name: "Founding Supporter Edition",
    priceUsd: 250,
    tagline: "Stand on the record from day one.",
    limited: 250,
    includes: [
      "Signed & numbered copy (limited run)",
      "Digital edition",
      "Evidence appendix access when available",
      "Your name listed as an early supporter — if you opt in",
      "A personal thank-you from Ryan",
      "Supporter updates",
    ],
  },
];

// Why the pre-order costs what it does. The framing is both/and: you are
// backing the work AND getting exclusive founding access before Amazon.
export const WHY_PRICE: { title: string; body: string }[] = [
  {
    title: "You are funding the fight",
    body: "Every pre-order goes straight into putting the full record in public view — the filings, the footage, and the account they would rather stay buried. Direct support, no middleman.",
  },
  {
    title: "You get it first, before Amazon",
    body: "Founding editions ship before the book ever reaches Amazon — early, signed, and numbered for the people who showed up first.",
  },
  {
    title: "It is more than a book",
    body: "The evidence appendix ties the story to the documented record. You are not just reading an account — you are holding the receipts.",
  },
];

// What the book covers — grounded in the positioning, framed as a first-person,
// documented account.
export const BOOK_COVERS: { title: string; body: string }[] = [
  {
    title: "The road in",
    body: "How a Marine and a search-and-rescue volunteer ended up in Washington on January 6 — in my own words.",
  },
  {
    title: "The summer of 2020",
    body: "The “Summer of Love,” the unrest the country was told to accept, and the double standard I watched take shape.",
  },
  {
    title: "The 2020 election",
    body: "What I believed, what I questioned, and why I went to D.C. — told straight, not spun.",
  },
  {
    title: "January 6 in D.C.",
    body: "What I saw and what I did that day, set against the bodycam and the record I have spent years pulling into public view.",
  },
  {
    title: "The D.C. jail",
    body: "Nearly four years in the federal system, including the conditions I experienced and documented inside the D.C. jail.",
  },
  {
    title: "Forced vaccination & solitary",
    body: "Forced vaccination, solitary confinement, and treatment I raised through grievances and filings.",
  },
  {
    title: "Coerced plea pressure",
    body: "The pressure to plead, the due-process failures I lived, and what it costs to insist on a defense.",
  },
  {
    title: "Putting the record in public",
    body: "Why I publish everything — and how this book connects to the archive of filings, transcripts, and evidence.",
  },
];

export type BookUpdateStatus =
  | "Announcement"
  | "Writing"
  | "Editing"
  | "Production";

export type BookUpdate = {
  date: string;
  title: string;
  body: string;
  status: BookUpdateStatus;
};

// Hardcoded for Phase 1. Structured so it can move to Supabase or a CMS later
// without changing the page.
export const BOOK_UPDATES: BookUpdate[] = [
  {
    date: "June 2026",
    status: "Announcement",
    title: "The book has a home",
    body: "Fighting Shadows now has its own section on RealRyanNichols.com. This is where the story, the pre-order, and every update will live — here first, before it ever goes to Amazon.",
  },
  {
    date: "June 2026",
    status: "Writing",
    title: "Writing straight from the record",
    body: "I am building the manuscript from my own notes, filings, grievances, and transcripts, so the account stays grounded in the documented record — not memory alone.",
  },
  {
    date: "In progress",
    status: "Production",
    title: "Editing and printing schedule",
    body: "Delivery dates will be announced here as the manuscript, editing, and printing schedule is finalized. Get on the list and you will hear it first.",
  },
];

export const BOOK_FAQ: { q: string; a: string }[] = [
  {
    q: "When will the book ship?",
    a: "There is no locked date yet. The manuscript, editing, and printing schedule are being finalized, and every milestone is posted on the Updates page. Pre-order and you will be first to know.",
  },
  {
    q: "Why buy here instead of Amazon?",
    a: "Buying direct funds the work directly and gets you founding access — the early editions, the updates, and the evidence appendix — before the book reaches Amazon.",
  },
  {
    q: "What about refunds?",
    a: "Pre-order terms and the refund policy will be posted clearly before any charge is finalized. The intent is simple: this should feel safe, not risky.",
  },
  {
    q: "What formats are there?",
    a: "A digital edition (PDF) and a signed paperback. The Founding Supporter Edition adds the evidence appendix when it is available.",
  },
  {
    q: "Is this legally careful?",
    a: "Yes. This is a first-person memoir and documented account. Where events rest on my recollection, I say so; where there are records — filings, transcripts, grievances — I reference them.",
  },
  {
    q: "Will my name be public if I buy?",
    a: "No — unless you choose the Founding Supporter Edition and opt in to be listed as an early supporter. Otherwise your purchase stays private.",
  },
];
