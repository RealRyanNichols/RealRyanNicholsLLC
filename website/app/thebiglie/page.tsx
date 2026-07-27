import type { Metadata } from "next";
import Link from "next/link";
import { BigLieGate } from "@/components/BigLieGate";
import { SITE } from "@/lib/site";

const title = "The BIG Lie — The Report I Wrote in Solitary Confinement";
const description =
  "26,102 words. 166 images. 12 charts. Written in solitary confinement with a laptop, an evidence thumb drive, three books and no internet. Read it free.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/thebiglie` },
  openGraph: { type: "website", title, description, url: `${SITE.url}/thebiglie` },
  twitter: { card: "summary_large_image", title, description },
};

const H2 = "font-display text-3xl font-black text-[#fdf8ea] sm:text-4xl";
const DARK = "bg-[#071126] text-[#fdf8ea]";
const CARD = "rounded-xl border border-[#203a64] bg-[#0b1830] p-6";
const KICKER = "text-[10px] font-black uppercase tracking-[0.16em] text-[#e1bd5b]";
const BODY = "text-base font-semibold leading-7 text-[#cfd9ea]";

const STATS = [
  { n: "26,102", l: "Words written in a cell" },
  { n: "166", l: "Images from the record" },
  { n: "44,000+", l: "Hours that turned out to exist" },
  { n: "0", l: "Minutes of internet access" },
];

const HAD = [
  { n: "01", t: "One laptop", d: "Court issued. Locked down. Loaded with the government's own discovery." },
  { n: "02", t: "One evidence thumb drive", d: "What I was told was 14,000+ hours of bodycam, CCTV and crowd video. Everything I could prove came off of it. The real number turned out to be far larger." },
  { n: "03", t: "Three books", d: "Whatever made it through the mail. Every outside source in this report is something I could hold in my hands." },
  { n: "04", t: "No internet", d: "Not restricted. None. I could not look anything up, check a date, or read the news." },
  { n: "05", t: "What was left of my sanity", d: "Solitary confinement. That is the honest fifth item and I am not going to dress it up." },
];

/** Written 2021-22 in a cell, before each item below was public. */
const CAME_TRUE = [
  {
    then: "I wrote that federal informants were embedded in that crowd, and that the government would not want to say how many.",
    later:
      "December 2024: the Justice Department Inspector General reported 26 confidential human sources were present in Washington on January 6, none of them authorized to enter the building or to encourage anyone else to.",
    tag: "Came out after I wrote it",
  },
  {
    then: "I wrote that the Proud Boys had been infiltrated, and that the informants inside that group would surface eventually.",
    later:
      "2023: at the seditious conspiracy trial, defense filings and open court testimony referenced as many as eight or nine informants in that orbit. One marched in with the Kansas City chapter, texted his handler while it was happening, and rode home with Billy Chrestman. He was never charged. Chrestman got 55 months.",
    tag: "Came out after I wrote it",
  },
  {
    then: "I wrote that Ray Epps needed to be explained, and that the silence around him was itself the story.",
    later:
      "September 2023: Epps was charged with a single misdemeanor. January 2024: sentenced to probation, no custody. What he did on camera is still on the record for anyone to weigh.",
    tag: "Happened after I wrote it",
  },
  {
    then: "I wrote that law enforcement used markers to identify their own people inside that crowd.",
    later:
      "The Metropolitan Police Department's own January 6th preparation report lists Rainbow Colored Wristbands as the marker signaling undercover MPD officers. That is a government document, not a theory.",
    tag: "Government document",
  },
];

const CHARTS = [
  { k: "Chart 04", h: "The Connection Web", p: "Who informed, who was never identified, and who the hammer came down on. Every line labeled with what the relationship actually is." },
  { k: "Chart 05", h: "The Sentencing Disparity", p: "Same building, same afternoon, mostly the same tunnel. 78 months at the top. Never charged at the bottom." },
  { k: "Chart 10", h: "Nine Roles, One Afternoon", p: "The playbook's nine roles and who filled them that day. One row is honestly empty, and I say so." },
  { k: "Chart 11", h: "Days Until Arrest", p: "Eight days for one man. Two and a half years for another. Never, for two more." },
  { k: "Chart 09", h: "140 Years", p: "1881 to January 6, 2021 on one timeline. Where the playbook actually comes from." },
  { k: "Chart 12", h: "What 14,000 Hours Looks Like", p: "583 days of continuous video. One highlighted square for what the public was shown." },
];

