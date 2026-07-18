// Official dossiers — the "Wall of Shame" record for public officials who acted
// in United States v. Nichols. These are PUBLIC OFFICIALS documented in their
// OFFICIAL CAPACITY. Every claim carries a label so a reader can tell a court
// record from Ryan's stated position from an inference from something still
// pending authentication:
//
//   FACT                  — verifiable, uncontested (role, agency, docket facts)
//   RECORD                — stated on the court record / in a filing
//   RYAN STATEMENT        — Ryan's own account or characterization
//   DOCUMENTED INFERENCE  — a conclusion drawn from disclosed, sourced facts
//   NEEDS AUTHENTICATION  — real and load-bearing, but not yet independently verified
//
// This is the same discipline the rest of the archive uses. It is what makes the
// record hard to dismiss: it never overstates, and it shows its work.
//
// A dossier here overrides the generic person template on /case/people/[slug].
// To add an official, add an entry keyed by their case_people slug.

export type ClaimLabel =
  | "FACT"
  | "RECORD"
  | "RYAN STATEMENT"
  | "DOCUMENTED INFERENCE"
  | "NEEDS AUTHENTICATION";

export type DossierClaim = {
  label: ClaimLabel;
  text: string;
  source?: { label: string; href: string; external?: boolean };
};

export type DossierTimelineEntry = {
  when: string;
  tag: string; // short kicker, e.g. "The denial"
  title: string;
  detail: string;
  href?: string;
};

export type DossierSource = {
  label: string;
  href: string;
  external?: boolean;
  note?: string;
};

export type OfficialDossier = {
  slug: string;
  seal: string; // monogram for the header plate, e.g. "DB"
  kicker: string; // "Prosecutor of record · The record"
  name: string;
  role: string;
  agency: string;
  photoUrl?: string | null;
  standfirst: string; // plain-English summary, 2–4 sentences
  whyLine: string; // one line: why this profile exists
  claims: DossierClaim[];
  timeline: DossierTimelineEntry[];
  proves: string[]; // what the record shows
  notProven: string[]; // what it does NOT prove yet
  needs: string[]; // what Ryan needs next
  sources: DossierSource[];
};

