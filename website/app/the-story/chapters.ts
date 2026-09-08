import { DECORATIONS } from "@/lib/bio";

// The Story, as ten chapters. Every fact here comes from lib/bio.ts (the
// biography filed as Exhibit 288), lib/case.ts (the live archive counts and
// the arrest/pardon dates), or Ryan's own published posts. Quotes are his
// words, labelled the way the record style labels them. Nothing is typed in
// that the archive cannot back.
//
// Pictures: a real photo where one exists for that era; his own court scans
// where the chapter is paper; a generated scene with no people, finished to
// the site's navy-and-gold theme, only where no photo of that era is on hand
// (Katrina at 14, Okinawa, the cell block, the lake). Every frame says which
// it is.

export type Provenance = "real" | "scene" | "paper";

export type Picture = {
  // Path stem under /public; the renderer appends -<width>.jpg.
  base: string;
  widths: number[];
  alt: string;
};

export type Media =
  | {
      kind: "frame";
      picture: Picture;
      provenance: Provenance;
      credit: string;
      effect?: "rain" | "rings";
      ratio?: "wide" | "tall";
    }
  | { kind: "grid"; items: { picture: Picture; credit: string }[] }
  | { kind: "monitor"; picture: Picture; credit: string; backdrop: Picture }
  | { kind: "papers"; items: { picture: Picture; href: string; label: string }[] }
  | { kind: "seal"; ring: string; center: string[] }
  | { kind: "empty"; note: string }
  | { kind: "portrait"; picture: Picture; credit: string; backdrop: Picture }
  | { kind: "archive"; backdrop: Picture };

export type Line = { text: string; big?: boolean };
export type Chip = { label: string; tone?: "fact" | "scene" | "statement" | "paper" };
export type Stat = { value: number; label: string };

export type Chapter = {
  id: string;
  era: string;
  kicker: string;
  title: string;
  lines: Line[];
  stats?: Stat[];
  quote?: { text: string; cite: string };
  chips: Chip[];
  href: string;
  cta: string;
  media: Media;
  layout: "split" | "flip" | "bleed";
};

const pic = (base: string, widths: number[], alt: string): Picture => ({ base, widths, alt });

export const HERO = {
  picture: pic(
    "/story/hero-storm",
    [640, 960, 1600],
    "Ryan Nichols in floodwater beside his rescue boat during a hurricane deployment, thumbs up",
  ),
  credit: "Rescue the Universe archive",
};

export const CLOSING = {
  picture: pic(
    "/story/closing-sunset",
    [640, 1080],
    "Ryan Nichols from behind at sunset, his shirt reading Rescue the Universe",
  ),
};

export type Record = {
  days: number;
  facilities: number;
  grievances: number;
  documents: number;
  defendants: number;
};

