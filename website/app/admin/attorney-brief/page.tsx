import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Attorney Brief",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const meeting = {
  firm: "Saputo Toufexis | Criminal Defense PLLC",
  attorney: "Paul Saputo / Saputo Toufexis team",
  when: "Friday, June 5, 2026 at 11:30 AM",
  where: "1845 Woodall Rodgers Freeway, Suite 1500, Dallas, Texas 75201",
  website: "https://saputo.law/",
};

const urgentAsks = [
  "Get the charging instruments for both harassment counts and the deadly conduct charge.",
  "Demand preservation and production of bodycam, dashcam, CAD, dispatch audio, witness statements, church video, jail-hallway bodycam, and all source statements.",
  "Compare the official allegation wording against the later public story that Ryan pulled or pointed a gun.",
  "Evaluate whether statements made while Ryan was in custody should be suppressed or limited.",
  "Decide what should be public, what should stay private, and what belongs only in discovery or attorney work product.",
];

const chargeCards = [
  {
    label: "Charge 1",
    title: "Deadly conduct",
    status: "Active criminal matter",
    tone: "red",
    summary:
      "Public reporting says Harrison County alleged Ryan displayed a firearm during a church-parking-lot dispute after service. Ryan disputes pulling, pointing, brandishing, or firing a gun.",
    proof:
      "Need charging instrument, offense report, bodycam, dashcam, dispatch/CAD, witness statements, church video, and any public press-release source file.",
  },
  {
    label: "Charge 2",
    title: "Harassment count one",
    status: "Needs exact charge packet",
    tone: "gold",
    summary:
      "Current site records preserve a Treece public comment, Messenger thread, and Ryan's report/call to Harrison County. Exact complainant, date range, and alleged messages need confirmation from the charging instrument.",
    proof:
      "Need complaint, probable-cause affidavit, screenshots police relied on, complete thread export, call logs, and report number.",
  },
  {
    label: "Charge 3",
    title: "Harassment count two",
    status: "Needs exact charge packet",
    tone: "gold",
    summary:
      "The second harassment count is not fully identified in the current repo/Drive pass. Treat it as unknown until the attorneys compare the actual complaint to the preserved evidence.",
    proof:
      "Need charging document, named complainant, alleged platform, alleged dates, screenshots, and officer narrative.",
  },
];

const sourceChain = [
  {
    step: "Official baseline",
    title: "HCSO public allegation",
    body:
      "Site records preserve the public allegation wording: Ryan allegedly raised his shirt to display a firearm and placed his hand on the grip.",
    use: "This is the baseline before later public versions escalated the story.",
  },
  {
    step: "Public escalation",
    title: "Pulled / pointed gun version",
    body:
      "Public screenshots and video receipts show later statements describing the incident as pulling a gun, pointing at a vehicle, backstop language, or reaching for a gun.",
    use: "This distinction matters because a changed public story can affect fear, witnesses, and public pressure.",
  },
  {
    step: "Defense position",
    title: "Ryan denies the escalated version",
    body:
      "Ryan denies drawing, pulling, pointing, brandishing, or firing a gun. The dashboard does not ask counsel to rely on Ryan's word alone; it asks for source footage and authenticated records.",
    use: "Attorneys should force the case back to footage, reports, and original statements.",
  },
  {
    step: "Missing record",
    title: "Bodycam and source files",
    body:
      "Ryan requested bodycam/source records. Site records say the current church case response was active-case / call-sheet-only, followed by a second written request.",
    use: "Discovery and preservation requests should be immediate.",
  },
];

const people = [
  ["Ryan Nichols", "Defendant; Marine veteran; J6 pardoned defendant; site owner; denies pulling/pointing/firing a gun."],
  ["Amanda Williams", "Ryan's partner; present in background family/court context; part of Treece Messenger thread according to preserved article records."],
  ["Trey Treece", "Public comment / Messenger thread source in preserved site records; exact role in any harassment charge needs charging packet confirmation."],
  ["Jessica Treece", "Messenger thread participant shown in preserved site records; exact role needs charging packet confirmation."],
  ["Jon Costello", "Church-dispute public video/source-chain figure in site records; exact complainant status needs official records."],
  ["Kacie Costello", "Public video/source-chain figure in site records; exact witness or complainant status needs official records."],
  ["B.J. Fletcher", "Harrison County Sheriff quoted in public reporting and tied to HCSO public allegation language."],
  ["Cindy Black", "Records custodian contact in bodycam/source-record request history."],
  ["Lt. Ron England", "Separate July 13, 2025 file/bodycam history; important to keep separate from current church case."],
  ["Bonnie Nichols", "Family-court / testimony / background context. Do not merge her issues into the criminal defense unless counsel says it helps."],
  ["Bo Rogers", "Former attorney / background context; relevant only if counsel needs broader litigation context."],
  ["Kelly Hydekamp / Scott Carlisle", "Family-court counsel context; not a substitute for proof in criminal case."],
  ["Alex Harkrider", "J6/context witness lane mentioned by Ryan; needs a specific fact before use."],
  ["Nathaniel Moran", "Political/congress context mentioned by Ryan; needs a specific fact before use."],
];

