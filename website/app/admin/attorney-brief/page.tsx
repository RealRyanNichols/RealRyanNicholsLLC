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

const firstOpenPackets = [
  {
    step: "1",
    title: "Charging packets",
    body:
      "Exact complaints, probable-cause affidavits, cause numbers, named complainants, dates, and statutory subsections.",
    href: "#charges",
    tone: "red",
  },
  {
    step: "2",
    title: "Bond / speech order",
    body:
      "Any written bond condition, revocation or modification order, hearing transcript, and prohibited-contact language.",
    href: "#open-questions",
    tone: "gold",
  },
  {
    step: "3",
    title: "Bodycam and source files",
    body:
      "Bodycam, dashcam, CAD, dispatch audio, offense reports, witness statements, church video, and native message exports.",
    href: "#source-doors",
    tone: "green",
  },
  {
    step: "4",
    title: "Proof map",
    body:
      "A clean claim-to-source trail that separates public reporting, Ryan statements, authenticated evidence, and missing records.",
    href: "#packet-drawers",
    tone: "blue",
  },
];

const firstReadFlow = [
  {
    label: "Start",
    title: "3 charges",
    body: "Two harassment counts and one deadly-conduct charge. Keep the criminal packet first.",
  },
  {
    label: "Dispute",
    title: "1 story to test",
    body: "Displayed / hand on grip is not the same story as pulled, pointed, brandished, fired, or threatened.",
  },
  {
    label: "Control",
    title: "Proof decides",
    body: "Charging packets, discovery, video, CAD, dispatch, native messages, and witness statements control the read.",
  },
];

const drawerMap = [
  {
    href: "#charges",
    label: "Criminal",
    title: "Three charges",
    body: "The urgent defense lane stays first and clean.",
  },
  {
    href: "#receipts",
    label: "Receipts",
    title: "Proof legend",
    body: "Public record, Ryan statement, claimed number, or missing file.",
  },
  {
    href: "#drive-evidence",
    label: "Drive",
    title: "Source folders",
    body: "Four folder doors without exposing private material on the page.",
  },
  {
    href: "#claim-map",
    label: "Law",
    title: "Claim map",
    body: "Claim, evidence lane, authority lane, and status.",
  },
  {
    href: "#full-record",
    label: "Archive",
    title: "Full record",
    body: "Money, people, chronology, pressure, and background.",
  },
  {
    href: "#open-questions",
    label: "Open",
    title: "Still needed",
    body: "A short list of records that would make the packet stronger.",
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
    step: "Church-parking-lot source dispute",
    title: "Peaceful-contact version versus fear-based version",
    body:
      "Ryan states he came peacefully to talk, that the other side became aggressive, and that later text/video/comment receipts may show changed or softened versions of the story. Those records need native files, timestamps, and witness authentication.",
    use: "This keeps the issue on proof: what was said first, what changed later, and what the video/audio actually shows.",
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
  {
    step: "Local pressure lane",
    title: "Politics, counsel history, and public-record pressure",
    body:
      "Ryan reports that local political activity, running for Congress, speaking against officials, and public reporting pressure overlapped with attorney withdrawal, police inaction on reports, and public escalation. This lane needs receipts before counsel uses it.",
    use: "It explains why the defense packet cannot look at the misdemeanor charges in isolation.",
  },
];

const caseTheory = [
  "The official baseline allegation matters: display / hand-on-grip is not the same as pulled, pointed, fired, or threatened with a gun.",
  "Every witness version needs to trace back to native source files, not screenshots, headlines, or summaries.",
  "The Costello public video/comment lane matters because it may show how the public story escalated after the alleged church incident.",
  "The Treece thread matters only if the harassment charges rely on speech, threats, contact history, or unequal enforcement around online statements.",
  "The July 13 / James Chatham file is background-pattern evidence, not the church charge itself, unless the State uses old gun allegations or character framing.",
  "Source-first packet: charging packets, bodycam, dispatch, CAD, original witness statements, native videos, complete message exports.",
  "Criminal, civil, J6, business, and political-pressure issues are separate lanes, but they are running at the same time and should be visible in one dashboard.",
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
    value: "$44K-49K+",
    sub: "claimed debt exposure",
    body:
      "Prompt package lists a box-truck debt around $22K-27K plus Landstar shipping demand of $22,226.61 after POA-revocation issues. Ryan also reports broader loan/debt exposure in his name after asking for money in September 2025. Creditor records, Chase records, loan files, and DocuSign audit trails are the verification lane.",
  },
  {
    label: "Phone/AT&T harm",
    value: "$1,663.90+",
    sub: "documented lane",
    body:
      "AT&T materials list $950 accelerated device balance plus $713.90 account balance, with additional new-service and access damages to verify.",
  },
];

const simultaneousLanes = [
  {
    label: "Criminal",
    title: "Immediate defense lane",
    priority: "Pressing now",
    body:
      "Two harassment counts and one deadly-conduct misdemeanor. This lane needs charging instruments, exact complainants, bond paperwork, discovery, bodycam, CAD, dispatch, witness statements, and native message/video files.",
    proof:
      "The cleanest criminal packet is allegation wording, statute, source file, missing item, and defense response in one row.",
  },
  {
    label: "Civil",
    title: "Divorce and business-control lane",
    priority: "Leverage / damages",
    body:
      "Ryan reports Wholesale Universe, divorce, alleged missing money, alleged unauthorized loans/debt, and transfer/control issues are still active pressure points.",
    proof:
      "Bank records, Chase payout stubs, corporate records, tax returns, payroll/1099 summaries, loan files, DocuSign logs, court filings, and police-report follow-ups.",
  },
  {
    label: "J6",
    title: "Federal damages and due-process lane",
    priority: "Value story",
    body:
      "Ryan's public record includes J6 detention, pardon/dismissal context, claimed due-process violations, business destruction, homelessness, family damage, and a damages lane already framed on the site.",
    proof:
      "Federal case record, pardon/dismissal documents, damages page, habeas filings, confinement records, business records, medical records, and source exhibits.",
  },
  {
    label: "Public pressure",
    title: "Politics, reporting, and local-government context",
    priority: "Motive / credibility context",
    body:
      "Ryan reports he ran for Congress, spoke against local officials, was removed from a political event despite having a ticket, and plans to run locally for transparency. Use only with receipts.",
    proof:
      "Event video, ticket/entry records, social posts, attorney-withdrawal timing, witness statement from Don Nichols, and any public official communications.",
  },
];