const INSIDE = [
  { k: "The tunnel", h: "What I saw in there", p: "My account of the Lower West Terrace tunnel. What I saw, what I heard officers say to each other, and what happened to the people beside me." },
  { k: "The battle plan", h: "Infiltrate. Agitate. Retaliate.", p: "The documented playbook, and how that afternoon maps onto it, role by role." },
  { k: "The roles", h: "Nine jobs in that crowd", p: "Medics. Scanner operators. Agitators. Suppliers. With stills from the footage and the question each one raises." },
  { k: "The unnamed", h: "Still no name on a docket", p: "People filmed working with police in the middle of a riot who were never identified or charged, even after we asked the government to name them in a motion." },
];

const LABELS = [
  { t: "Fact", c: "#4cc38a", d: "It is in the record. Go pull it yourself." },
  { t: "Ryan's account", c: "#8a93f8", d: "I lived it. This is my word." },
  { t: "Documented inference", c: "#c9a7f5", d: "My conclusion, and I mark it as mine." },
  { t: "Needs authentication", c: "#e0913f", d: "I believe it. I cannot prove it yet." },
];

export default function TheBigLiePage() {
  return (
    <article className="rrn-page">
      {/* HERO */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
                Free · 26,102 words · 166 images · 12 charts
              </p>
              <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight text-[#fdf8ea] sm:text-6xl">
                They called us liars.
                <br />
                Then their own footage
                <br />
                told a different story.
              </h1>
              <p className={`mt-6 max-w-2xl sm:text-lg ${BODY}`}>
                I put this together in solitary confinement with almost nothing. A court
                issued laptop. An evidence thumb drive. Three books. No internet at all.
                And what was left of my sanity.
              </p>
              <p className="mt-4 max-w-2xl font-display text-xl font-black leading-snug text-[#e1bd5b] sm:text-2xl">
                They handed me their own evidence because they had to. I think they
                expected it to bury me.
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.l} className="rounded-xl border border-[#203a64] bg-[#0b1830] p-4 text-center">
                    <dt className="font-display text-3xl font-black tracking-tight text-[#e1bd5b]">{s.n}</dt>
                    <dd className="mt-1.5 text-[10px] font-black uppercase leading-tight tracking-[0.1em] text-[#9fb2d0]">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="get" className="lg:sticky lg:top-24">
              <BigLieGate source="thebiglie" />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT I HAD */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <p className={KICKER}>The whole inventory</p>
          <h2 className={`mt-3 ${H2}`}>What I had to work with.</h2>
          <p className={`mt-4 max-w-2xl ${BODY}`}>
            This is not a humble brag. It is the reason you should read it carefully. Every
            single thing in this report had to survive being produced under these
            conditions.
          </p>
          <ol className="mt-9 space-y-3">
            {HAD.map((h) => (
              <li
                key={h.n}
                className="flex gap-5 rounded-xl border border-[#203a64] bg-[#0b1830] p-5"
              >
                <span className="font-display text-2xl font-black tabular-nums text-[#e1bd5b]">
                  {h.n}
                </span>
                <span>
                  <span className="block font-display text-lg font-black text-[#fdf8ea]">
                    {h.t}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                    {h.d}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PROVENANCE + C2B */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 className={H2}>Where this came from.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className={CARD}>
              <p className={KICKER}>2021 to 2022</p>
              <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">Written inside</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                D.C. Department of Corrections. Pod C2B, and then solitary. Written on the
                court issued laptop while I worked through discovery.
              </p>
            </div>
            <div className={CARD}>
              <p className={KICKER}>Through March 2023</p>
              <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">Revised inside</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                Still in custody. Still no internet. Every outside source in it is a book I
                could hold or a file I could open on that drive.
              </p>
            </div>
            <div className={CARD}>
              <p className={KICKER}>July 2026</p>
              <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">Recovered</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                Pulled off the old evidence drive, laid out with the images and the charts,
                and published free. Four and a half years after the first word.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border-2 border-[#4cc38a] bg-[#0b1f1a] p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4cc38a]">
              This part is verifiable
            </p>
            <p className="mt-3 font-display text-xl font-black leading-snug text-[#fdf8ea] sm:text-2xl">
              I did not write this after the fact, with hindsight, from a comfortable
              chair. I wrote it in a cell. The men who were in C2B with me can tell you so,
              because they watched me do it.
            </p>
            <p className={`mt-4 ${BODY}`}>
              That matters more than anything else on this page, because everything in the
              next section was written before it was public.
            </p>
          </div>
        </div>
      </section>

      {/* THE COUNT CHANGED */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <p className={KICKER}>The number moved</p>
          <h2 className={`mt-3 ${H2}`}>They told us 14,000 hours. It was not 14,000 hours.</h2>
          <div className="mt-6 space-y-4">
            <p className={BODY}>
              Every time I say 14,000 hours in this report, that is the number I
              had. It is what the government said existed, and I wrote the whole
              thing believing it.
            </p>
            <p className={BODY}>
              It was not the whole picture. The 14,000 hours covered noon to eight
              PM on one single day, and only what the Capitol Police handed the
              FBI. Out of that, the government produced half and withheld the
              other half as not relevant to the case. What actually reached
              defendants was 4,800 hours from 515 cameras.
            </p>
            <p className="font-display text-xl font-black leading-snug text-[#e1bd5b] sm:text-2xl">
              In February 2023 my own motion put 41,000 hours on the record. In
              November 2023 the House began releasing what it put at 44,000.
            </p>
            <p className={BODY}>
              So what I was handed in that cell, and built this entire report out
              of, was somewhere around a tenth of what existed. And 44,000 is only
              what has been tracked and recovered.
            </p>
          </div>

          <figure className="mt-10 overflow-hidden rounded-2xl border border-[#203a64] bg-[#0b1830]">
            <img
              src="/thebiglie/charts/footage-count.png"
              alt="Bar chart comparing January 6 footage volume figures from 4,800 hours produced to defendants up to the 44,000 hour House total"
              width={1100}
              height={806}
              className="block h-auto w-full"
            />
          </figure>

          <figure className="mt-4 overflow-hidden rounded-2xl border border-[#203a64] bg-[#0b1830]">
            <img
              src="/thebiglie/charts/footage-scale.png"
              alt="Grid of 1,833 squares, one per day of continuous video. 200 are marked as what reached defendants and 583 as what was said to exist."
              width={1200}
              height={1200}
              className="block h-auto w-full"
            />
            <figcaption className="border-t border-[#203a64] px-5 py-3 text-xs font-semibold text-[#9fb2d0]">
              Every square is one full day of continuous video. The red block is
              what actually reached defendants. The blue is what I was told
              existed. Everything below it existed the whole time.
            </figcaption>
          </figure>

          <div className="mt-6 rounded-2xl border border-[#e0913f] bg-[#20150a] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e0913f]">
              I did not change the report
            </p>
            <p className={`mt-3 ${BODY}`}>
              The 14,000 figure stays exactly where it is on every page of the
              report, because that is what I knew when I wrote it. I am telling
              you here what the number turned out to be instead of quietly going
              back and editing myself. That is the same rule I follow everywhere
              else in this thing.
            </p>
          </div>
        </div>
      </section>

      {/* ON THE RECORD, 2022 */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <p className={KICKER}>July 21, 2022 &middot; on the record</p>
          <h2 className={`mt-3 ${H2}`}>I said it in open court. A year later the number tripled.</h2>
          <p className={`mt-4 max-w-2xl ${BODY}`}>
            The number did not just quietly grow. We tracked it ourselves from
            inside the jail, on the same evidence platform the government used to
            serve us, and we said so to the judges. This is the transcript.
          </p>

          <figure className="mt-8 rounded-2xl border-2 border-[#8a93f8] bg-[#0b1830] p-6 sm:p-8">
            <figcaption className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8a93f8]">
              Status conference before Judge Thomas F. Hogan &middot; ECF 113, page 14
            </figcaption>
            <blockquote className="mt-4 font-display text-lg font-black leading-relaxed text-[#fdf8ea] sm:text-xl">
              &ldquo;The government said a couple status hearings ago that all the
              evidence was uploaded. But we got a new download of evidence on
              Evidence.com on May 31st, a ton of new videos. And so all the
              evidence wasn&rsquo;t on Evidence.com like the government told
              us.&rdquo;
            </blockquote>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              And a page later: &ldquo;If the January 6th hearing committee is
              getting discovery that we don&rsquo;t have access to, what more do
              they have that we don&rsquo;t have access to that could possibly
              exonerate me? Because I&rsquo;ve already found exculpatory evidence
              on body cam video.&rdquo;
            </p>
          </figure>

          <div className="mt-4 rounded-2xl border border-[#e0533f] bg-[#210f0c] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e0533f]">
              The court&rsquo;s answer
            </p>
            <blockquote className="mt-3 font-display text-lg font-black leading-relaxed text-[#fdf8ea]">
              &ldquo;There&rsquo;s a lot of conspiracy theories and a lot of
              theories you have, and we&rsquo;ll see what evidence is
              produced.&rdquo;
            </blockquote>
          </div>

          <p className={`mt-6 ${BODY}`}>
            Sixteen months after that hearing, the House began releasing 44,000
            hours. I was not theorizing. I was reading the file counts on the
            screen they gave me.
          </p>

          <div className="mt-6 rounded-xl border border-[#203a64] bg-[#0b1830] p-5">
            <p className={KICKER}>Pull it yourself</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
              United States v. Nichols &amp; Harkrider, No. 1:21-cr-00117 (D.D.C.),
              ECF 113, transcript of the July 21, 2022 status conference. It is
              free and public. I am not asking anybody to take my word for it.
            </p>
          </div>

          <figure className="mt-10 overflow-hidden rounded-2xl border border-[#203a64] bg-[#0b1830]">
            <img
              src="/thebiglie/charts/review-time.png"
              alt="Bar chart of how many days it takes to watch the January 6 discovery footage, against the 548 days Ryan Nichols was held awaiting trial"
              width={1200}
              height={1200}
              className="block h-auto w-full"
            />
          </figure>
        </div>
      </section>

      {/* WHAT CAME TRUE */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <p className={KICKER}>The part that still gets me</p>
          <h2 className={`mt-3 ${H2}`}>I wrote it in a cell. Then it started coming out.</h2>
          <p className={`mt-4 max-w-2xl ${BODY}`}>
            I was not following the news. I had no news. I wrote what I could see in that
            footage and what I could reason from it, and then I sat in there while the
            record caught up.
          </p>

          <div className="mt-10 space-y-4">
            {CAME_TRUE.map((r, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#203a64]">
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-[#203a64] bg-[#0b1830] p-6 md:border-b-0 md:border-r">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a93f8]">
                      What I wrote, in the cell
                    </p>
                    <p className="mt-3 text-base font-bold leading-relaxed text-[#fdf8ea]">
                      {r.then}
                    </p>
                  </div>
                  <div className="bg-[#0b1f1a] p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4cc38a]">
                      {r.tag}
                    </p>
                    <p className="mt-3 text-base font-semibold leading-relaxed text-[#cfd9ea]">
                      {r.later}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm font-semibold leading-relaxed text-[#7b8db0]">
            Every item on the right is a public record you can check yourself. The report
            cites all of it in the endnotes. I am not asking anybody to take my word for
            any of it.
          </p>
        </div>
      </section>

      {/* LEFT AS WRITTEN */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className={H2}>I left it the way I wrote it.</h2>
          <div className="mt-6 space-y-4">
            <p className={BODY}>
              There is a lot in here I would say differently today. I know more now. Some of
              it I would sharpen. Some of it I would soften. A few names I would think
              harder about.
            </p>
            <p className="font-display text-xl font-black leading-snug text-[#fdf8ea] sm:text-2xl">
              I left it alone anyway.
            </p>
            <p className={BODY}>
              What I fixed was spelling, formatting, and anything the public record has
              since corrected. Where the record now says something different than I did, I
              say so right on the page instead of quietly editing myself. Where an image
              belonged to somebody else, I took it out and left a card telling you exactly
              what was there.
            </p>
            <p className="font-display text-xl font-black leading-snug text-[#e1bd5b] sm:text-2xl">
              You are reading what a man wrote in a cell in 2021, not what he wishes he had
              written in 2026.
            </p>
            <p className={BODY}>
              That is the only version worth publishing. Anything else is just me marking my
              own homework.
            </p>
          </div>
        </div>
      </section>

      {/* LABELS + RECEIPT */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 className={H2}>Every claim is labeled.</h2>
          <p className={`mt-4 max-w-2xl ${BODY}`}>
            You will always know exactly what you are reading and how much weight it
            carries. That is the difference between this report and a rumor.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {LABELS.map((l) => (
              <div key={l.t} className={CARD}>
                <span
                  className="inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em]"
                  style={{ color: l.c, borderColor: l.c }}
                >
                  {l.t}
                </span>
                <p className="mt-2.5 text-sm font-semibold text-[#cfd9ea]">{l.d}</p>
              </div>
            ))}
          </div>

          <figure className="mt-10 rounded-2xl border border-[#e1bd5b] bg-[#0b1830] p-6 sm:p-8">
            <figcaption className="text-[11px] font-black uppercase tracking-[0.15em] text-[#e1bd5b]">
              Government document · MPD January 6th preparation report
            </figcaption>
            <blockquote className="mt-4 font-display text-xl font-black leading-snug text-[#fdf8ea] sm:text-2xl">
              MPD&rsquo;s own preparation report listed &ldquo;Rainbow Colored
              Wristbands&rdquo; as the marker signaling undercover MPD officers in the
              crowd.
            </blockquote>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
              Corroborated independently by researcher Timothy Hale-Cusanelli. This is what
              turns a theory into a documented question.
            </p>
          </figure>
        </div>
      </section>

      {/* CHARTS */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className={`text-center ${H2}`}>Twelve charts I could never draw from in there.</h2>
          <p className={`mx-auto mt-3 max-w-2xl text-center ${BODY}`}>
            I could describe this to a cellmate. I could not show it to anybody. Now you
            can look at it.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHARTS.map((c) => (
              <div key={c.k} className={CARD}>
                <p className={KICKER}>{c.k}</p>
                <h3 className="mt-2 font-display text-lg font-black text-[#fdf8ea]">{c.h}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSIDE */}
      <section className={`border-b border-[#203a64] ${DARK}`}>
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className={H2}>What is inside.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {INSIDE.map((c) => (
              <div key={c.k} className={CARD}>
                <p className={KICKER}>{c.k}</p>
                <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">{c.h}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE BAND */}
      <section className="bg-[#e1bd5b] text-[#071126]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-4xl font-black text-[#071126] sm:text-5xl">
            Free. Always free. Share it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-bold text-[#071126]">
            I am not selling you the truth. I am handing it to you and asking you to pass it
            on to somebody who told you that you were crazy.
          </p>
          <a
            href="#get"
            className="mt-8 inline-block rounded-lg bg-[#071126] px-10 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#fdf8ea] transition hover:brightness-125"
          >
            Send Me The Report
          </a>
        </div>
      </section>

      {/* NEXT */}
      <section className={DARK}>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className={H2}>This report is the front door.</h2>
          <p className={`mx-auto mt-4 max-w-2xl ${BODY}`}>
            The BIG Lie is what I could prove from a cell. The years in custody, the
            solitary, the due process violations a federal judge acknowledged on the record,
            the pardon and the rebuild are in my memoir, Fighting Shadows.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/book"
              className="rounded-lg bg-[#e1bd5b] px-7 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-[#071126] transition hover:brightness-110"
            >
              See Fighting Shadows
            </Link>
            <Link
              href="/tell-your-story"
              className="rounded-lg border-2 border-[#2b4a7a] px-7 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-[#cfd9ea] transition hover:border-[#e1bd5b]"
            >
              Send Receipts
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