const evidenceLanes = [
  {
    title: "Church incident source records",
    items: [
      "Charging instruments and probable-cause affidavits",
      "HCSO offense report and supplement reports",
      "Bodycam, dashcam, CAD, dispatch audio, call sheet",
      "Witness statements and source statements",
      "Any church security or member-recorded video",
      "Jail-hallway bodycam / custodial questioning record",
    ],
  },
  {
    title: "Public narrative receipts",
    items: [
      "HCSO public allegation screenshot crop",
      "KLTV/KWTX article and any HCSO quote source",
      "Law&Crime article / headline framing",
      "Costello video receipt and poster frame",
      "Public comments: Bible / back turned / getting violent / pieces of you / beat threat",
      "Master exhibit index page and source-chain notes",
    ],
  },
  {
    title: "Harassment charge packets",
    items: [
      "Exact complainants for both counts",
      "Complete platform exports, not cropped screenshots only",
      "Dates, timestamps, URLs, message IDs, and device/account metadata",
      "Ryan's May 12 Harrison County report/call record",
      "Screenshots that show Ryan asking for comments to come down before public escalation",
      "Any police report showing what standard was applied to Ryan versus reports Ryan made",
    ],
  },
  {
    title: "Background context counsel may need",
    items: [
      "Nichols v. Nichols master briefing",
      "Williams TRO false-testimony motion draft",
      "AT&T phone-line contempt transcript and date correction",
      "Wholesale Universe / Robinhood / DocuSign context only if it explains motive, pressure, or credibility",
      "Prior J6/pardon/public figure context only if the State or media uses it",
      "Proof of public threats against Ryan after the church-gun story spread",
    ],
  },
];

const sourceLinks = [
  {
    label: "Master Exhibit Index",
    href: "/posts/master-exhibit-index",
    note: "Ordered public receipt list for the Harrison County record.",
  },
  {
    label: "The Record They Can't Bury",
    href: "/posts/the-record-they-cant-bury-threats-rumors-bodycam",
    note: "Public threat wall, church-gun story, and bodycam request narrative.",
  },
  {
    label: "Treece Messages / Church Gun Story",
    href: "/posts/when-i-asked-for-a-comment-to-come-down",
    note: "Draft/public-source chain depending on publish status; use carefully.",
  },
  {
    label: "KLTV/KWTX public report",
    href: "https://www.kwtx.com/2026/05/11/pardoned-jan-6-protester-ryan-nichols-accused-reaching-gun-during-church-dispute/",
    note: "Public report quoting HCSO / Sheriff Fletcher. Verify original law-enforcement source in discovery.",
  },
  {
    label: "Saputo Toufexis",
    href: meeting.website,
    note: "Meeting firm website.",
  },
];

const questionsForRyan = [
  "What are the exact cause numbers / complaint numbers for the two harassment charges and deadly conduct charge?",
  "Who are the named complainants on each harassment count?",
  "What exact statements, posts, or messages did law enforcement say make up each harassment charge?",
  "Were you questioned in jail or in custody about any video or separate allegation without Miranda warnings?",
  "Do you have the bond paperwork, magistrate warnings, probable-cause affidavit, or booking sheet?",
  "Which raw videos/screenshots are native files versus edited public receipts?",
  "Who can authenticate the Messenger thread, public comments, church video, and records requests?",
  "What must be kept private because it includes minors, addresses, phone numbers, medical/cannabis-card data, or family-court sensitive material?",
];

