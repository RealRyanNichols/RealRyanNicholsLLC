// "The Fights" — Ryan's issue advocacy. Each fight gets its own page at
// /fights/<slug>. Body copy is his stated position in his own voice (advocacy,
// not invented quotes or statistics). "receiptsPosts" are his own published
// posts on this site that back the fight up — verified, his words. "statements"
// are external, sourced statements (tweets/quotes/videos) added only when they
// can be attributed to him with a real link.

export type FightStatement =
  | { kind: "tweet"; url: string; note?: string }
  | { kind: "quote"; text: string; sourceUrl?: string; sourceLabel?: string; date?: string }
  | { kind: "video"; url: string; label?: string };

export type FightLink = { href: string; label: string };

export type Fight = {
  slug: string;
  tag: string;
  title: string;
  short: string; // one-line card blurb on /fights
  lede: string; // hero subhead on the detail page
  stakes: string; // one line: what is on the line if this is lost
  planks: string[]; // concrete positions, his voice, scannable as a checklist
  body: string[]; // his case, in his voice
  receiptsPosts: string[]; // slugs of his own posts that back this up
  caseLinks?: FightLink[];
  statements?: FightStatement[]; // external, sourced statements
};

export const FIGHTS: Fight[] = [
  {
    slug: "water-rights",
    tag: "East Texas",
    title: "Water Rights",
    short:
      "Water is the lifeblood of East Texas. I'm fighting to keep it in the hands of the people who live on this land.",
    lede:
      "Water is the lifeblood of East Texas — and it belongs to the people who live on this land, not the interests trying to pipe it out from over our heads.",
    stakes:
      "Whether your well runs, your cattle drink, and your kids' kids can still work the land your family has worked for generations.",
    planks: [
      "Local control — the people who live on the land decide what happens to the water under it.",
      "Full transparency on every water sale, transfer, and district deal.",
      "A hard no to pipeline and authority schemes that drain our aquifers and rivers for the metros.",
    ],
    body: [
      "Out here, water isn't an abstraction. It's whether your well runs, whether your cattle drink, whether your kids' kids can still work the land your family has worked for generations. East Texas sits on some of the most coveted freshwater in the state, and that makes it a target.",
      "The play is always the same: the metros grow, demand climbs, and the pressure builds to move our water somewhere else — through pipelines, through districts and authorities run by people who never set foot here, through deals cut over the heads of the families who live with the consequences. Once water leaves, it doesn't come back.",
      "I'm fighting to keep East Texas water in East Texas hands: local control, real transparency on every sale and transfer, and a hard 'no' to schemes that treat our aquifers and rivers as someone else's resource to drain. The people who live on the land should decide what happens to what's under it.",
    ],
    receiptsPosts: [],
  },
  {
    slug: "first-amendment",
    tag: "Free speech",
    title: "The First Amendment",
    short:
      "I was banned, brigaded, and prosecuted over speech. No American should lose their voice to an algorithm or a weaponized agency.",
    lede:
      "I was banned, brigaded, and prosecuted over speech. No American should lose their voice to an algorithm or a weaponized agency.",
    stakes:
      "The one right that lets you speak when the powerful would rather you didn't — the whole ballgame.",
    planks: [
      "No American loses their voice to an algorithm or a weaponized agency.",
      "Own your own platform — so no company decides whether people get to hear you.",
      "Defend it for people you agree with and people you can't stand, or it's gone for everybody.",
    ],
    body: [
      "The First Amendment isn't a technicality. It's the whole ballgame — the thing that lets you speak when the powerful would rather you didn't. I learned what it's worth the hard way: I've watched platforms erase me over nothing while leaving up threats on my life, and I know what it's like to have the government treat speech itself as a crime.",
      "Look at the receipts on this site. I got suspended over the words “Space Force” and “discombobulater,” while “Rot in Hell you unAmerican scum” and “you deserve life in prison” stayed up against me. A verified parody account openly bragged it was “casually getting your account banned” — and then X banned me for almost seven days straight. That's not moderation. That's a thumb on the scale.",
      "That's exactly why I own my own domain now: so no algorithm and no platform can decide whether you get to hear me. And I'll defend the First Amendment for people I agree with and people I can't stand — because the second we let it be conditional, it's gone for everybody.",
    ],
    receiptsPosts: [
      "the-receipts-wall-every-threat-x-let-stay-up",
      "banned-again-for-space-force-and-discombobulater-meanwhile-rot-in-hell-stays-up",
      "banned-from-x-for-a-parody-this-is-why-i-own-my-domain",
    ],
    caseLinks: [{ href: "/the-harassment", label: "The harassment, documented" }],
  },
  {
    slug: "land-rights",
    tag: "Property",
    title: "Land Rights",
    short:
      "Your land is your stake in this country. I'm fighting eminent-domain abuse and anyone who treats private property as theirs to take.",
    lede:
      "Your land is your stake in this country. I'm fighting eminent-domain abuse and anyone who treats a family's private property as theirs to take.",
    stakes:
      "The inheritance you leave, the independence you keep — the one thing the powerful can't easily take from a working family.",
    planks: [
      "Eminent domain used narrowly — for genuine public necessity, not pipelines and developers.",
      "Real notice, real due process, and real value for every property owner.",
      "A much higher bar before any government or corporation can take what isn't theirs.",
    ],
    body: [
      "In East Texas, land is more than dirt. It's the inheritance you leave, the independence you keep, the one thing the powerful can't easily take from a working family — which is exactly why they keep trying.",
      "Eminent domain was meant for genuine public necessity, used narrowly and with honest compensation. Too often it's become a tool for pipelines, developers, and connected interests to force people off ground their families have held for a hundred years: lowball the owner, paper it over with “public use,” and dare them to afford a fight. Most can't. That's the point.",
      "I'm fighting for property owners to get real notice, real due process, and real value — and for a much higher bar before any government or corporation can take what isn't theirs. A family's land should not be up for grabs because someone with better lawyers wants it.",
    ],
    receiptsPosts: [],
  },
  {
    slug: "tax-fairness",
    tag: "Your paycheck",
    title: "Tax Fairness",
    short:
      "Working people are taxed into the ground while the connected get the carve-outs. I'm fighting to stop punishing the people who build everything.",
    lede:
      "Working people are taxed into the ground while the connected get the carve-outs. I'm fighting for a system that stops punishing the people who actually build everything.",
    stakes:
      "Whether the people who frame the houses, drive the trucks, and run the small shops get to keep what they earn.",
    planks: [
      "Stop punishing work — let the people who build everything keep more of what they earn.",
      "Close the carve-outs written for insiders and lobbyists.",
      "A code simple enough that a working family isn't trapped by complexity built for the connected.",
    ],
    body: [
      "The people who frame the houses, drive the trucks, run the small shops, and work the land carry this country on their backs — and they're the ones who feel every tax the hardest. Meanwhile the biggest players keep armies of accountants and lobbyists writing themselves exemptions the rest of us will never see.",
      "I'm not against paying for the things that actually serve us. I'm against a code rigged so the working family pays full freight while the connected pay pennies on the dollar. The complexity isn't an accident — it's a feature for them and a trap for you.",
      "I'm fighting for tax fairness that means what it says: stop punishing work, close the carve-outs written for insiders, and let the people who build everything keep more of what they earn.",
    ],
    receiptsPosts: [],
  },
  {
    slug: "equal-justice",
    tag: "Two-tier no more",
    title: "Equal Justice Under the Law",
    short:
      "I lived two-tier justice from the inside. I'm fighting to make those four words over the Supreme Court true for everyone.",
    lede:
      "I lived two-tier justice from the inside. Those four words are carved over the Supreme Court — and I'm fighting to make them true for everyone, not just whoever the government happens to like that week.",
    stakes:
      "The difference between a republic and a regime — whether the law is the same for everyone, or bends to whose side you're on.",
    planks: [
      "The same rules, the same due process, the same mercy for everyone.",
      "End the two-tier system that bends the law to who you are and whose side you're on.",
      "Conditions inside no American should accept for anyone — guilty or innocent.",
    ],
    body: [
      "“Equal Justice Under Law.” It's carved over the entrance to the Supreme Court. I've stood on the wrong end of how hollow those words can be made to feel. I sat in pretrial detention while a federal judge said out loud, on the record, that my due process rights had been violated — and I stayed in anyway.",
      "I watched the system hand one man a walk for cooperating while his codefendant in the same case did 80 months. I lived conditions inside the DC Jail that no American should accept for anyone, guilty or innocent. The lesson wasn't just that the system failed me — it's that the law now bends to who you are and whose side you're on.",
      "I'm fighting to make those four words true again: the same rules, the same due process, the same mercy for everyone. Equal justice isn't a slogan. It's the difference between a republic and a regime.",
    ],
    receiptsPosts: [
      "judge-hogan-on-the-record",
      "george-tanios-pleaded-first-walked",
      "inside-the-dc-jail",
    ],
    caseLinks: [
      { href: "/case", label: "The full case file" },
      { href: "/evidence-the-doj-tried-to-erase", label: "Evidence the DOJ tried to erase" },
    ],
    statements: [
      { kind: "tweet", url: "https://x.com/RealRyanNichols/status/1882093055303446999" },
      { kind: "tweet", url: "https://x.com/RealRyanNichols/status/2057632235822764326" },
    ],
  },
];

export function getFight(slug: string): Fight | undefined {
  return FIGHTS.find((f) => f.slug === slug);
}
