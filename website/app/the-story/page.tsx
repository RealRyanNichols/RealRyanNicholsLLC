import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { pageMetadata } from "@/lib/page-metadata";
import { RescueGallery } from "@/components/RescueGallery";
import { getCaseTotals, getJ6DefendantCount } from "@/lib/case";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, personRef, websiteRef } from "@/lib/jsonld";
import { SITE } from "@/lib/site";
import { StoryCinema } from "@/components/story/StoryCinema";
import { ChapterMedia, Img } from "@/components/story/StoryFrames";
import { CLOSING, HERO, bleedBackdrop, chaptersFor, type Chapter } from "./chapters";
import "./story.css";

// The display face for this room only: Big Shoulders, the condensed cut Ryan
// picked for the cover-art standard. Self-hosted (OFL), one variable file,
// the latin range, ~35 KB. Everything else on the page is the site's own
// serif and sans.
const display = localFont({
  src: "./fonts/BigShouldersDisplay-latin.woff2",
  weight: "700 900",
  display: "swap",
  variable: "--font-story-display",
});

// The day count in the description is the live arrest-to-pardon figure from
// lib/case.ts, never typed.
export async function generateMetadata(): Promise<Metadata> {
  const totals = await getCaseTotals();
  const days = totals.daysArrestToPardon.toLocaleString("en-US");
  return pageMetadata({
    title: "The Story — Ryan Nichols, All of It",
    description: `One life, told whole and backed by paper: Katrina at 14, the Marines, two dozen hurricane rescues, a business built from nothing, January 6 and ${days} days from arrest to pardon, the fall nobody photographs, the finding, the family, and the archive built so it can never be buried.`,
    path: "/the-story",
    image: "/og/the-story",
  });
}

export const revalidate = 3600;

export default async function TheStoryPage() {
  const [totals, defendants] = await Promise.all([getCaseTotals(), getJ6DefendantCount()]);
  const chapters = chaptersFor({
    days: totals.daysArrestToPardon,
    facilities: totals.facilities,
    grievances: totals.ryanFiledGrievances,
    documents: totals.documents,
    defendants,
  });
  const days = totals.daysArrestToPardon;
  const url = `${SITE.url}/the-story`;

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${url}#page`,
      url,
      name: "The Story — Ryan Nichols, All of It",
      description:
        "Ten chapters of one life, each linked to the record that proves it: rescuer, Marine, builder, January 6 defendant, father.",
      isPartOf: websiteRef(),
      mainEntity: personRef(),
    },
    breadcrumbLd([
      { name: "Home", url: SITE.url },
      { name: "The Story", url },
    ]),
  ];

  return (
    <div className={`st-theater ${display.variable}`}>
      <JsonLd data={ld} />
      <StoryCinema
        chapters={chapters.map((c) => ({ id: c.id, era: c.era, title: c.title }))}
      />

      {/* ---- Title card ---- */}
      <header className="st-hero" id="the-story-top">
        <div className="st-hero-media">
          <Img p={HERO.picture} sizes="100vw" eager />
          <span className="st-prov st-prov--real st-prov--hero">
            Real photo · {HERO.credit}
          </span>
        </div>
        <div className="st-hero-copy">
          <p className="st-kicker">The Story · All of it</p>
          <h1>
            <span className="st-line" style={{ "--i": 0 } as React.CSSProperties}>
              <span>One life.</span>
            </span>
            <span className="st-line" style={{ "--i": 1 } as React.CSSProperties}>
              <span>Told whole.</span>
            </span>
            <span className="st-line" style={{ "--i": 2 } as React.CSSProperties}>
              <span>
                Backed by <em>paper.</em>
              </span>
            </span>
          </h1>
          <div className="st-rule" aria-hidden />
          <p className="st-sub">
            Rescuer. Marine. Builder. Defendant. Father. The fire, the fall,
            and the finding. Every chapter below links to the paper that
            proves it. Read it in order. Check every claim. Share what moves
            you.
          </p>
          <ul className="st-stats">
            <li className="st-stat">
              <b data-count={days > 0 ? days : undefined}>
                {days > 0 ? days.toLocaleString("en-US") : "—"}
              </b>
              <span>Days, arrest to pardon</span>
            </li>
            <li className="st-stat">
              <b>2 dozen+</b>
              <span>Disaster deployments</span>
            </li>
            <li className="st-stat">
              <b data-count={defendants > 0 ? defendants : undefined}>
                {defendants > 0 ? defendants.toLocaleString("en-US") : "—"}
              </b>
              <span>Defendants indexed</span>
            </li>
          </ul>
          <div className="st-actions">
            <Link href="/posts/my-lifes-work-all-of-it" className="st-btn">
              Start with his own words
            </Link>
            <Link href="/book" className="st-btn st-btn--ghost">
              The book: Fighting Shadows
            </Link>
          </div>
          <a className="st-scrollcue" href="#chapter-1">
            <i aria-hidden />
            Chapter One · 2005
          </a>
        </div>
      </header>

      {/* ---- Ten chapters ---- */}
      <ol className="st-chapters">
        {chapters.map((c, i) =>
          c.layout === "bleed" ? (
            <BleedChapter key={c.id} c={c} n={i + 1} />
          ) : (
            <SplitChapter key={c.id} c={c} n={i + 1} />
          ),
        )}
      </ol>

      {/* ---- The rescue record, in pictures ---- */}
      <section className="st-paper-section" id="the-rescue-record">
        <div>
          <p className="st-kicker">The rescue record · in pictures</p>
          <h2>Before he was a case number, he ran toward the water.</h2>
          <p className="st-lead">
            Hurricane after hurricane. Boats in the floodline, strangers pulled
            to safety, the children he went in to save. Two dozen deployments,
            one calling. This is the record of the work, straight off the
            drive. Tap any photo to open it.
          </p>
          <div className="mt-8">
            <RescueGallery count={54} />
          </div>
        </div>
      </section>

      {/* ---- The door out ---- */}
      <section className="st-closing" id="why-this-page-exists">
        <div className="st-closing-bg" aria-hidden>
          <Img p={CLOSING.picture} sizes="100vw" />
        </div>
        <div className="st-closing-inner">
          <p className="st-kicker">Why this page exists</p>
          <blockquote className="st-closing-quote" data-reveal>
            &ldquo;I feel called to go to the Marine Corps. I feel called to go
            do all those rescues. I felt called to go to January 6th. I felt
            called to run for Congress. I feel called to run the business that
            I&rsquo;m running. I felt called to finally tell my story.{" "}
            <em>You&rsquo;ll know when it&rsquo;s time. You just will.</em>&rdquo;
            <cite>Ryan Nichols · recorded September 7, 2026 · Ryan statement</cite>
          </blockquote>
          <p className="st-sub" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            It writes history. It rights history. And it leaves the door open
            for every witness who needs a place to put their story.
          </p>
          <div className="st-actions" data-reveal style={{ "--d": 2 } as React.CSSProperties}>
            <Link href="/tell-your-story" className="st-btn">
              Tell your story
            </Link>
            <Link href="/j6" className="st-btn st-btn--ghost">
              Claim a J6 profile, free forever
            </Link>
            <Link href="/book" className="st-btn st-btn--gold">
              Read the book
            </Link>
          </div>
          <p className="st-verse">
            &ldquo;As for you, you meant evil against me, but God meant it for
            good, to bring it about that many people should be kept alive, as
            they are today.&rdquo; Genesis 50:20
          </p>
        </div>
      </section>
    </div>
  );
}

