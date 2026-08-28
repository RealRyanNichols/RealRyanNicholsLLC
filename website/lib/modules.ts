// The asking surfaces, written more than one way.
//
// The feed, the articles, the header, and the case archive do not move.
// These do: the blocks that ask a visitor for something. Same offers,
// different words, different accent, different spot in the feed, on a
// daily cycle. A returning reader should never see the identical page
// twice, and a first-time reader should never feel the furniture.

export type Copy = { kicker: string; headline: string; blurb: string };

// "Get updates" — the email and phone capture.
export const SIGNUP_COPY: readonly Copy[] = [
  {
    kicker: "Get updates",
    headline: "New posts, straight to you.",
    blurb: "No algorithm deciding whether you see it. Email or text, your call.",
  },
  {
    kicker: "Do not miss the next one",
    headline: "When I publish, you get it.",
    blurb: "X throttles me. Facebook restricts me. This list does not.",
  },
  {
    kicker: "Stay on the record",
    headline: "Get the next filing when it drops.",
    blurb: "Motions, records, and what came back. Sent the day it happens.",
  },
  {
    kicker: "Straight to you",
    headline: "Skip the feed. Get it first.",
    blurb: "One list, my words, nobody in the middle. Unsubscribe any time.",
  },
  {
    kicker: "Follow the fight",
    headline: "Know before the news does.",
    blurb: "I post the record here first. Put your address in and it finds you.",
  },
  {
    kicker: "Get updates",
    headline: "They wanted silence. Get the opposite.",
    blurb: "Every article, every filing, every receipt. Email or text.",
  },
  {
    kicker: "The list",
    headline: "Put your name where they cannot throttle it.",
    blurb: "This is the one channel no platform gets a vote on.",
  },
];

// The tip line.
export const TIP_COPY: readonly Copy[] = [
  {
    kicker: "The tip line",
    headline: "Got a story? Send it.",
    blurb: "Local, national, worldwide — or a J6 case. Anonymous, free. Ryan reads every one. →",
  },
  {
    kicker: "Send receipts",
    headline: "You know something. Put it on the record.",
    blurb: "Documents, screenshots, video, names. Anonymous if you need it that way. →",
  },
  {
    kicker: "The tip line",
    headline: "Nobody would listen to you either?",
    blurb: "I read every one myself. Bring what you have and I will tell you straight. →",
  },
  {
    kicker: "Bring it here",
    headline: "If it is true, it belongs in the record.",
    blurb: "Corruption, lawfare, a case nobody covered. Free, and you pick how public it goes. →",
  },
  {
    kicker: "The tip line",
    headline: "Say it here. I will not bury it.",
    blurb: "East Texas or anywhere else. Anonymous, free, and read by me. →",
  },
];

// "Work with Ryan" — the paid lane.
export const WORK_COPY: readonly Copy[] = [
  {
    kicker: "Work with Ryan",
    headline: "Want a site like this one — feed, evidence wall, store, the works?",
    blurb: "Ryan builds them on the same stack that runs this page. Sites, dashboards, and sourced investigations.",
  },
  {
    kicker: "Own your platform",
    headline: "Stop renting your audience from an algorithm.",
    blurb: "I built this because I needed a place nobody could take from me. I can build yours.",
  },
  {
    kicker: "Build with me",
    headline: "Your story, your record, your land.",
    blurb: "Websites, case archives, lead systems. The same machine that runs this site, pointed at your work.",
  },
  {
    kicker: "Work with Ryan",
    headline: "Thirty minutes with me gives you the next three moves.",
    blurb: "I see patterns fast and I build systems fast. Bring the mess, leave with a plan.",
  },
  {
    kicker: "Turn attention into action",
    headline: "A pretty website is not enough. It has to move people.",
    blurb: "Capture, follow up, and sell while you sleep. Built once, works every day.",
  },
];

// "About this site" — the quiet block that explains the porch.
export const ABOUT_COPY: readonly Copy[] = [
  {
    kicker: "About this site",
    headline: "",
    blurb: "This is a domain I own and a feed I write. No algorithm. No throttling. Just my words, on my front porch.",
  },
  {
    kicker: "Why this exists",
    headline: "",
    blurb: "They tried to bury me. So I built a place they do not control, and I put the record on it.",
  },
  {
    kicker: "What this is",
    headline: "",
    blurb: "Not a blog. A record. Filings, evidence, and the truth about what was done, kept where nobody can delete it.",
  },
  {
    kicker: "My front porch",
    headline: "",
    blurb: "No editor, no platform, no permission needed. I write it, I publish it, and it stays up.",
  },
  {
    kicker: "About this site",
    headline: "",
    blurb: "Everything here is mine — the domain, the words, the archive. That is the whole point.",
  },
];

// Where the asking blocks sit in the feed. Each row is one day's layout:
// which post index each block rides after. The feed itself never changes;
// only the spacing of what interrupts it does.
export const FEED_SLOTS: readonly {
  gtky: number;
  work: number;
  verse: number;
  signup: number;
  book: number;
  tip: number;
  poll: number;
}[] = [
  { gtky: 1, work: 2, verse: 4, signup: 5, book: 6, tip: 8, poll: 3 },
  { gtky: 2, work: 5, verse: 3, signup: 1, book: 8, tip: 6, poll: 4 },
  { gtky: 4, work: 1, verse: 6, signup: 8, book: 2, tip: 5, poll: 3 },
  { gtky: 1, work: 6, verse: 8, signup: 3, book: 5, tip: 2, poll: 4 },
  { gtky: 5, work: 3, verse: 1, signup: 6, book: 4, tip: 8, poll: 2 },
  { gtky: 3, work: 8, verse: 5, signup: 2, book: 1, tip: 4, poll: 6 },
  { gtky: 6, work: 4, verse: 2, signup: 5, book: 3, tip: 1, poll: 8 },
];

// The "let me get to know you" opener.
export const GTKY_KICKERS: readonly string[] = [
  "Let me get to know you",
  "Who am I talking to?",
  "Tell me who you are",
  "Before you go — two questions",
  "I like knowing who is out there",
  "Introduce yourself",
  "Say hey",
];

// The accent treatment on the two money surfaces. Written out as complete
// literal class strings — Tailwind scans source for these, so they must
// never be built by string concatenation at runtime or the CSS for them
// is never generated.
export const MONEY_SHELL_DESKTOP: readonly string[] = [
  "hidden lg:block rounded-2xl border-2 border-[var(--color-support)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]",
  "hidden lg:block rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)] p-5 shadow-[0_0_26px_rgba(23,54,93,0.18)]",
  "hidden lg:block rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]",
];

export const MONEY_SHELL_MOBILE: readonly string[] = [
  "lg:hidden my-8 rounded-2xl border-2 border-[var(--color-support)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]",
  "lg:hidden my-8 rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)] p-5 shadow-[0_0_26px_rgba(23,54,93,0.18)]",
  "lg:hidden my-8 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]",
];
