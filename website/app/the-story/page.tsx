import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "The Story — Ryan Nichols, All of It",
  description:
    "One life, told whole: Katrina at 14, the Marines, two dozen hurricane rescues, a business built from nothing, January 6 and 1,463 days detained, the fall nobody photographs, the finding, the family, and the archive built so it can never be buried.",
  path: "/the-story",
});

// The life's work, as chapters. Each one links into the part of the site that
// holds its receipts. This page is the spine; the site is the body.
const CHAPTERS: {
  era: string;
  kicker: string;
  title: string;
  lines: string[];
  href: string;
  cta: string;
  tone?: "dark" | "light";
}[] = [
  {
    era: "2005",
    kicker: "Chapter One",
    title: "The kid in the floodwater",
    lines: [
      "Hurricane Katrina. Fourteen years old.",
      "His first rescue was not a metaphor.",
    ],
    href: "/story/hurricane-katrina-2005",
    cta: "The Katrina chapter →",
  },
  {
    era: "2010–2014",
    kicker: "Chapter Two",
    title: "The Marine",
    lines: [
      "Enlisted during two wars. Okinawa. Typhoons.",
      "Led 30+ Marines. Honorable discharge.",
    ],
    href: "/case#service",
    cta: "The service record →",
  },
  {
    era: "2017–2020",
    kicker: "Chapter Three",
    title: "Two dozen storms",
    lines: [
      "Harvey. Florence. Michael. Sally.",
      "Fifty people pulled out in a single day.",
      "Ellen put him on her show. The storms kept coming. So did he.",
    ],
    href: "/story/hurricane-florence-2018",
    cta: "The rescue operations log →",
  },
  {
    era: "2014–2021",
    kicker: "Chapter Four",
    title: "The builder",
    lines: [
      "Wholesale Universe. From nothing to multi-million.",
      "A family. A father. A life built with two hands.",
    ],
    href: "/about",
    cta: "The full biography →",
  },
  {
    era: "2021–2025",
    kicker: "Chapter Five",
    title: "The fire",
    lines: [
      "January 6. Arrested twelve days later.",
      "1,463 days. Ten facilities. Solitary.",
      "A federal judge admitted on the record his due process was violated.",
      "He stayed in anyway — and papered every day of it.",
    ],
    href: "/case",
    cta: "The case, in paper →",
    tone: "dark",
  },
  {
    era: "2022",
    kicker: "Chapter Six",
    title: "The habeas fight",
    lines: [
      "Over a year documenting abuses from inside.",
      "267 grievance forms in his own hand.",
      "He sued the Attorney General from his cell — and got out of solitary.",
    ],
    href: "/case/documents/habeas-petition-2022",
    cta: "Read the petition →",
  },
  {
    era: "Jan 20, 2025",
    kicker: "Chapter Seven",
    title: "Pardoned. Dismissed. Permanent.",
    lines: [
      "A full and unconditional pardon.",
      "Dismissed with prejudice — it can never be brought again.",
    ],
    href: "/case/documents/order-j6-presidential-pardon-2025",
    cta: "The pardon, on the record →",
  },
  {
    era: "2025",
    kicker: "Chapter Eight",
    title: "The fall nobody photographs",
    lines: [
      "The cameras left after the pardon.",
      "Homelessness. A marriage ending. The business gone.",
      "Losing himself so completely he did not recognize the man doing the losing.",
      "This chapter is being written now — plainly, and without shame.",
    ],
    href: "/posts/my-lifes-work-all-of-it",
    cta: "The part people wondered about →",
    tone: "dark",
  },
  {
    era: "2025–2026",
    kicker: "Chapter Nine",
    title: "The finding",
    lines: [
      "Faith that works like a job, not a bumper sticker.",
      "The water. The work. Mental health fought for out loud.",
      "Amanda. A son on the way.",
      "A comeback measured in receipts, not applause.",
    ],
    href: "/posts/the-comeback-ledger",
    cta: "The comeback ledger →",
  },
  {
    era: "Now",
    kicker: "Chapter Ten",
    title: "The archive for the others",
    lines: [
      "1,571 defendants indexed. Profiles free, forever.",
      "1,400+ documents public and permanent.",
      "Witnesses coming forward. History written — and righted.",
    ],
    href: "/j6",
    cta: "Enter the archive →",
  },
];

export default function TheStoryPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero */}
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-accent)]">
        The Story · All of it
      </p>
      <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
        One life.
        <br />
        Told whole.
        <br />
        Backed by paper.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Rescuer. Marine. Builder. Defendant. Father. The fire, the fall, and
        the finding — every chapter below links to the part of this site that
        holds its receipts. Read it in order. Check every claim. Share what
        moves you.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/posts/my-lifes-work-all-of-it"
          className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Start with his own words
        </Link>
        <Link
          href="/book"
          className="btn-support rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          The book: Fighting Shadows
        </Link>
      </div>

      {/* Chapters */}
      <section className="mt-14 space-y-6">
        {CHAPTERS.map((c) => (
          <Link
            key={c.kicker}
            href={c.href}
            className={[
              "group block rounded-2xl border-2 p-6 transition sm:p-8",
              c.tone === "dark"
                ? "border-[var(--color-navy)]/40 bg-[var(--color-blue-soft)]/40 hover:border-[var(--color-navy)]"
                : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                {c.kicker}
              </p>
              <p className="text-xs font-bold tabular-nums text-[var(--color-muted)]">
                {c.era}
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[var(--color-ink)] sm:text-3xl">
              {c.title}
            </h2>
            <div className="mt-3 space-y-1.5">
              {c.lines.map((line) => (
                <p
                  key={line}
                  className="text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base"
                >
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold text-[var(--color-navy)] transition group-hover:text-[var(--color-accent)]">
              {c.cta}
            </p>
          </Link>
        ))}
      </section>

      {/* The why */}
      <section className="mt-14 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
          Why this page exists
        </p>
        <p className="mt-3 font-display text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
          It writes history. It rights history. And it leaves the door open for
          every witness who needs a place to put their story.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/tell-your-story"
            className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Tell your story
          </Link>
          <Link
            href="/j6"
            className="rounded-full border-2 border-[var(--color-navy)]/40 px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
          >
            Claim a J6 profile — free, forever
          </Link>
        </div>
      </section>

      {/* Verse */}
      <p className="mt-12 border-l-2 border-[var(--color-navy)] pl-4 text-sm italic leading-relaxed text-[var(--color-ink-soft)]">
        &ldquo;As for you, you meant evil against me, but God meant it for
        good, to bring it about that many people should be kept alive, as they
        are today.&rdquo; — Genesis 50:20
      </p>
    </article>
  );
}