function ChapterCopy({ c }: { c: Chapter }) {
  return (
    <>
      <p className="st-era">
        {c.kicker} · {c.era}
      </p>
      <h2>{c.title}</h2>
      {c.stats ? (
        <div className="st-bignums">
          {c.stats.map((s) => (
            <div className="st-bignum" key={s.label}>
              <b data-count={s.value}>{s.value.toLocaleString("en-US")}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="st-lines">
        {c.lines.map((l) => (
          <p key={l.text} className={l.big ? "st-big" : undefined}>
            {l.text}
          </p>
        ))}
      </div>
      {c.quote ? (
        <blockquote className="st-quote">
          &ldquo;{c.quote.text}&rdquo;
          <cite>{c.quote.cite}</cite>
        </blockquote>
      ) : null}
      <div className="st-chips">
        {c.chips.map((ch) => (
          <span key={ch.label} className={`st-chip${ch.tone ? ` st-chip--${ch.tone}` : ""}`}>
            {ch.label}
          </span>
        ))}
      </div>
      <Link href={c.href} className="st-cta">
        {c.cta} <span aria-hidden>→</span>
      </Link>
    </>
  );
}

function SplitChapter({ c, n }: { c: Chapter; n: number }) {
  return (
    <li
      id={c.id}
      data-chapter={n}
      className={`st-chapter st-chapter--${c.id}${c.layout === "flip" ? " st-chapter--flip" : ""}`}
    >
      <span className="st-num" aria-hidden>
        {String(n).padStart(2, "0")}
      </span>
      <div className="st-frame-wrap" data-reveal>
        <ChapterMedia media={c.media} />
      </div>
      <div className="st-copy" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
        <ChapterCopy c={c} />
      </div>
    </li>
  );
}

function BleedChapter({ c, n }: { c: Chapter; n: number }) {
  const backdrop = bleedBackdrop(c.media);
  const media = <ChapterMedia media={c.media} />;
  return (
    <li id={c.id} data-chapter={n} className={`st-chapter st-chapter--bleed st-chapter--${c.id}`}>
      {backdrop ? (
        <div className="st-bleed-bg" aria-hidden>
          <Img p={backdrop} sizes="100vw" />
        </div>
      ) : null}
      <span className="st-num" aria-hidden>
        {String(n).padStart(2, "0")}
      </span>
      <div className="st-bleed-inner">
        {media ? (
          <div className="st-frame-wrap" data-reveal>
            {media}
          </div>
        ) : null}
        <div className="st-copy" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
          <ChapterCopy c={c} />
        </div>
      </div>
    </li>
  );
}