const BRASHER: OfficialDossier = {
  slug: "ausa-douglas-brasher",
  seal: "DB",
  kicker: "Prosecutor of record · The record",
  name: "AUSA Douglas Brasher",
  role: "Assistant United States Attorney",
  agency: "U.S. Attorney's Office for the District of Columbia",
  photoUrl: null,
  standfirst:
    "Douglas Brasher was the federal prosecutor of record in United States v. Nichols. Before Ryan's guilty plea, the defense asked a direct question: were the two men attached to Ryan's rescue work — Marcus DiPaola and “1% Watchdog” — working for the government? On the record, the answer was no. About a year and a half after Ryan was sentenced, a public archive surfaced in which DiPaola describes himself as an FBI field-office informant during the exact years he was embedded inside Ryan's organization. This page is the record of that denial, and of what flowed from it.",
  whyLine:
    "A free country lets a man answer the prosecutor who put him away. This is that answer — sourced, labeled, and public.",
  claims: [
    {
      label: "FACT",
      text: "Douglas Brasher was an Assistant United States Attorney and the prosecutor of record in United States v. Nichols, out of the U.S. Attorney's Office for the District of Columbia.",
    },
    {
      label: "RECORD",
      text: "Pre-plea, the defense filed a disclosure request asking whether Marcus DiPaola — the man inside Ryan's rescue organization who filmed the 2018 Ellen-show rescue video — and “1% Watchdog,” the entity that assigned Ryan rescue missions, were government assets. On the record, Brasher denied the government had any idea who 1% Watchdog was, and stated that DiPaola was not a federal agent, not affiliated with the FBI, not affiliated with the feds.",
      source: {
        label: "The denial, on the record",
        href: "/case/events/brasher-denial-pre-plea",
      },
    },
    {
      label: "RYAN STATEMENT",
      text: "By Ryan's account, at that same point Brasher told him to take the plea — and warned that if he went to trial the government would seek the terrorism enhancement, the same one used against Matthew Perna, and that Ryan would get 20 to 30-plus years. Ryan says he was coerced into the deal he took, pleading without knowing whether the men inside his own organization were working for the government.",
      source: {
        label: "The denial, on the record",
        href: "/case/events/brasher-denial-pre-plea",
      },
    },
    {
      label: "DOCUMENTED INFERENCE",
      text: "About eighteen months after sentencing, a public-record archive surfaced in which Marcus DiPaola self-identifies as having worked for the FBI Chicago field office from 2016 to 2019 and openly discusses being wired in 2020 — years that align with the period he was embedded inside Ryan's hurricane-rescue organization and in direct contact with Ryan. If accurate, that is exactly the kind of relationship Brady v. Maryland requires the government to disclose before a plea. It was not disclosed.",
      source: {
        label: "DiPaola's self-admission surfaces",
        href: "/case/events/marcus-dipaola-fbi-revelation",
      },
    },
    {
      label: "NEEDS AUTHENTICATION",
      text: "The exact filing date of the disclosure request and the verbatim docket language are still being pulled from the court docket, and the DiPaola archive itself has not been independently authenticated. The substance above is stated from Ryan's record; the paper will be posted beside it as each piece is confirmed.",
      source: {
        label: "Archived: DiPaola in his own words",
        href: "https://archive.ph/jYVkv",
        external: true,
      },
    },
    {
      label: "RYAN STATEMENT",
      text: "Ryan's position: the denial hid the men attached to his own organization, the plea was taken blind, and DiPaola's later self-admission is the receipt. He is not asking anyone to take his word. He is asking for the docket, the disclosure request, and the government's written answer to be laid side by side — and for the tape to speak.",
    },
  ],
  timeline: [
    {
      when: "Pre-plea",
      tag: "The denial",
      title: "Brasher denies the federal ties, on the record",
      detail:
        "In response to the defense's disclosure request, the government denies knowing who 1% Watchdog is and denies that Marcus DiPaola is FBI or a federal agent.",
      href: "/case/events/brasher-denial-pre-plea",
    },
    {
      when: "~18 months after sentencing",
      tag: "The receipt",
      title: "DiPaola's own words surface",
      detail:
        "While Ryan is in federal prison, a public archive surfaces in which DiPaola describes himself as an FBI Chicago field-office informant, 2016–2019.",
      href: "/case/events/marcus-dipaola-fbi-revelation",
    },
  ],
  proves: [
    "A direct, pre-plea question was asked — and answered in the negative — on the record.",
    "A public archive exists in which the same man later describes himself as a federal informant during the relevant years.",
    "The timing of that informant window overlaps the period DiPaola was inside Ryan's rescue organization.",
  ],
  notProven: [
    "That Brasher personally knew of DiPaola's status at the moment of his denial — that is a question only the docket and the government's own files can answer.",
    "The DiPaola archive's authenticity, which is presented as surfaced and pending independent verification, not as adjudicated fact.",
    "No court has yet ruled on a Brady claim arising from these facts. This is the record being built, not a finding being announced.",
  ],
  needs: [
    "The disclosure request and the government's written response, pulled from the docket.",
    "Independent authentication of the DiPaola archive and its dates.",
    "Any witness who dealt with DiPaola or 1% Watchdog inside Rescue the Universe.",
  ],
  sources: [
    {
      label: "The denial, pre-plea (case timeline)",
      href: "/case/events/brasher-denial-pre-plea",
    },
    {
      label: "DiPaola self-admission surfaces (case timeline)",
      href: "/case/events/marcus-dipaola-fbi-revelation",
    },
    {
      label: "DiPaola in his own words (external archive)",
      href: "https://archive.ph/jYVkv",
      external: true,
      note: "Presented as surfaced public record — pending authentication.",
    },
  ],
};

export const OFFICIALS: Record<string, OfficialDossier> = {
  "ausa-douglas-brasher": BRASHER,
};

export function officialFor(slug: string): OfficialDossier | null {
  return OFFICIALS[slug] ?? null;
}

export function isOfficialSlug(slug: string): boolean {
  return slug in OFFICIALS;
}
