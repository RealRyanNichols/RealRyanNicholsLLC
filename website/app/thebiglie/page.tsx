import type { Metadata } from "next";
import Link from "next/link";
import { BigLieGate } from "@/components/BigLieGate";
import { SITE } from "@/lib/site";

const title = "The BIG Lie — A Free Report by Ryan Nichols";
const description =
  "26,102 words. 166 images. 12 charts. Written in solitary confinement on a court-issued evidence laptop, off 14,000+ hours of January 6 bodycam, CCTV and crowd footage. Read it free.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/thebiglie` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/thebiglie`,
  },
  twitter: { card: "summary_large_image", title, description },
};

const STATS = [
  { n: "26,102", l: "Words written in a cell" },
  { n: "166", l: "Images from the record" },
  { n: "14,000+", l: "Hours of footage reviewed" },
  { n: "0", l: "Minutes of internet access" },
];

const CHARTS = [
  {
    k: "Chart 04",
    h: "The Connection Web",
    p: "Who informed, who was never identified, and who the hammer came down on. Every line labeled.",
  },
  {
    k: "Chart 05",
    h: "The Sentencing Disparity",
    p: "Same building, same afternoon. 78 months at the top. Never charged at the bottom.",
  },
  {
    k: "Chart 10",
    h: "Nine Roles, One Afternoon",
    p: "The playbook's nine roles and who filled them that day. One row is honestly empty.",
  },
  {
    k: "Chart 11",
    h: "Days Until Arrest",
    p: "Eight days for one man. Two and a half years for another. Never, for two more.",
  },
];

const INSIDE = [
  {
    k: "The tunnel",
    h: "What I saw in there",
    p: "My account of the Lower West Terrace tunnel. What I saw, what I heard officers say to each other, and what happened to the people beside me.",
  },
  {
    k: "The battle plan",
    h: "Infiltrate. Agitate. Retaliate.",
    p: "The documented playbook, and how that afternoon maps onto it, role by role.",
  },
  {
    k: "The roles",
    h: "Nine jobs in that crowd",
    p: "Medics. Scanner operators. Agitators. Suppliers. With stills from the footage and the question each one raises.",
  },
  {
    k: "The unnamed",
    h: "Still no name on a docket",
    p: "People filmed working with police mid riot who were never identified or charged, even after we asked in a court motion.",
  },
];

const LABELS = [
  { t: "Fact", c: "#4cc38a", d: "It is in the record." },
  { t: "Ryan's account", c: "#8a93f8", d: "I lived it." },
  { t: "Documented inference", c: "#c9a7f5", d: "My conclusion, marked as mine." },
  { t: "Needs authentication", c: "#e0913f", d: "I believe it. I cannot prove it yet." },
];

