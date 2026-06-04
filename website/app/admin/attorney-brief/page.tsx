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
  "Representation status visible: Ryan reports no attorney has formally appeared in the active criminal matter, divorce/business matter, or J6 damages/compensation lane.",
  "Bond issue visible: possible revocation or modification tied to social-media conduct; written order and exact condition language belong in the packet.",
  "Court setting visible: June 9, 2026 arraignment lead, possible Case No. 2026-0226, Harrison County.",
  "Charging packets needed: both harassment counts and the deadly conduct charge.",
  "Discovery record needed: Article 39.14 / Michael Morton, Brady, bodycam, dashcam, CAD, dispatch audio, witness statements, church video, jail-hallway bodycam, and all source statements.",
  "Narrative comparison needed: official allegation wording versus later public claims that Ryan pulled or pointed a gun.",
  "Custody-questioning issue visible: any jail or custodial statements tied to video, social posts, or separate allegations.",
  "Recusal issue visible: Judicial Officer Joe Black assignment plus story-view / reaction screenshots need verification and placement in the record.",
  "Publication split visible: public record, private discovery, family-sensitive material, and attorney-work-product categories.",
];

const immediateEmergency = [
  {
    label: "Court setting",
    value: "June 9, 2026",
    note:
      "Google Drive attorney map lists arraignment in Harrison County; exact case number and docket entry still need verification.",
  },
  {
    label: "Possible case no.",
    value: "2026-0226",
    note:
      "Marked VERIFY in the Drive case map. It remains a lead until matched against the charging instrument or court portal.",
  },
  {
    label: "Bond issue",
    value: "Speech / social media",
    note:
      "Drive case map says bond was revoked for social-media conduct. Written revocation basis and condition wording belong in the packet.",
  },
  {
    label: "Discovery lane",
    value: "Art. 39.14 + Brady",
    note:
      "The current bodycam fight belongs in the criminal-case record, not only in open-records correspondence while the case is active.",
  },
  {
    label: "Representation",
    value: "Not represented",
    note:
      "Ryan reports he is not represented by anyone. Appearance status needs docket confirmation across each active matter.",
  },
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
      "Record packet: charging instrument, offense report, bodycam, dashcam, dispatch/CAD, witness statements, church video, and any public press-release source file.",
  },
  {
    label: "Charge 2",
    title: "Harassment count one",
    status: "Needs exact charge packet",
    tone: "gold",
    summary:
      "Current site records preserve a Treece public comment, Messenger thread, and Ryan's report/call to Harrison County. Exact complainant, date range, and alleged messages need confirmation from the charging instrument.",
    proof:
      "Record packet: complaint, probable-cause affidavit, screenshots police relied on, complete thread export, call logs, and report number.",
  },
  {
    label: "Charge 3",
    title: "Harassment count two",
    status: "Needs exact charge packet",
    tone: "gold",
    summary:
      "The second harassment count is not fully identified in the current repo/Drive pass. It remains unknown until the actual complaint is matched to the preserved evidence.",
    proof:
      "Record packet: charging document, named complainant, alleged platform, alleged dates, screenshots, and officer narrative.",
  },
];

const sourceChain = [
  {
    step: "Official baseline",
    title: "HCSO public allegation",
    body:
      "Site records preserve the public allegation wording: Ryan allegedly raised his shirt to display a firearm and placed his hand on the grip.",
    use: "This anchors the baseline before later public versions escalated the story.",
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
      "Ryan denies drawing, pulling, pointing, brandishing, or firing a gun. This dashboard keeps Ryan's statement beside the source footage and authenticated records that can test it.",
    use: "Footage, reports, and original statements are the center of the record.",
  },
  {
    step: "Missing record",
    title: "Bodycam and source files",
    body:
      "Ryan requested bodycam/source records. Site records say the current church case response was active-case / call-sheet-only, followed by a second written request.",
    use: "Discovery and preservation status is a live issue.",
  },
  {
    step: "Bond / speech",
    title: "Social-media condition and revocation issue",
    body:
      "The Google Drive attorney map says bond was revoked for social-media conduct and flags a possible overbreadth / First Amendment issue. This remains a lead until the bond condition and revocation order are in the packet.",
    use: "The record needs to separate public advocacy from prohibited contact or case-specific witness issues.",
  },
  {
    step: "Recusal lane",
    title: "Judicial Officer Joe Black",
    body:
      "The Drive map says the court portal showed Judicial Officer Black, Joe for the June 9 setting and that Ryan has story-view / reaction screenshots involving the name Joe Black.",
    use: "This supports a recusal/disclosure issue only if the assignment and screenshots verify cleanly.",
  },
];