export default async function AttorneyBriefPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/attorney-brief");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-[86rem] px-4 py-6">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Attorney case dashboard
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black leading-[0.98] sm:text-5xl">
            Three charges. One source-record fight.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-ink-soft)]">
            Built for the Dallas criminal-defense meeting. The goal is simple:
            give counsel the clean record, isolate the missing proof, and keep
            the public narrative separate from authenticated evidence.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Charges" value="3" sub="2 harassment / 1 deadly conduct" />
            <Metric label="Meeting" value="11:30" sub="Friday, June 5" />
            <Metric label="Key fight" value="Bodycam" sub="source footage first" />
            <Metric label="Risk" value="High" sub="public narrative escalation" hot />
          </div>
        </div>

        <aside className="rounded-md border border-[#203a64] bg-[#071126] p-5 text-[#fdf8ea] shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
            Meeting
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
            {meeting.firm}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <InfoRow label="Attorney" value={meeting.attorney} />
            <InfoRow label="When" value={meeting.when} />
            <InfoRow label="Where" value={meeting.where} />
          </dl>
          <a
            href={meeting.website}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-[#7fe3a9]/50 bg-[#7fe3a9]/15 px-4 text-sm font-black text-[#7fe3a9] transition hover:bg-[#7fe3a9]/25"
          >
            Open firm site
          </a>
        </aside>
      </section>

      <section className="mt-4 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
        <div className="grid gap-4 lg:grid-cols-[0.35fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Counsel first
            </p>
            <h2 className="mt-1 font-sans text-xl font-black">
              Do this before strategy.
            </h2>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {urgentAsks.map((ask, index) => (
              <li key={ask} className="rounded-sm border border-[var(--color-accent)]/30 bg-white/40 p-3 text-sm font-semibold leading-6">
                <span className="mr-2 font-black text-[var(--color-accent)]">
                  {index + 1}.
                </span>
                {ask}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-3">
        {chargeCards.map((card) => (
          <ChargeCard key={card.title} {...card} />
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-md border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
            Source chain
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
            What an attorney needs to see plainly
          </h2>
          <div className="mt-4 grid gap-3">
            {sourceChain.map((item) => (
              <div key={item.title} className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8c89e]">
                  {item.step}
                </p>
                <h3 className="mt-1 font-sans text-lg font-black text-[#fdf8ea]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#cfd9ea]">{item.body}</p>
                <p className="mt-2 text-xs font-bold leading-5 text-[#7fe3a9]">
                  Use: {item.use}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            People map
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black">
            Names counsel may hear
          </h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {people.map(([name, role]) => (
              <div key={name} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                <p className="text-sm font-black">{name}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                  {role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {evidenceLanes.map((lane) => (
          <section key={lane.title} className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <h2 className="font-sans text-xl font-black">{lane.title}</h2>
            <ul className="mt-3 space-y-2">
              {lane.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-support)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="mt-5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Open questions
        </p>
        <h2 className="mt-2 font-sans text-2xl font-black">
          Fill these before the meeting if possible
        </h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {questionsForRyan.map((question) => (
            <div key={question} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm font-semibold leading-6">
              {question}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
          Source links
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {sourceLinks.map((source) => (
            <a
              key={source.href}
              href={source.href}
              className="rounded-md border border-white/10 bg-white/5 p-3 transition hover:border-[#7fe3a9]/50 hover:bg-[#7fe3a9]/10"
            >
              <span className="block text-sm font-black text-[#fdf8ea]">
                {source.label}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-[#cfd9ea]">
                {source.note}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">
          Operator note
        </p>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          This page intentionally separates confirmed public records, Ryan
          statements, documented inferences, and missing items. The fastest way
          to make this stronger is to add the actual charging instruments,
          probable-cause affidavits, report numbers, and native source files.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/case" className="rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-black hover:border-[var(--color-accent)]">
            Upload case docs
          </Link>
          <Link href="/admin" className="rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-black hover:border-[var(--color-accent)]">
            Back to admin
          </Link>
        </div>
      </section>
    </article>
  );
}

function Metric({
  label,
  value,
  sub,
  hot = false,
}: {
  label: string;
  value: string;
  sub: string;
  hot?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-md border p-3",
        hot
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-paper)]",
      ].join(" ")}
    >
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--color-ink-soft)]">
        {sub}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8c89e]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold leading-6 text-[#fdf8ea]">{value}</dd>
    </div>
  );
}

function ChargeCard({
  label,
  title,
  status,
  summary,
  proof,
  tone,
}: {
  label: string;
  title: string;
  status: string;
  summary: string;
  proof: string;
  tone: string;
}) {
  const isRed = tone === "red";
  return (
    <section
      className={[
        "rounded-md border p-4",
        isRed
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">
          {label}
        </p>
        <span
          className={[
            "rounded-sm px-2 py-1 text-[10px] font-black uppercase",
            isRed
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-support-soft)] text-[var(--color-support-strong)]",
          ].join(" ")}
        >
          {status}
        </span>
      </div>
      <h2 className="mt-2 font-sans text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
        {summary}
      </p>
      <div className="mt-3 rounded-sm border border-[var(--color-line)] bg-white/45 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Missing proof
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
          {proof}
        </p>
      </div>
    </section>
  );
}