const attorneyValueStory = [
  {
    label: "Who Ryan is",
    title: "Marine veteran, search-and-rescue background, business builder",
    body:
      "Ryan wants counsel to see the full person: Marine veteran, search-and-rescue specialist, founder/operator, public-record organizer, father, and independent investigative journalist.",
    proof:
      "Service/background records, Ellen DeGeneres appearance materials if relevant, business records, public site archive, and family context.",
  },
  {
    label: "Why this case can matter",
    title: "The defense is bigger than three misdemeanor labels",
    body:
      "Ryan's position is that the misdemeanor charges sit inside a broader pressure pattern involving local politics, public speech, prior J6 public status, and ignored reports. Counsel should see it, but source files control it.",
    proof:
      "Timeline, public reports, police follow-ups, video receipts, attorney-withdrawal timing, court filings, and native source files.",
  },
  {
    label: "What Ryan can bring",
    title: "A source-backed story, public attention, and a prepared record",
    body:
      "Ryan is asking for help from counsel that can handle a high-attention case without losing the disciplined proof path. The pitch is not noise. It is a prepared record with receipts.",
    proof:
      "Public website, case dashboard, Google Drive evidence folders, damages map, and a source-chain packet counsel can audit.",
  },
  {
    label: "Representation ask",
    title: "Help him defend the charges and preserve the larger record",
    body:
      "Ryan reports limited cash but meaningful civil/business/J6 value lanes. Any agreement should be reviewed by counsel and documented carefully; this page only shows the record and value lanes.",
    proof:
      "Fee agreement, contingency/fee review where lawful, asset/damages packet, company valuation, and current financial records.",
  },
];