// Live counts are passed in, never typed. A count of 0 means the query
// failed; the line then drops the number rather than inventing one.
export function chaptersFor(r: Record): Chapter[] {
  const n = (v: number) => v.toLocaleString("en-US");
  return [
    {
      id: "chapter-1",
      era: "2005",
      kicker: "Chapter One",
      title: "The kid in the floodwater",
      lines: [
        { text: "Hurricane Katrina. Fourteen years old.", big: true },
        { text: "His first rescue was not a metaphor. A kid who went toward the water instead of away from it." },
        { text: "Everything that follows, the Marine, the boat captain, the man wading in for strangers, traces back to this storm." },
      ],
      chips: [
        { label: "Fact · Exhibit 288", tone: "fact" },
        { label: "Scene art · no people", tone: "scene" },
      ],
      href: "/story/hurricane-katrina-2005",
      cta: "The Katrina chapter",
      layout: "split",
      media: {
        kind: "frame",
        provenance: "scene",
        credit: "Gulf Coast, 2005",
        effect: "rain",
        picture: pic(
          "/story/scene-katrina",
          [800, 1400, 2752],
          "Aerial view of a Gulf Coast neighborhood underwater after Hurricane Katrina, sunset light on the flood",
        ),
      },
    },
    {
      id: "chapter-2",
      era: "2010 to 2014",
      kicker: "Chapter Two",
      title: "The Marine",
      lines: [
        { text: "Enlisted in 2010, during two wars. Four years active duty.", big: true },
        { text: "Okinawa, 9th Communications Battalion. Managed 30-plus Marines and millions of dollars in communications equipment." },
        { text: "Four typhoons on the ground. Super Typhoon Jelawat was the one nobody stationed there forgot." },
        { text: "Honorably discharged in 2014 as a noncommissioned officer." },
      ],
      chips: [
        { label: "Fact · Exhibit 288", tone: "fact" },
        ...DECORATIONS.map((d) => ({ label: d })),
        { label: "Scene art · no people", tone: "scene" },
      ],
      href: "/about",
      cta: "The service record",
      layout: "flip",
      media: {
        kind: "frame",
        provenance: "scene",
        credit: "Okinawa, 2012",
        effect: "rings",
        picture: pic(
          "/story/scene-okinawa",
          [800, 1400, 2752],
          "A typhoon wave breaking over the Okinawa seawall with an antenna mast behind it",
        ),
      },
    },
    {
      id: "chapter-3",
      era: "2017 to 2020",
      kicker: "Chapter Three",
      title: "Two dozen storms",
      lines: [
        { text: "Harvey. Florence. Michael. Barry. Dorian. Imelda. Cristobal. Arthur. Hanna. Laura. Sally." },
        { text: "Fifty-plus people out in a single day. Foley, Alabama. On video.", big: true },
        { text: "Babies, children, the elderly, the bedridden, the animals. Boat work, door to door, day after day." },
        { text: "Ellen put the Florence rescues on national television and paid for a new rescue boat." },
      ],
      chips: [
        { label: "Fact · Exhibit 288", tone: "fact" },
        { label: "Real photos · Rescue the Universe archive" },
        { label: "Recognized · The Ellen Show, ABC News, The Weather Channel" },
      ],
      href: "/story/hurricane-sally-2020",
      cta: "The day fifty people came out",
      layout: "split",
      media: {
        kind: "grid",
        items: [
          {
            picture: pic("/story/storm-family-boat", [720, 1440], "A rescued family seated in the boat, life vests on, floodwater around them"),
            credit: "Boat work",
          },
          {
            picture: pic("/story/storm-night-boat", [720, 1440], "A night rescue by flashlight, a mother and child in the boat"),
            credit: "Night run",
          },
          {
            picture: pic("/story/storm-coast-guard", [720, 1440], "A Coast Guard helicopter on the ground with the rescue crew"),
            credit: "Alongside the Coast Guard",
          },
          {
            picture: pic("/story/storm-crew", [720, 1440], "Ryan Nichols and the rescue crew in flag life vests on a flooded road"),
            credit: "The crew",
          },
        ],
      },
    },
    {
      id: "chapter-4",
      era: "2015 to 2021",
      kicker: "Chapter Four",
      title: "The builder",
      lines: [
        { text: "Wholesale Universe. Built in 2015 from nothing. No investors. No safety net.", big: true },
        { text: "A multi-million-dollar wholesale and retail company. Ten to eighteen people on payroll. Two to three thousand students learning e-commerce." },
        { text: "The warehouse stocked relief supplies between storms. During COVID he paid his staff to take time off and run rescue relief." },
        { text: "A father of two boys. It broke his pride wide open, in the best way." },
      ],
      chips: [
        { label: "Fact · Exhibit 288", tone: "fact" },
        { label: "Ryan statement · The Comeback Ledger", tone: "statement" },
        { label: "Real photo · Rescue the Universe archive" },
      ],
      href: "/posts/the-comeback-ledger",
      cta: "Line one of the comeback ledger",
      layout: "flip",
      media: {
        kind: "frame",
        provenance: "real",
        credit: "Supplies loaded between storms",
        ratio: "tall",
        picture: pic(
          "/story/builder-warehouse",
          [720, 1440],
          "Ryan Nichols in a warehouse aisle with a cart stacked with cases of drinking water",
        ),
      },
    },
    {
      id: "chapter-5",
      era: "2021 to 2025",
      kicker: "Chapter Five",
      title: "The fire",
      lines: [
        { text: "January 6, 2021. Arrested twelve days later." },
        { text: `${r.facilities} facilities. Solitary confinement.`, big: true },
        { text: "A federal judge acknowledged on the record that his due process rights were violated. He stayed in anyway, and papered every day of it." },
      ],
      stats: r.days > 0 ? [{ value: r.days, label: "Days, arrest to pardon" }] : undefined,
      chips: [
        { label: "Fact · Court record", tone: "fact" },
        { label: "Real photo · video visit, DC Jail" },
        { label: "Scene art · no people", tone: "scene" },
      ],
      href: "/case",
      cta: "The case, in paper",
      layout: "bleed",
      media: {
        kind: "monitor",
        credit: "Video visit, DC Jail",
        picture: pic(
          "/story/jail-visit",
          [720, 1280],
          "Ryan Nichols in an orange jumpsuit seated on a bunk during a video visit from the DC Jail",
        ),
        backdrop: pic(
          "/story/scene-cellblock",
          [800, 1400, 2752],
          "An empty cell block corridor at night, one door open with light spilling out",
        ),
      },
    },
    {
      id: "chapter-6",
      era: "2022",
      kicker: "Chapter Six",
      title: "The habeas fight",
      lines: [
        { text: "Over a year documenting abuses from inside, in his own hand." },
        { text: "He sued the Attorney General from his cell, and got out of solitary.", big: true },
        { text: "The forms below are his. Tap one to read it in the archive." },
      ],
      stats:
        r.grievances > 0
          ? [{ value: r.grievances, label: "Grievance forms he filed, on file here" }]
          : undefined,
      chips: [
        { label: "Court scans · his own forms", tone: "paper" },
        { label: "Fact · Habeas petition, 2022", tone: "fact" },
      ],
      href: "/case/documents/habeas-petition-2022",
      cta: "Read the petition",
      layout: "split",
      media: {
        kind: "papers",
        items: [
          {
            picture: pic("/story/paper-grievance-formal", [480, 900], "DC Department of Corrections formal grievance form, handwritten by Ryan Nichols, July 2021"),
            href: "/case/documents/j6s23-002",
            label: "Formal grievance · July 17, 2021",
          },
          {
            picture: pic("/story/paper-habeas-p3", [480, 900], "Page three of the habeas corpus petition, Introduction and Jurisdiction"),
            href: "/case/documents/j6s33-005",
            label: "Habeas petition · page 3",
          },
          {
            picture: pic("/story/paper-grievance-informal", [480, 900], "DC Department of Corrections informal resolution complaint form, handwritten by Ryan Nichols, July 2021"),
            href: "/case/documents/j6s23-001",
            label: "Informal complaint · July 25, 2021",
          },
          {
            picture: pic("/story/paper-legal-pad", [480, 900], "A handwritten legal pad page titled Detention Hearing Timeline"),
            href: "/case/documents/j6s2-015",
            label: "Legal pad · detention hearing timeline",
          },
        ],
      },
    },
    {
      id: "chapter-7",
      era: "January 20, 2025",
      kicker: "Chapter Seven",
      title: "Pardoned. Dismissed. Permanent.",
      lines: [
        { text: "A full and unconditional pardon.", big: true },
        { text: "Dismissed with prejudice. It can never be brought again." },
        { text: "Not one person lost a job. Not one lost a pension. Nobody has been asked a hard question. So what is going to be done to make it right?" },
      ],
      chips: [
        { label: "Fact · Court record", tone: "fact" },
        { label: "Ryan statement · the standing question", tone: "statement" },
      ],
      href: "/case/documents/order-j6-presidential-pardon-2025",
      cta: "The pardon, on the record",
      layout: "flip",
      media: {
        kind: "seal",
        ring: "FULL AND UNCONDITIONAL · JANUARY 20, 2025 · DISMISSED WITH PREJUDICE · ",
        center: ["Pardoned", "Jan 20, 2025"],
      },
    },
    {
      id: "chapter-8",
      era: "2025",
      kicker: "Chapter Eight",
      title: "The fall nobody photographs",
      lines: [
        { text: "The cameras left after the pardon." },
        { text: "This chapter is being written now. Plainly, and without shame." },
      ],
      quote: {
        text: "After the pardon, I did not walk out into a comeback. I walked out into a fall. Homelessness. A marriage ending. The business I built gone in the wreckage. Losing myself so completely that some days I did not recognize the man doing the losing.",
        cite: "Ryan Nichols · This Site Is My Life's Work · July 2026",
      },
      chips: [{ label: "Ryan statement · his published words", tone: "statement" }],
      href: "/posts/my-lifes-work-all-of-it",
      cta: "The part people wondered about",
      layout: "bleed",
      media: {
        kind: "empty",
        note: "No photograph exists of this chapter. That is the point.",
      },
    },
    {
      id: "chapter-9",
      era: "2025 to 2026",
      kicker: "Chapter Nine",
      title: "The finding",
      lines: [
        { text: "Faith that works like a job, not a bumper sticker." },
        { text: "The water. The work. Mental health fought for out loud." },
        { text: "Amanda. And a son, Thomas David Nichols, born August 4, 2026.", big: true },
        { text: "A comeback measured in receipts, not applause." },
      ],
      quote: {
        text: "It took me almost two years. And I am just now, in many ways, calming down from that.",
        cite: "Ryan Nichols · recorded September 7, 2026 · Ryan statement",
      },
      chips: [
        { label: "Real photo · Ryan, 2026" },
        { label: "Ryan statement", tone: "statement" },
        { label: "Scene art · no people", tone: "scene" },
      ],
      href: "/posts/his-name-is-thomas-david-nichols",
      cta: "His name is Thomas",
      layout: "bleed",
      media: {
        kind: "portrait",
        credit: "Ryan, 2026",
        picture: pic("/story/ryan-now", [720, 1200], "Ryan Nichols today, smiling with a thumbs up in front of a red mural in East Texas"),
        backdrop: pic(
          "/story/scene-lake",
          [800, 1400, 2752],
          "Cypress trees and Spanish moss over still water at dawn, a fishing dock with rods and a cast net",
        ),
      },
    },
    {
      id: "chapter-10",
      era: "Now",
      kicker: "Chapter Ten",
      title: "The archive for the others",
      lines: [
        { text: `${r.defendants > 0 ? `${n(r.defendants)} d` : "D"}efendants indexed. Profiles free, forever.`, big: true },
        { text: `${r.documents > 0 ? `${n(r.documents)} d` : "D"}ocuments public and permanent.` },
        { text: "Witnesses coming forward. History written, and righted." },
      ],
      stats:
        r.defendants > 0 && r.documents > 0
          ? [
              { value: r.defendants, label: "Defendants indexed" },
              { value: r.documents, label: "Documents public" },
            ]
          : undefined,
      quote: {
        text: "Not because I want to live in the past. Because a record that stays public is the only rescue some of us get.",
        cite: "Ryan Nichols · This Site Is My Life's Work · July 2026",
      },
      chips: [
        { label: "Live · counted from the archive", tone: "fact" },
        { label: "Court scans · the texture is real paper", tone: "paper" },
      ],
      href: "/j6",
      cta: "Enter the archive",
      layout: "bleed",
      media: {
        kind: "archive",
        backdrop: pic("/story/archive-mosaic", [1200, 2400], ""),
      },
    },
  ];
}

// The chapter backdrop for full-bleed layouts, if the media carries one.
export function bleedBackdrop(m: Media): Picture | null {
  switch (m.kind) {
    case "monitor":
    case "portrait":
    case "archive":
      return m.backdrop;
    default:
      return null;
  }
}