export default function TheBigLiePage() {
  return (
    <article className="rrn-page">
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
                Free report · 26,102 words · 166 images · 12 charts
              </p>
              <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                They called us liars.
                <br />
                Then their own footage
                <br />
                told a different story.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
                I wrote The BIG Lie in solitary confinement on a court issued
                evidence laptop, awaiting trial. No internet. No open library.
                Just 14,000+ hours of bodycam, CCTV and crowd video the
                government handed me in discovery, and the books my wife could
                mail in.
              </p>
              <p className="mt-5 text-sm font-semibold text-[#7b8db0]">
                Written 2021 to 2022. Revised through March 2023. Recovered from
                the evidence drive July 2026.
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div
                    key={s.l}
                    className="rounded-xl border border-[#203a64] bg-[#0b1830] p-4 text-center"
                  >
                    <dt className="font-display text-3xl font-black tracking-tight text-[#e1bd5b]">
                      {s.n}
                    </dt>
                    <dd className="mt-1.5 text-[10px] font-black uppercase leading-tight tracking-[0.1em] text-[#9fb2d0]">
                      {s.l}
                    </dd>
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

      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            Read that again.
          </h2>
          <div className="mt-6 space-y-3 font-display text-xl font-black leading-snug sm:text-2xl">
            <p>A man sits in solitary confinement.</p>
            <p>The government hands him a laptop loaded with its own evidence.</p>
            <p>14,000+ hours of bodycam, CCTV and crowd footage.</p>
            <p>They expected it to bury him.</p>
            <p>He watched all of it.</p>
            <p className="text-[#e1bd5b]">And he took notes.</p>
          </div>
          <p className="mt-8 text-base font-semibold leading-7 text-[#cfd9ea]">
            The BIG Lie is those notes. My firsthand account of the Lower West
            Terrace tunnel, where I was sprayed and beaten alongside men and
            women who are still living with what happened in there. And my
            analysis of what I watched in that footage, frame by frame. Who fit
            the roles. Who worked the crowd. Who handed items to police in the
            middle of a riot and was never named, never charged, never
            identified, even when we asked the government in a motion.
          </p>
        </div>
      </section>

      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            The receipt
          </h2>
          <figure className="mt-6 rounded-2xl border border-[#e1bd5b] bg-[#0b1830] p-6 sm:p-8">
            <figcaption className="text-[11px] font-black uppercase tracking-[0.15em] text-[#e1bd5b]">
              Government document · MPD January 6th preparation report
            </figcaption>
            <blockquote className="mt-4 font-display text-xl font-black leading-snug sm:text-2xl">
              MPD&rsquo;s own preparation report listed &ldquo;Rainbow Colored
              Wristbands&rdquo; as the marker signaling undercover MPD officers
              in the crowd.
            </blockquote>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
              A government document showing law enforcement used colored markers
              in that crowd. Corroborated independently by researcher Timothy
              Hale-Cusanelli. This is what turns a theory into a documented
              question.
            </p>
          </figure>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {LABELS.map((l) => (
              <div
                key={l.t}
                className="rounded-xl border border-[#203a64] bg-[#0b1830] p-4"
              >
                <span
                  className="inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em]"
                  style={{ color: l.c, borderColor: l.c }}
                >
                  {l.t}
                </span>
                <p className="mt-2.5 text-sm font-semibold text-[#cfd9ea]">
                  {l.d}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-base font-semibold leading-7 text-[#cfd9ea]">
            Every claim in this report carries one of those four labels. You
            will always know which one you are reading. That is the difference
            between this report and a rumor.
          </p>
        </div>
      </section>

      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center font-display text-3xl font-black sm:text-4xl">
            Twelve charts that show you what I saw
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base font-semibold text-[#cfd9ea]">
            I could never draw this for anyone from a cell. Now you can look at
            it.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHARTS.map((c) => (
              <div
                key={c.k}
                className="rounded-xl border border-[#203a64] bg-[#0b1830] p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#e1bd5b]">
                  {c.k}
                </p>
                <h3 className="mt-2 font-display text-lg font-black">{c.h}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                  {c.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            What is inside
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {INSIDE.map((c) => (
              <div
                key={c.k}
                className="rounded-xl border border-[#203a64] bg-[#0b1830] p-6"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#e1bd5b]">
                  {c.k}
                </p>
                <h3 className="mt-2 font-display text-xl font-black">{c.h}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                  {c.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e1bd5b] text-[#071126]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            Free. Always free. Share it.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-bold">
            I am not selling you the truth. I am giving it to you and asking you
            to pass it on.
          </p>
          <a
            href="#get"
            className="mt-7 inline-block rounded-lg bg-[#071126] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#fdf8ea] transition hover:brightness-125"
          >
            Send Me The Report
          </a>
        </div>
      </section>

      <section className="bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            This report is the front door.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea]">
            The BIG Lie is what I could prove from a cell. The years in custody,
            the solitary, the due process violations a federal judge
            acknowledged on the record, the pardon and the rebuild are in my
            memoir, Fighting Shadows.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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