const caseTheory = [
  "The official baseline allegation matters: display / hand-on-grip is not the same as pulled, pointed, fired, or threatened with a gun.",
  "Every witness version needs to trace back to native source files, not screenshots, headlines, or summaries.",
  "The Costello public video/comment lane matters because it may show how the public story escalated after the alleged church incident.",
  "The Treece thread matters only if the harassment charges rely on speech, threats, contact history, or unequal enforcement around online statements.",
  "The July 13 / James Chatham file is background-pattern evidence, not the church charge itself, unless the State uses old gun allegations or character framing.",
  "Source-first packet: charging packets, bodycam, dispatch, CAD, original witness statements, native videos, complete message exports.",
];

const financialImpact = [
  {
    label: "J6 compensation claim",
    value: "$35M",
    sub: "starting claim",
    body:
      "Existing /case/damages page lists a $35,000,000 starting claim for liberty lost, business destruction, family damage, medical injury, mental-health harm, and career destruction.",
  },
  {
    label: "J6 supported range",
    value: "$45-50M",
    sub: "claimed range",
    body:
      "The existing damages page says this range includes consequential damages, lost lifetime earning capacity, long-term medical care, and destruction of Wholesale Universe and family stability.",
  },
  {
    label: "Wholesale Universe",
    value: "multi-million",
    sub: "enterprise value",
    body:
      "Existing case pages describe Wholesale Universe, Inc. as a multi-million-dollar wholesale/retail company. Valuation proof includes ledgers, tax returns, bank records, inventory records, and related business records.",
  },
  {
    label: "Missing WU funds",
    value: "$750K-1.5M",
    sub: "claimed / audit needed",
    body:
      "Master case briefing and prompt package describe alleged missing funds in this range. This is a forensic-audit lane until bank statements and ledgers prove the number.",
  },
  {
    label: "Unauthorized debt",
    value: "$44K-49K",
    sub: "claimed debt exposure",
    body:
      "Prompt package lists a box-truck debt around $22K-27K plus Landstar shipping demand of $22,226.61 after POA-revocation issues. Creditor records and DocuSign audit trails are the verification lane.",
  },
  {
    label: "Phone/AT&T harm",
    value: "$1,663.90+",
    sub: "documented lane",
    body:
      "AT&T materials list $950 accelerated device balance plus $713.90 account balance, with additional new-service and access damages to verify.",
  },
];

const divorceBusinessLanes = [
  {
    title: "Business control and valuation",
    items: [
      "Wholesale Universe, Inc. formation documents showing Ryan as founder",
      "Wholesale Universe Inc. dissolution records and Wholesale Universe LLC formation records",
      "Tax returns, profit/loss, bank statements, ledgers, inventory, Amazon/FBA records, loan files, and merchant records",
      "Independent valuation of Wholesale Universe before detention, during divorce, and after transfer/control changes",
      "Whether the company was a community asset, separate property asset, or mixed asset under Texas law",
    ],
  },
  {
    title: "Divorce / business damages to quantify",
    items: [
      "$750K-$1.5M alleged missing funds from Master Case Briefing; forensic audit needed",
      "Unauthorized box-truck debt around $22K-$27K; creditor, date, signature, and DocuSign audit trail",
      "Landstar Transportation demand letter for $22,226.61; liability and signatory-authority records",
      "AT&T/phone harm: $950 + $713.90 = $1,663.90 plus communication and business-access damage",
      "Robinhood account breach allegation and any emptied investment-account balance",
      "Lost income, lost company access, homelessness, inability to work, litigation costs, and pro se time",
    ],
  },
];

const j6DamageLanes = [
  {
    title: "January 6 federal case damages",
    items: [
      "$35,000,000 starting claim listed on /case/damages",
      "$45-$50M supported range listed on /case/damages",
      "Liberty lost from January 18, 2021 arrest through January 20, 2025 pardon; charges later dismissed with prejudice",
      "Business destroyed: Wholesale Universe, Inc. described as multi-million-dollar enterprise",
      "Marriage/family damage, children daily-presence damage, career trajectory loss, medical injury, and mental-health harm",
      "Damages page summary; source exhibits need to be attached before relying on dollar amounts",
    ],
  },
];