const politicalContextLanes = [
  {
    title: "Bo Rogers / counsel-withdrawal context",
    body:
      "Ryan states Bo Rogers told him he was friends with Congressman Nathaniel Moran during the first meeting, with Don Nichols present as a witness. Ryan says he paid Rogers the last $10,000 he had from Wholesale Universe, marked for attorney fees, and later fought for a continuance after Rogers withdrew.",
    needs:
      "Don Nichols statement, Chase payout stub, bank record, fee agreement, withdrawal filing, hearing transcript, Ryan's motions/exhibits, and the order granting continuance.",
  },
  {
    title: "Due-process record in East Texas",
    body:
      "Ryan states Judge Moran made Bo Rogers acknowledge a due-process violation on the record before granting Ryan a continuance. This is powerful only if the transcript/audio/order is attached.",
    needs:
      "Hearing transcript or audio, order, docket entry, motion packet, proposed order, and exhibit list.",
  },
  {
    title: "Political-event removal",
    body:
      "Ryan reports he was removed from a Governor Abbott event at Leon's Steakhouse despite having tickets, after speaking out against Rep. Jay Dean, and that videos went viral shortly before attorney withdrawal communications.",
    needs:
      "Ticket proof, event video, social links, timestamps, removal witness names, attorney call records, and withdrawal timing.",
  },
  {
    title: "Ryan Baker / material-witness lane",
    body:
      "Ryan states he helped report matters involving federal game warden Ryan Baker with victims, was later kept away from the case, and believes he is a material witness. This stays a verification lane until the indictment/case record and witness communications are attached.",
    needs:
      "Indictment/case number, agency records, report receipts, victim statements, prosecutor/witness contact history, and public-source links.",
  },
  {
    title: "Longview police / divorce-business reports",
    body:
      "Ryan reports he reported alleged Wholesale Universe/divorce-related fraud to Longview Police Department and followed up multiple times without action.",
    needs:
      "Police report numbers, officer names, follow-up emails/calls, evidence packets submitted, bank/loan records, and court filings.",
  },
  {
    title: "Planned local run / public-interest reporting",
    body:
      "Ryan states he plans to run locally on truth, transparency, and giving East Texas residents a voice. The legal packet should separate political speech and public reporting from case-specific witness/contact restrictions.",
    needs:
      "Campaign timeline, public announcement draft, prior congressional campaign records, social posts, and bond-condition language.",
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
  ["Don Nichols", "Ryan's father; Ryan identifies him as a witness to the first Bo Rogers meeting and related attorney-history context."],
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
  ["Bo Rogers", "Former attorney / background context; Ryan reports Moran-friend statement, $10,000 attorney-fee payment, withdrawal timing, and a due-process hearing issue. Needs transcript, fee records, and bank records."],
  ["Kelly Hydekamp / Scott Carlisle", "Family-court attorney context; not a substitute for proof in the criminal case."],
  ["Alex Harkrider", "Drive attorney map describes a separate harassment/theft context involving a rescue boat and belongings after a mental-health crisis; requires verification before placement in the record."],
  ["Nathaniel Moran", "Political/congress context mentioned by Ryan and tied to Ryan's stated Bo Rogers first-meeting account; needs a direct, admissible fact before use."],
  ["Ryan Baker", "Ryan reports he helped report Baker-related misconduct with victims and believes he is a material witness. Requires indictment/case record and witness-contact proof before use."],
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

const driveEvidenceFolders = [
  {
    label: "DA / WU forensic packet",
    href: "https://drive.google.com/drive/folders/13bUr-S9RN7_IoBiPdcKESdtg_4EUG98U?usp=sharing",
    status: "money + source records",
    body:
      "Contains the July 13 / James Chatham lane, WU payroll and 1099 findings, DA packages, subpoena/witness/hearing matrices, RICO-Track, motions, and evidence folders.",
  },
  {
    label: "Real Ryan evidence workspace",
    href: "https://drive.google.com/drive/folders/1stzZrhqFtkmEeQ3PiGatgL4bF3KhjYE4?usp=sharing",
    status: "divorce / business / tips",
    body:
      "Contains pictures, videos, death-threat receipts, BJ Fletcher, Alex Harkrider, Messenger tips, MASTER_CASE_BRIEFING, and motion drafts covering phone, business, Robinhood, receiver, and Bo Rogers issues.",
  },
  {
    label: "Costello / harassment file",
    href: "https://drive.google.com/drive/folders/1hzEz8vOISWNrVbhV9ua6SptaU8we9XCp?usp=drive_link",
    status: "criminal-defense source chain",
    body:
      "Contains Joe and Cindy Black materials, motions, images, and videos tied to the Kacie/Jon Costello, harassment, church, and source-record lane.",
  },
  {
    label: "J6 dismissal / damages record",
    href: "https://drive.google.com/drive/folders/1xCQRGp46Ppmje2Vd9po-4UXnNPilIQpV?usp=drive_link",
    status: "federal-case damages lane",
    body:
      "Contains J6 folder materials, dismissal-as-moot PDF, and statement-of-reasons PDF. This is the source lane for J6 dismissal, pardon, and damages context.",
  },
];

const forensicMoneyRecords = [
  {
    label: "2023 1099 summary",
    value: "$411,501.15",
    proof:
      "WU_Payroll_1099_Findings says this QuickBooks summary covers eight vendors. It flags Prosperity Operations LLC at $282,161 and Quantum Leadership LLC at $32,020.",
  },
  {
    label: "Quantum-affiliated subtotal",
    value: "$314,181.00",
    proof:
      "Drive forensic summary says Prosperity and Quantum share a Noblesville address and should be treated as a related-party audit lane until original records verify the relationship.",
  },
  {
    label: "Family-orbit 1099 subtotal",
    value: "$404,281.00",
    proof:
      "Drive forensic summary labels this as a Bonnie/family-orbit subtotal. Use as an audit flag, not a final legal conclusion, until bank statements and ledgers are attached.",
  },
  {
    label: "Q3 2024 payroll report",
    value: "$231,265.13",
    proof:
      "TWC source summary lists 39 employees and says Kyle Pope, CPA filed it on Oct. 22, 2024, confirmation #36262165.",
  },
  {
    label: "Aug-Nov payroll cost",
    value: "$322,910.30",
    proof:
      "Drive payroll summary says this was total payroll cost over about three months, with $299,458.79 gross wages and roughly $1.29M annualized pace.",
  },
  {
    label: "Missing Chase page",
    value: "$10,300 lead",
    proof:
      "Drive summary says the Jan. 2025 Chase 5952 file name references $10,300, but only page 7 was visible. Full 26-page statement is needed before using the number.",
  },
];

const matterSplit = [
  {
    label: "Criminal",
    title: "Current misdemeanor defense lane",
    status: "Immediate Dallas meeting priority",
    tone: "red",
    items: [
      "Two harassment counts and one deadly-conduct charge.",
      "Needs charging packets, probable-cause affidavits, bond paperwork, discovery, bodycam, CAD, dispatch, witness statements, and native message/video files.",
      "This is the lane counsel should be able to scan first for court dates, cause numbers, exact complainants, statutory elements, and missing production.",
    ],
  },
  {
    label: "Civil",
    title: "Divorce, Wholesale Universe, and J6 damages lane",
    status: "Value / damages / background",
    tone: "gold",
    items: [
      "Divorce and business records: Wholesale Universe value, alleged missing funds, payroll/1099 summaries, bank records, ledgers, debts, AT&T/phone harm, Robinhood, and litigation pressure.",
      "J6 damages/history: federal case, pardon/dismissal lane, business destruction, family harm, liberty lost, medical/mental-health harm, and public damages page.",
      "This should support value, motive, damages, and background without cluttering the misdemeanor defense record unless it directly touches the criminal issues.",
    ],
  },
];

const claimSupportMatrix = [
  {
    claim: "The deadly-conduct allegation must be tested against the exact statutory elements, not against public retellings.",
    evidence:
      "Charging instrument, probable-cause affidavit, bodycam, dashcam, CAD, dispatch audio, witness statements, and church video.",
    law: "Texas Penal Code Sec. 22.05; counsel should match each alleged act to recklessness, imminent danger, firearm-pointing, and any statutory presumption actually charged.",
    status: "Packet needed",
    href: "#charges",
    tone: "red",
  },
  {
    claim: "The harassment counts need native message records, exact complainants, exact dates, and exact statutory subsection before anyone can judge them.",
    evidence:
      "Complete platform exports, screenshots police relied on, Ryan's May 12 report/call record, and full thread context.",
    law: "Texas Penal Code Sec. 42.07; counsel should review the charged subsection, intent element, repeated electronic-communication theory, and any public-concern or threat framing.",
    status: "Packet needed",
    href: "#charges",
    tone: "red",
  },
  {
    claim: "Discovery is the control point because public-records responses are not a substitute for criminal discovery.",
    evidence:
      "Open-records correspondence, call-sheet-only response, second written request, missing bodycam/source files, and counsel-copied request chain.",
    law: "Texas Code of Criminal Procedure Art. 39.14 and Brady v. Maryland; counsel can separate statutory production, constitutional disclosure, and preservation issues.",
    status: "Source lane",
    href: "#receipts",
    tone: "green",
  },
  {
    claim: "Any bond/speech restriction needs the written order, exact condition language, and the act allegedly violating it.",
    evidence:
      "Bond paperwork, magistrate warnings, revocation/modification order, hearing transcript, screenshots/posts, and prohibited-contact proof if alleged.",
    law: "Texas Code of Criminal Procedure Art. 17.40 plus First Amendment/true-threat review where speech is the alleged violation.",
    status: "Order needed",
    href: "#urgent-records",
    tone: "gold",
  },
  {
    claim: "If the case turns on social-media threats, the record must distinguish protected speech, public concern, harassment conduct, and true threats.",
    evidence:
      "Native posts/messages, full thread context, recipient identity, dates, prior contact history, report history, and any law-enforcement interpretation.",
    law: "Counterman v. Colorado for true-threat mens rea; Ex parte Barton / Sanders / Scott line for Texas electronic-harassment review. Counsel should verify current Texas treatment.",
    status: "Research lane",
    href: "#legal-authority",
    tone: "gold",
  },
  {
    claim: "A recusal/disclosure issue only becomes useful if the assignment and relationship/screenshot evidence verify cleanly.",
    evidence:
      "Court portal entry, Judicial Officer Joe Black assignment, story-view/reaction screenshots, prior-contact facts, and any filed/draft recusal packet.",
    law: "Texas Rule of Civil Procedure 18b and related criminal-trial recusal procedure for counsel review.",
    status: "Verify first",
    href: "#full-record",
    tone: "gold",
  },
  {
    claim: "The damages numbers are attention-getting, but they only matter if each number is tied to a source packet.",
    evidence:
      "J6 damages page, J6 Drive folder, WU ledgers, payroll/1099 summaries, TWC records, bank statements, tax returns, debt letters, and audit trails.",
    law: "Civil damages, business valuation, community-property, and restitution/compensation theories belong in counsel's damages lane after source review.",
    status: "Evidence controls",
    href: "#full-record",
    tone: "green",
  },
];

const legalAuthorityLinks = [
  {
    label: "Tex. Penal Code 22.05",
    href: "https://statutes.capitol.texas.gov/Docs/PE/htm/PE.22.htm#22.05",
    note: "Deadly conduct statute. Match the exact charged theory to the exact record.",
  },
  {
    label: "Tex. Penal Code 42.07",
    href: "https://statutes.capitol.texas.gov/Docs/PE/htm/PE.42.htm#42.07",
    note: "Harassment statute. Charged subsection and full message context matter.",
  },
  {
    label: "Tex. Code Crim. Proc. 39.14",
    href: "https://statutes.capitol.texas.gov/Docs/CR/htm/CR.39.htm#39.14",
    note: "Texas criminal discovery / Michael Morton Act lane.",
  },
  {
    label: "Tex. Code Crim. Proc. 17.40",
    href: "https://statutes.capitol.texas.gov/Docs/CR/htm/CR.17.htm#17.40",
    note: "Bond conditions related to victim or community safety.",
  },
  {
    label: "Brady v. Maryland",
    href: "https://www.loc.gov/item/usrep373083/",
    note: "Due-process disclosure lane for favorable material evidence.",
  },
  {
    label: "Counterman v. Colorado",
    href: "https://www.law.cornell.edu/supremecourt/text/22-138",
    note: "True-threat mens rea lane when speech is charged or punished.",
  },
  {
    label: "Ex parte Barton",
    href: "https://caselaw.findlaw.com/court/tx-court-of-criminal-appeals/1924884.html",
    note: "Texas electronic-harassment First Amendment research lane.",
  },
  {
    label: "Texas Rule 18b",
    href: "https://www.txcourts.gov/media/1446498/trcp-all-updated-with-amendments-effective-may-1-2020.pdf",
    note: "Recusal/disqualification grounds for counsel review.",
  },
];

const proofLegend = [
  {
    label: "Public record / public report",
    body:
      "Linked article, public page, or public report visible from the brief.",
  },
  {
    label: "Ryan statement",
    body:
      "Ryan's position preserved beside the source files that can prove or disprove it.",
  },
  {
    label: "Claimed / estimated damages",
    body:
      "Dollar lane exists, but source exhibits still control what can be relied on.",
  },
  {
    label: "Missing record",
    body:
      "Charging packet, bodycam, bond order, docket entry, or native source file still needs to be attached.",
  },
];

const valueHighlights = [
  {
    label: "J6 damages lane",
    value: "$35M+",
    status: "claimed / source packet needed",
  },
  {
    label: "Supported damages range",
    value: "$45-50M",
    status: "claimed on damages page",
  },
  {
    label: "Wholesale Universe",
    value: "multi-million",
    status: "valuation records needed",
  },
  {
    label: "Business / debt exposure",
    value: "$750K+",
    status: "audit lane",
  },
  {
    label: "2023 1099 summary",
    value: "$411K",
    status: "QuickBooks source lane",
  },
  {
    label: "Q3 payroll report",
    value: "$231K",
    status: "TWC source lane",
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
  {
    label: "WU payroll / 1099 findings",
    path: "Google Drive/WU_Payroll_1099_Findings_2026-04-27.md",
    note:
      "Source for 2022-2024 payroll and 1099 numbers, Prosperity/Quantum audit flags, TWC Q3 payroll record, and the missing full Chase-statement page.",
  },
  {
    label: "Business changes motion",
    path: "Google Drive/MOTION_02_BUSINESS_CHANGES.md",
    note:
      "Source for Wholesale Universe Inc. / LLC change allegations, $750K-$1.5M missing-funds claim, 2023 bank-statement issue, Rick McMinn, Kyle Pope, Troy Marchand, and general-ledger exhibits.",
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
    <article className="mx-auto w-full max-w-[60rem] px-4 py-5 sm:px-5 lg:px-6">
      <nav
        aria-label="Attorney brief shortcuts"
        className="sticky top-0 z-20 mb-4 flex flex-wrap items-center justify-between gap-2 border border-[var(--color-line)] bg-[var(--color-paper)]/95 p-2 shadow-sm backdrop-blur"
      >
        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-xs font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Back
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href="#first-look"
            className="inline-flex min-h-10 items-center border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 text-xs font-black uppercase tracking-normal text-[var(--color-accent)]"
          >
            Top
          </a>
          <a
            href="#source-doors"
            className="inline-flex min-h-10 items-center border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-xs font-black uppercase tracking-normal text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Open first
          </a>
          <a
            href="#packet-drawers"
            className="inline-flex min-h-10 items-center border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-xs font-black uppercase tracking-normal text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Deep file
          </a>
        </div>
      </nav>

      <section
        id="first-look"
        className="border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] shadow-sm sm:p-5 lg:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7fe3a9]">
              Attorney cover sheet
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black leading-[0.98] text-[#fdf8ea] sm:text-5xl lg:text-6xl">
              Three charges. One disputed story. Four records to open first.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#cfd9ea]">
              This brief should not feel like a database on first contact.
              Counsel gets the clean path first: the live criminal matter, the
              disputed fact, the missing record packet, and the source doors.
              The larger archive stays filed below until someone needs it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="#source-doors"
                className="inline-flex min-h-11 items-center border border-[#7fe3a9]/60 bg-[#7fe3a9]/15 px-4 text-sm font-black text-[#7fe3a9] transition hover:bg-[#7fe3a9]/25"
              >
                Open the first four records
              </a>
              <a
                href="#packet-drawers"
                className="inline-flex min-h-11 items-center border border-white/15 bg-white/[0.055] px-4 text-sm font-black text-[#fdf8ea] transition hover:bg-white/10"
              >
                Show the deeper file
              </a>
            </div>
          </div>
          <aside className="border border-white/10 bg-white/[0.055] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
              Dallas meeting
            </p>
            <h2 className="mt-2 font-sans text-xl font-black text-[#fdf8ea]">
              Dallas criminal-defense meeting
            </h2>
            <dl className="mt-3 grid gap-3">
              <InfoRow label="When" value={meeting.when} dark />
              <InfoRow label="Where" value={meeting.where} dark />
            </dl>
            <a
              href={meeting.website}
              className="mt-4 inline-flex min-h-10 items-center border border-[#7fe3a9]/50 bg-[#7fe3a9]/15 px-3 text-sm font-black text-[#7fe3a9] transition hover:bg-[#7fe3a9]/25"
            >
              Open firm site
            </a>
          </aside>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Charges"
            value="3"
            sub="2 harassment / 1 deadly conduct"
            hot
          />
          <Metric
            label="Representation"
            value="None"
            sub="Ryan reports no counsel"
            hot
          />
          <Metric
            label="Disputed fact"
            value="Gun"
            sub="displayed vs pulled / pointed / fired"
          />
          <Metric
            label="Proof status"
            value="Open"
            sub="charging packet and discovery needed"
          />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {firstReadFlow.map((item, index) => (
            <section
              key={item.title}
              className="border border-white/10 bg-white/[0.055] p-4"
            >
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                <span className="inline-flex h-6 w-6 items-center justify-center border border-[#d8c89e]/40 text-xs">
                  {index + 1}
                </span>
                {item.label}
              </p>
              <h2 className="mt-3 font-sans text-xl font-black leading-tight text-[#fdf8ea]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
                {item.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-5 border border-[#e02a1d]/50 bg-[#e02a1d]/15 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb0a8]">
            Core disputed fact
          </p>
          <h2 className="mt-2 font-sans text-xl font-black leading-tight text-[#fdf8ea] sm:text-2xl">
            Public allegation says displayed / hand on grip. Ryan disputes
            pulling, pointing, brandishing, firing, or threatening.
          </h2>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-[#ffd2cc]">
            The page should keep repeating that simple distinction. Everything
            else supports, tests, or explains that record.
          </p>
        </div>
      </section>

      <section
        id="source-doors"
        className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 lg:grid-cols-[0.36fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Open first
            </p>
            <h2 className="mt-1 font-sans text-2xl font-black leading-tight sm:text-3xl">
              Four proof doors. Open these first.
            </h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
            A first-time reader does not need the whole warehouse. They need the
            front doors that prove the warehouse is organized and source-led.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {firstOpenPackets.map((packet) => (
            <FirstOpenCard key={packet.title} {...packet} />
          ))}
        </div>
      </section>

      <section
        id="packet-drawers"
        className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 lg:grid-cols-[0.36fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Filed drawers
            </p>
            <h2 className="mt-1 font-sans text-2xl font-black leading-tight sm:text-3xl">
              The depth is visible without being loud.
            </h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
            This is the we-have-it signal. The attorney can choose a lane
            without scrolling through every fact, name, number, and source on
            the first pass.
          </p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {drawerMap.map((drawer) => (
            <PacketJump key={drawer.href} {...drawer} />
          ))}
        </div>
      </section>

      <section id="charges" className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[0.34fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Criminal lane first
            </p>
            <h2 className="mt-1 font-sans text-3xl font-black leading-tight">
              The case is simpler when the charges stay clean.
            </h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
            Everything else supports context, value, or pressure. The first job
            is still the same: match each charge to the exact complaint,
            source file, statutory lane, and missing proof.
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {chargeCards.map((card) => (
            <ChargeCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <details id="receipts" className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal marker:content-['']">
          <span>Open source doors and proof legend</span>
          <span className="border border-[var(--color-line)] px-2 py-1 text-[10px] text-[var(--color-accent)]">
            Sources
          </span>
        </summary>
        <div className="grid gap-4 border-t border-[var(--color-line)] p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
            Open first
          </p>
          <h2 className="mt-1 font-sans text-2xl font-black text-[#fdf8ea]">
            Give counsel the door, not the warehouse.
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
            These links prove the record exists and let the attorney drill down
            without seeing every private detail on the page.
          </p>
          <div className="mt-4 grid gap-2">
            {sourceLinks.slice(0, 4).map((source) => (
              <a
                key={source.href}
                href={source.href}
                className="border border-white/10 bg-white/5 p-3 transition hover:border-[#7fe3a9]/50 hover:bg-[#7fe3a9]/10"
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

        <section className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            What the page is saying
          </p>
          <h2 className="mt-1 font-sans text-2xl font-black">
            You do not have to show everything to show you have everything.
          </h2>
          <div className="mt-4 grid gap-2">
            {proofLegend.map((item) => (
              <div
                key={item.label}
                className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {valueHighlights.slice(0, 4).map((item) => (
              <div key={item.label} className="border border-[var(--color-line)] bg-white/35 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {item.label}
                </p>
                <p className="mt-1 font-sans text-2xl font-black">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--color-accent)]">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </details>

      <details id="drive-evidence" className="mt-4 border border-[#203a64] bg-[#071126] text-[#fdf8ea] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal marker:content-[''] sm:p-5">
          <span>Open Google Drive source folders</span>
          <span className="border border-[#7fe3a9]/50 px-2 py-1 text-[10px] text-[#7fe3a9]">
            4 folders
          </span>
        </summary>
        <div className="border-t border-white/10 p-4 sm:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
              Source folders
            </p>
            <h2 className="mt-1 font-sans text-2xl font-black text-[#fdf8ea]">
              Four controlled entry points.
            </h2>
          </div>
          <p className="max-w-md text-xs font-semibold leading-5 text-[#cfd9ea]">
            Folder-level links keep the browser brief clean while showing the
            source lanes are already organized.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {driveEvidenceFolders.map((folder) => (
            <a
              key={folder.href}
              href={folder.href}
              className="border border-white/10 bg-white/5 p-3 transition hover:border-[#7fe3a9]/50 hover:bg-[#7fe3a9]/10"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-black text-[#fdf8ea]">
                  {folder.label}
                </span>
                <span className="bg-[#7fe3a9]/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#7fe3a9]">
                  Open
                </span>
              </div>
              <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#d8c89e]">
                {folder.status}
              </span>
            </a>
          ))}
        </div>
        </div>
      </details>

      <details id="claim-map" className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal text-[var(--color-ink)] marker:content-['']">
          <span>Open claim map and law shelf</span>
          <span className="border border-[var(--color-line)] px-2 py-1 text-[10px] text-[var(--color-accent)]">
            Detail
          </span>
        </summary>
        <div className="border-t border-[var(--color-line)] p-4 sm:p-5">
          <div id="matter-split" className="grid gap-3 md:grid-cols-2">
            {matterSplit.map((matter) => (
              <MatterSplitCard key={matter.label} {...matter} />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {simultaneousLanes.map((lane) => (
              <section key={lane.label} className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {lane.label}
                </p>
                <h3 className="mt-2 font-sans text-lg font-black leading-tight">
                  {lane.title}
                </h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                  {lane.body}
                </p>
              </section>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[62rem] border border-[var(--color-line)]">
              <div className="grid grid-cols-[1.1fr_1.2fr_1.15fr_8rem_5.5rem] border-b border-[var(--color-line)] bg-[var(--color-paper)] text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <div className="border-r border-[var(--color-line)] p-3">Claim</div>
                <div className="border-r border-[var(--color-line)] p-3">Evidence lane</div>
                <div className="border-r border-[var(--color-line)] p-3">Law / case-law lane</div>
                <div className="border-r border-[var(--color-line)] p-3">Status</div>
                <div className="p-3">Click</div>
              </div>
              {claimSupportMatrix.map((row) => (
                <ClaimSupportRow key={row.claim} {...row} />
              ))}
            </div>
          </div>
          <div id="legal-authority" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {legalAuthorityLinks.map((authority) => (
              <a
                key={authority.href}
                href={authority.href}
                className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition hover:border-[var(--color-accent)]"
              >
                <span className="block text-sm font-black">
                  {authority.label}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                  {authority.note}
                </span>
              </a>
            ))}
          </div>
        </div>
      </details>

      <details id="full-record" className="mt-4 border border-[#203a64] bg-[#071126] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal text-[#fdf8ea] marker:content-[''] sm:p-5">
          <span>Open full supporting archive</span>
          <span className="border border-[#7fe3a9]/50 px-2 py-1 text-[10px] text-[#7fe3a9]">
            Complete record
          </span>
        </summary>
        <div className="border-t border-white/10 bg-[var(--color-paper)] p-4 text-[var(--color-ink)] sm:p-5">
          <section className="border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[0.38fr_1fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
                  Why take Ryan
                </p>
                <h2 className="mt-1 font-sans text-2xl font-black text-[#fdf8ea] sm:text-3xl">
                  A high-attention case with a record that can be organized.
                </h2>
              </div>
              <p className="text-sm font-semibold leading-6 text-[#cfd9ea]">
                Not legal advice or a demand. This is the case value story:
                disciplined representation, a source-backed defense, and a
                lawyer who can keep the whole picture organized under pressure.
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {attorneyValueStory.map((item) => (
                <section key={item.title} className="border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8c89e]">
                    {item.label}
                  </p>
                  <h3 className="mt-2 font-sans text-lg font-black leading-tight text-[#fdf8ea]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
                    {item.body}
                  </p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs font-bold leading-5 text-[#7fe3a9]">
                    Proof path: {item.proof}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
            <section className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Working theory
              </p>
              <h2 className="mt-2 font-sans text-2xl font-black">
                Pull every claim back to source.
              </h2>
              <ul className="mt-4 space-y-2">
                {caseTheory.map((item) => (
                  <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                    <span className="mt-2 h-2 w-2 shrink-0 bg-[var(--color-support)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
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
                    className="grid gap-2 border border-[var(--color-line)] bg-[var(--color-paper)] p-3 sm:grid-cols-[9rem_1fr]"
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

          <section id="damages-map" className="mt-4 border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
              Damages / money map
            </p>
            <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
              What this has cost Ryan
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {financialImpact.map((item) => (
                <section key={item.label} className="border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                    {item.label}
                  </p>
                  <p className="mt-2 font-sans text-3xl font-black text-[#fdf8ea]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
                    {item.sub}
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#cfd9ea]">
                    {item.body}
                  </p>
                </section>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {forensicMoneyRecords.map((record) => (
                <section key={record.label} className="border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d8c89e]">
                    {record.label}
                  </p>
                  <p className="mt-1 font-sans text-2xl font-black text-[#fdf8ea]">
                    {record.value}
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#cfd9ea]">
                    {record.proof}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
                Source chain
              </p>
              <h2 className="mt-2 font-sans text-2xl font-black text-[#fdf8ea]">
                What needs to be seen plainly
              </h2>
              <div className="mt-4 grid gap-3">
                {sourceChain.map((item) => (
                  <div key={item.title} className="border border-white/10 bg-white/5 p-3">
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

            <div className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
                People map
              </p>
              <h2 className="mt-2 font-sans text-2xl font-black">
                Names in the record
              </h2>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {people.map(([name, role]) => (
                  <div key={name} className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                    <p className="text-sm font-black">{name}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                      {role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            {evidenceLanes.map((lane) => (
              <section key={lane.title} className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <h2 className="font-sans text-xl font-black">{lane.title}</h2>
                <ul className="mt-3 space-y-2">
                  {lane.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                      <span className="mt-2 h-2 w-2 shrink-0 bg-[var(--color-support)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            {divorceBusinessLanes.map((lane) => (
              <section key={lane.title} className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <h2 className="font-sans text-xl font-black">{lane.title}</h2>
                <ul className="mt-3 space-y-2">
                  {lane.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                      <span className="mt-2 h-2 w-2 shrink-0 bg-[var(--color-support)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
          <section className="mt-4 grid gap-4 lg:grid-cols-1">
            {j6DamageLanes.map((lane) => (
              <section key={lane.title} className="border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
                <h2 className="font-sans text-xl font-black">{lane.title}</h2>
                <ul className="mt-3 grid gap-2 md:grid-cols-2">
                  {lane.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                      <span className="mt-2 h-2 w-2 shrink-0 bg-[var(--color-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
          <section className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Political / public-pressure context
            </p>
            <h2 className="mt-2 font-sans text-2xl font-black">
              Use only what can be proven.
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {politicalContextLanes.map((lane) => (
                <section key={lane.title} className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
                  <h3 className="font-sans text-lg font-black leading-tight">
                    {lane.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                    {lane.body}
                  </p>
                  <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-xs font-bold leading-5 text-[var(--color-accent)]">
                    Needs: {lane.needs}
                  </p>
                </section>
              ))}
            </div>
          </section>
        </div>
      </details>

      <details id="open-questions" className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal marker:content-['']">
          <span>Open unanswered questions</span>
          <span className="border border-[var(--color-line)] px-2 py-1 text-[10px] text-[var(--color-accent)]">
            Fill before meeting
          </span>
        </summary>
        <div className="border-t border-[var(--color-line)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Open items
          </p>
          <h2 className="mt-2 font-sans text-2xl font-black">
            The next packet should answer these.
          </h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {questionsForRyan.slice(0, 8).map((question) => (
              <div key={question} className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm font-semibold leading-6">
                {question}
              </div>
            ))}
          </div>
        </div>
      </details>

      <details id="file-audit" className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-black uppercase tracking-normal text-[var(--color-ink)] marker:content-['']">
          <span>Open local file audit and remaining record signals</span>
          <span className="border border-[var(--color-line)] px-2 py-1 text-[10px] text-[var(--color-accent)]">
            Audit
          </span>
        </summary>
        <div className="border-t border-[var(--color-line)] p-4">
          <div className="grid gap-2 md:grid-cols-2">
            {sourceFiles.map((file) => (
              <div key={file.path} className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
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
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {urgentAsks.map((ask, index) => (
              <li key={ask} className="border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-3 text-sm font-semibold leading-6">
                <span className="mr-2 font-black text-[var(--color-accent)]">
                  {index + 1}.
                </span>
                {ask}
              </li>
            ))}
          </ol>
        </div>
      </details>

      <section className="mt-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">
          Operator note
        </p>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          The page intentionally gives counsel a clean first read, then hides
          the deeper file behind expandable packets. The fastest way to make the
          brief stronger is still to attach the exact charging instruments,
          probable-cause affidavits, report numbers, and native source files.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/case" className="border border-[var(--color-line)] px-3 py-2 text-sm font-black hover:border-[var(--color-accent)]">
            Upload case docs
          </Link>
          <Link href="/admin" className="border border-[var(--color-line)] px-3 py-2 text-sm font-black hover:border-[var(--color-accent)]">
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
        "border p-3",
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

function FirstOpenCard({
  step,
  title,
  body,
  href,
  tone,
}: {
  step: string;
  title: string;
  body: string;
  href: string;
  tone: string;
}) {
  const toneClass =
    tone === "red"
      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
      : tone === "green"
        ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
        : tone === "blue"
          ? "border-[#203a64] bg-[#dfe9fb]"
          : "border-[var(--color-support)] bg-[var(--color-support-soft)]";

  return (
    <a
      href={href}
      className={[
        "group flex min-h-[8.5rem] flex-col justify-between border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
        toneClass,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white/55 font-sans text-xl font-black text-[var(--color-ink)]">
          {step}
        </span>
        <span className="text-[10px] font-black uppercase tracking-normal text-[var(--color-accent)] transition group-hover:translate-x-0.5">
          Open
        </span>
      </div>
      <div>
        <h3 className="font-sans text-xl font-black leading-tight text-[var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          {body}
        </p>
      </div>
    </a>
  );
}

function PacketJump({
  href,
  label,
  title,
  body,
}: {
  href: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <a
      href={href}
      className="group border border-white/10 bg-white/[0.055] p-4 text-[#fdf8ea] transition hover:border-[#7fe3a9]/50 hover:bg-[#7fe3a9]/10"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
          {label}
        </p>
        <span className="text-[10px] font-black uppercase tracking-normal text-[#7fe3a9] transition group-hover:translate-x-0.5">
          Open
        </span>
      </div>
      <h3 className="mt-2 font-sans text-xl font-black leading-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
        {body}
      </p>
    </a>
  );
}

function MatterSplitCard({
  label,
  title,
  status,
  tone,
  items,
}: {
  label: string;
  title: string;
  status: string;
  tone: string;
  items: string[];
}) {
  const urgent = tone === "red";
  return (
    <section
      className={[
        "border p-4 shadow-sm",
        urgent
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-support)] bg-[var(--color-support-soft)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">
          {label}
        </p>
        <span
          className={[
            "px-2 py-1 text-[10px] font-black uppercase tracking-normal",
            urgent
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-support)] text-[#1a1410]",
          ].join(" ")}
        >
          {status}
        </span>
      </div>
      <h2 className="mt-2 font-sans text-2xl font-black">{title}</h2>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
            <span
              className={[
                "mt-2 h-2 w-2 shrink-0",
                urgent ? "bg-[var(--color-accent)]" : "bg-[var(--color-support-strong)]",
              ].join(" ")}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClaimSupportRow({
  claim,
  evidence,
  law,
  status,
  href,
  tone,
}: {
  claim: string;
  evidence: string;
  law: string;
  status: string;
  href: string;
  tone: string;
}) {
  const toneClass =
    tone === "red"
      ? "border-l-[var(--color-accent)]"
      : tone === "green"
        ? "border-l-[var(--color-success)]"
        : "border-l-[var(--color-support)]";
  const badgeClass =
    tone === "red"
      ? "bg-[var(--color-accent)] text-white"
      : tone === "green"
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        : "bg-[var(--color-support-soft)] text-[var(--color-support-strong)]";

  return (
    <div
      className={[
        "grid grid-cols-[1.1fr_1.2fr_1.15fr_8rem_5.5rem] border-b border-[var(--color-line)] border-l-4 bg-white/35 text-sm last:border-b-0",
        toneClass,
      ].join(" ")}
    >
      <div className="border-r border-[var(--color-line)] p-3 font-bold leading-6">
        {claim}
      </div>
      <div className="border-r border-[var(--color-line)] p-3 leading-6 text-[var(--color-ink-soft)]">
        {evidence}
      </div>
      <div className="border-r border-[var(--color-line)] p-3 leading-6 text-[var(--color-ink-soft)]">
        {law}
      </div>
      <div className="border-r border-[var(--color-line)] p-3">
        <span
          className={[
            "inline-flex min-h-7 items-center px-2 text-[10px] font-black uppercase tracking-normal",
            badgeClass,
          ].join(" ")}
        >
          {status}
        </span>
      </div>
      <div className="p-3">
        <a
          href={href}
          className="inline-flex min-h-8 items-center border border-[var(--color-line)] bg-[var(--color-paper)] px-2 text-[10px] font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Open
        </a>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div>
      <dt
        className={[
          "text-[10px] font-black uppercase tracking-[0.2em]",
          dark ? "text-[#d8c89e]" : "text-[var(--color-muted)]",
        ].join(" ")}
      >
        {label}
      </dt>
      <dd
        className={[
          "mt-1 font-semibold leading-6",
          dark ? "text-[#fdf8ea]" : "text-[var(--color-ink)]",
        ].join(" ")}
      >
        {value}
      </dd>
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
        "border p-4",
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
            "px-2 py-1 text-[10px] font-black uppercase",
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
      <div className="mt-3 border border-[var(--color-line)] bg-white/45 p-3">
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