const chronology = [
  {
    date: "July 13, 2025",
    title: "Separate James Chatham / firearm incident",
    body:
      "Drive motions say Ryan called law enforcement, Lt. Ron England responded, and Ryan maintains James Chatham grabbed a firearm while Ryan did not shoot, discharge, or fire a gun.",
  },
  {
    date: "After July 13, 2025",
    title: "Bodycam request through Cindy Black",
    body:
      "Drive motions and the site exhibit index say Cindy Black was the records contact for July 13 bodycam/source footage. Keep this file separate from the later church case.",
  },
  {
    date: "Williams TRO hearing",
    title: "False-testimony allegation",
    body:
      "Drive motions say Bonnie Nichols testified Ryan shot a gun on July 13. Ryan disputes that and says police records/video contradict it. Transcript and actual records are needed to verify the issue.",
  },
  {
    date: "May 2026",
    title: "Church-parking-lot allegation",
    body:
      "Public reporting attributed to HCSO says Ryan displayed a firearm and placed his hand on the grip. Ryan disputes drawing, pointing, brandishing, threatening, or firing.",
  },
  {
    date: "May 18-19, 2026",
    title: "Church bodycam requests",
    body:
      "Site records say Cindy Black responded active-case / call-sheet-only on the church case, and Ryan sent a second written request with counsel copied in the private source chain.",
  },
  {
    date: "June 9, 2026",
    title: "Arraignment / immediate setting",
    body:
      "Google Drive attorney map lists arraignment and flags bond, recusal, discovery, Brady, and speech-condition issues.",
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
  ["James Chatham", "July 13, 2025 background file; Drive motions say Ryan alleges Chatham grabbed a firearm and Ryan called law enforcement."],
  ["Judge / Judicial Officer Joe Black", "Drive attorney map flags a June 9 court-portal assignment and story-view / reaction screenshots; assignment and screenshots need verification before any recusal/disclosure use."],
  ["Bonnie Nichols", "Family-court / testimony / background context. Criminal-defense record only with a direct evidentiary tie."],
  ["Bo Rogers", "Former attorney / background context; relevant only if broader litigation context becomes part of the record."],
  ["Kelly Hydekamp / Scott Carlisle", "Family-court attorney context; not a substitute for proof in the criminal case."],
  ["Alex Harkrider", "Drive attorney map describes a separate harassment/theft context involving a rescue boat and belongings after a mental-health crisis; requires verification before placement in the record."],
  ["Nathaniel Moran", "Political/congress context mentioned by Ryan; needs a specific fact before use."],
  ["Ryan Baker", "Only found locally as a background potential-misconduct name; criminal-defense relevance requires a direct source tie."],
  ["Craig Evers / Oak Grove Baptist Church", "Search found a corrected RepWatchr note separating Kevin Evers from Bro. Craig Evers. Church/community context only with a direct record tie."],
];

const evidenceLanes = [
  {
    title: "Church incident source records",
    items: [
      "Bond paperwork, bond-condition text, and any revocation order or hearing transcript",
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
    title: "Recusal / court-control file",
    items: [
      "Court portal entry showing Judicial Officer Black, Joe and June 9 setting",
      "Story-view / reaction screenshots involving Joe Black",
      "Any prior personal-contact history Ryan says may affect impartiality",
      "Filed or draft recusal motion and visual exhibit packet from the Costello/harassment Drive folder",
      "Status marker: recusal motion, disclosure request, or hold",
    ],
  },
  {
    title: "July 13 / James Chatham background file",
    items: [
      "July 13, 2025 Part 1 and Part 2 videos in Google Drive",
      "Lt. Ron England bodycam and police report",
      "Cindy Black bodycam correspondence and fee/processing screenshots",
      "Bonnie Nichols Williams TRO transcript or recording",
      "Any 192-page exhibit or public exhibit page available for verification",
      "Rebuttal value only with a record tie to the current charges",
    ],
  },
  {
    title: "Background context in the record",
    items: [
      "Nichols v. Nichols master briefing",
      "Williams TRO false-testimony motion draft",
      "AT&T phone-line contempt transcript and date correction",
      "Wholesale Universe / Robinhood / DocuSign context only if it explains motive, pressure, or credibility",
      "Divorce/business damages: company valuation, alleged missing funds, unauthorized debt, phone/account lockout, litigation cost, and lost access to work",
      "January 6 damages: $35M starting claim and $45-$50M supported range from the public damages page, source exhibits still required",
      "Prior J6/pardon/public figure context only if the State or media uses it",
      "Proof of public threats against Ryan after the church-gun story spread",
      "Harkrider separate file only if the State opens the door to Ryan's prior J6/community context",
      "Ryan Baker, Jeremy Oni/Oney, Craig Evers, and Oak Grove references need direct-source matching before use",
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
  {
    label: "J6 damages page",
    href: "/case/damages",
    note: "Existing public damages summary: $35M starting claim and $45-$50M supported range.",
  },
];

const sourceFiles = [
  {
    label: "Google Drive attorney map",
    path: "Kacie Jon Costello & Harassment Harrison County/Motions/Case_Map_for_Attorney_DRAFT.md",
    note:
      "Source for June 9 arraignment lead, possible 2026-0226 case number, bond revocation lead, recusal lane, and Art. 39.14 / Brady priority.",
  },
  {
    label: "Master exhibit index article",
    path: "website/content/articles/2026-06-01_master-exhibit-index.md",
    note:
      "Source for exhibit numbering, Costello video receipt, Treece thread, July 13 separation note, and church bodycam request chain.",
  },
  {
    label: "July 13 motion draft",
    path: "Real Ryan Nichols LLC/MOTION_03_JULY13_INCIDENT.md",
    note:
      "Source for July 13 / James Chatham background allegations, Lt. Ron England, Cindy Black, and Williams TRO false-testimony issue.",
  },
  {
    label: "Master case briefing",
    path: "Real Ryan Nichols LLC/MASTER_CASE_BRIEFING.md",
    note:
      "Source for divorce/business background, Ryan Baker background mention, and broader names in local case materials.",
  },
  {
    label: "J6 damages page",
    path: "website/app/case/damages/page.tsx",
    note:
      "Source for public J6 damages framing, $35M starting claim, $45-$50M supported range, and Wholesale Universe enterprise-value language.",
  },
  {
    label: "ChatGPT prompt package",
    path: "Real Ryan Nichols LLC/CHATGPT_PROMPT_PACKAGE.md",
    note:
      "Source for AT&T damages, unauthorized debt range, Wholesale Universe bank-account bridge, and motion-plan dollar figures.",
  },
];

const questionsForRyan = [
  "Has any attorney formally appeared for Ryan in the criminal case, divorce/business matter, J6 compensation/damages matter, or related civil matters?",
  "Is bond currently revoked, modified, or only threatened? Exact written order and bond condition.",
  "Is the June 9, 2026 setting confirmed as arraignment, and is Case No. 2026-0226 correct?",
  "What are the exact cause numbers / complaint numbers for the two harassment charges and deadly conduct charge?",
  "Who are the named complainants on each harassment count?",
  "What exact statements, posts, or messages did law enforcement say make up each harassment charge?",
  "Were you questioned in jail or in custody about any video or separate allegation without Miranda warnings?",
  "Do you have the bond paperwork, magistrate warnings, probable-cause affidavit, or booking sheet?",
  "Which raw videos/screenshots are native files versus edited public receipts?",
  "Who can authenticate the Messenger thread, public comments, church video, and records requests?",
  "What is the best current evidence for Wholesale Universe's value: tax returns, bank statements, inventory records, Amazon/FBA records, ledgers, loan files, or CPA records?",
  "What exact damages are already supported by documents versus only estimated: J6 claim, missing WU funds, unauthorized debt, phone harm, Robinhood, and lost income?",
  "What direct record ties Jeremy Oni/Oney, Ryan Baker, Craig Evers, or Oak Grove Baptist Church to the current charges, if any?",
  "What has to stay private because it includes minors, addresses, phone numbers, medical/cannabis-card data, or family-court sensitive material?",
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
      <section className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
        <div className="grid gap-4 lg:grid-cols-[0.35fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Record first
            </p>
            <h1 className="mt-1 font-sans text-2xl font-black sm:text-3xl">
              What needs to be seen first.
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
              The first screen is the records, risks, and verification lanes.
              The meeting details and broader background sit underneath this
              packet.
            </p>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {urgentAsks.map((ask, index) => (
              <li
                key={ask}
                className="rounded-sm border border-[var(--color-accent)]/30 bg-white/40 p-3 text-sm font-semibold leading-6"
              >
                <span className="mr-2 font-black text-[var(--color-accent)]">
                  {index + 1}.
                </span>
                {ask}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Attorney case dashboard
          </p>
          <h2 className="mt-2 max-w-4xl text-3xl font-black leading-[0.98] sm:text-5xl">
            Three charges. One source-record fight.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-ink-soft)]">
            Built for the Dallas criminal-defense meeting. The goal is simple:
            put the clean record in one place, isolate the missing proof, and
            keep the public narrative separate from authenticated evidence.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Charges" value="3" sub="2 harassment / 1 deadly conduct" />
            <Metric label="Meeting" value="11:30" sub="Friday, June 5" />
            <Metric label="Representation" value="None" sub="Ryan reports no counsel" hot />
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

      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {immediateEmergency.map((item) => (
          <section
            key={item.label}
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {item.label}
            </p>
            <h2 className="mt-2 font-sans text-2xl font-black">
              {item.value}
            </h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
              {item.note}
            </p>
          </section>
        ))}
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-3">
        {chargeCards.map((card) => (
          <ChargeCard key={card.title} {...card} />
        ))}
      </section>

      <section className="mt-5 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
        <div className="grid gap-4 lg:grid-cols-[0.38fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Representation status
            </p>
            <h2 className="mt-1 font-sans text-2xl font-black">
              Ryan is not represented by anyone.
            </h2>
          </div>
          <div className="rounded-sm border border-[var(--color-accent)]/40 bg-white/45 p-4">
            <p className="text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
              As reported for this brief, Ryan is operating without counsel.
              Appearance status matters in the criminal case,
              divorce/business case, J6 compensation lane, and related civil
              matters. Until the docket shows a lawyer of record, every urgent
              deadline, discovery demand, bond issue, and recusal issue remains
              visible on this page.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Working defense theory
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black">
            Pull every claim back to source.
          </h2>
          <ul className="mt-4 space-y-2">
            {caseTheory.map((item) => (
              <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-support)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Chronology
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black">
            What touches what
          </h2>
          <div className="mt-4 grid gap-2">
            {chronology.map((event) => (
              <div
                key={`${event.date}-${event.title}`}
                className="grid gap-2 rounded-sm border border-[var(--color-line)] bg-[var(--color-paper)] p-3 sm:grid-cols-[9rem_1fr]"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {event.date}
                </p>
                <div>
                  <h3 className="font-sans text-base font-black">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                    {event.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-5 rounded-md border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
          Damages / money map
        </p>
        <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
          What this has cost Ryan
        </h2>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[#cfd9ea]">
          These are claimed or estimated lanes pulled from the existing site
          damages page and Google Drive case materials. The packet separates
          documented amounts from estimates and keeps each lane visible:
          criminal defense, divorce/business case, civil damages claim, and
          compensation package.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {financialImpact.map((item) => (
            <section
              key={item.label}
              className="rounded-md border border-white/10 bg-white/5 p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                {item.label}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="font-sans text-3xl font-black text-[#fdf8ea]">
                  {item.value}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
                  {item.sub}
                </p>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#cfd9ea]">
                {item.body}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-md border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
            Source chain
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
            What needs to be seen plainly
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
                  Why it matters: {item.use}
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
            Names in the record
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

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {divorceBusinessLanes.map((lane) => (
          <section
            key={lane.title}
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
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

      <section className="mt-5 grid gap-4 lg:grid-cols-1">
        {j6DamageLanes.map((lane) => (
          <section
            key={lane.title}
            className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4"
          >
            <h2 className="font-sans text-xl font-black">{lane.title}</h2>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {lane.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
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
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Local source files checked
        </p>
        <h2 className="mt-2 font-sans text-2xl font-black">
          Local files behind this brief
        </h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {sourceFiles.map((file) => (
            <div
              key={file.path}
              className="rounded-sm border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
            >
              <p className="text-sm font-black">{file.label}</p>
              <p className="mt-1 break-words font-mono text-[11px] font-semibold text-[var(--color-muted)]">
                {file.path}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                {file.note}
              </p>
            </div>
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
