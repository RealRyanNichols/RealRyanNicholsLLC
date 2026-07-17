"use client";

import { useMemo, useState } from "react";

// A public utility: build a correctly-formatted public-records request letter
// for bodycam, dispatch, 911 audio, reports, medical, and grievances — Texas
// Public Information Act for state/local, federal FOIA for BOP/USMS/DOJ.
// The visitor fills a short form and walks away with a ready-to-send letter.
// This is "release the bodycam" turned into a tool. Not legal advice.

type Jurisdiction = "tx" | "federal";

type RecordKey =
  | "bodycam"
  | "dashcam"
  | "cad"
  | "audio911"
  | "incident"
  | "useofforce"
  | "medical"
  | "grievances"
  | "personnel";

const RECORDS: { key: RecordKey; label: string; line: (ctx: Ctx) => string; jur?: Jurisdiction }[] = [
  {
    key: "bodycam",
    label: "Body-worn camera footage",
    line: (c) =>
      `All body-worn camera (BWC) footage${c.who} for ${c.eventPhrase}, complete and unedited, with audio and original timestamps/metadata intact.`,
  },
  {
    key: "dashcam",
    label: "Dash-camera footage",
    line: (c) =>
      `All in-car/dash-camera footage${c.who} for ${c.eventPhrase}, complete and unedited, with audio and original metadata.`,
  },
  {
    key: "cad",
    label: "Dispatch / CAD logs",
    line: (c) =>
      `The complete Computer-Aided Dispatch (CAD) report, dispatch logs, and radio traffic for ${c.eventPhrase}.`,
  },
  {
    key: "audio911",
    label: "911 call audio",
    line: (c) =>
      `All 911 call audio recordings and any transcripts related to ${c.eventPhrase}.`,
  },
  {
    key: "incident",
    label: "Incident / offense reports",
    line: (c) =>
      `The full incident/offense report(s), including all narratives, supplements, and attachments, for ${c.eventPhrase}.`,
  },
  {
    key: "useofforce",
    label: "Use-of-force reports",
    line: (c) =>
      `All use-of-force reports, supervisory reviews, and related documentation arising from ${c.eventPhrase}.`,
  },
  {
    key: "medical",
    label: "Jail/BOP medical & mental-health records",
    line: (c) =>
      `The complete medical and mental-health records${c.forSubject} during confinement${c.atFacility}, including sick-call requests, medication administration records, and treatment notes.`,
  },
  {
    key: "grievances",
    label: "Grievances & responses",
    line: (c) =>
      `All grievances filed${c.bySubject}${c.atFacility}, together with every response, appeal, and disposition.`,
  },
  {
    key: "personnel",
    label: "Officer complaint / discipline history (as public)",
    line: (c) =>
      `To the extent releasable, the complaint and disciplinary history for the officer(s) involved in ${c.eventPhrase}.`,
  },
];

type Ctx = {
  who: string;
  forSubject: string;
  bySubject: string;
  atFacility: string;
  eventPhrase: string;
};

function todayLong(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function RecordsRequestTool() {
  const [jur, setJur] = useState<Jurisdiction>("tx");
  const [agency, setAgency] = useState("");
  const [agencyAddr, setAgencyAddr] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [facility, setFacility] = useState("");
  const [picked, setPicked] = useState<Set<RecordKey>>(new Set(["bodycam", "cad", "audio911", "incident"]));
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [copied, setCopied] = useState(false);

  function toggle(k: RecordKey) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const letter = useMemo(() => {
    const ctx: Ctx = {
      who: subject ? ` involving ${subject}` : "",
      forSubject: subject ? ` for ${subject}` : " for the person named below",
      bySubject: subject ? ` by ${subject}` : "",
      atFacility: facility ? ` at ${facility}` : "",
      eventPhrase:
        [
          "the incident",
          date ? `on ${date}` : "",
          location ? `at ${location}` : "",
          caseNo ? `(case/report no. ${caseNo})` : "",
          subject ? `involving ${subject}` : "",
        ]
          .filter(Boolean)
          .join(" ") || "the incident described below",
    };

    const lines = RECORDS.filter((r) => picked.has(r.key)).map((r, i) => `   ${i + 1}. ${r.line(ctx)}`);
    const recordsBlock = lines.length ? lines.join("\n\n") : "   1. [Select the records you are requesting above.]";

    const preserve =
      "Please preserve all responsive records — including body-worn and dash camera footage, dispatch/CAD, radio traffic, and 911 audio — and do not delete, overwrite, or allow them to be auto-purged while this request is pending.";
    const format =
      "Please provide the records in their original electronic/native format where available, including associated metadata.";

    if (jur === "tx") {
      return [
        todayLong(),
        "",
        "Public Information Officer",
        agency || "[Agency name]",
        agencyAddr || "[Agency address]",
        "",
        `Re: Texas Public Information Act Request${subject ? ` — ${subject}` : ""}${date ? ` (${date})` : ""}`,
        "",
        "To the Public Information Officer:",
        "",
        "Under the Texas Public Information Act, Texas Government Code Chapter 552, I request access to and copies of the following records:",
        "",
        recordsBlock,
        "",
        preserve,
        "",
        format,
        "",
        "If you withhold any portion of these records, please state the specific statutory exception and, as required by § 552.301, request an Attorney General decision within ten (10) business days.",
        "",
        "If fulfilling this request will exceed $40 in charges, please contact me first with an itemized estimate. I request a waiver of fees to the extent the records serve the public interest.",
        "",
        "Please respond within ten (10) business days as required by § 552.221. You can reach me at the contact below.",
        "",
        "Sincerely,",
        name || "[Your name]",
        contact || "[Your email / phone / mailing address]",
      ].join("\n");
    }

    return [
      todayLong(),
      "",
      "FOIA Officer",
      agency || "[Agency — e.g., Federal Bureau of Prisons / U.S. Marshals Service]",
      agencyAddr || "[Agency FOIA address]",
      "",
      `Re: Freedom of Information Act Request${subject ? ` — ${subject}` : ""}${date ? ` (${date})` : ""}`,
      "",
      "Dear FOIA Officer:",
      "",
      "Under the Freedom of Information Act, 5 U.S.C. § 552, I request copies of the following records:",
      "",
      recordsBlock,
      "",
      preserve,
      "",
      format,
      "",
      "If any portion is withheld, please cite the specific FOIA exemption and release all reasonably segregable non-exempt material.",
      "",
      "I request a fee waiver because disclosure is in the public interest and is not primarily for commercial use. If fees will exceed $25, please contact me first with an estimate.",
      "",
      "As required by 5 U.S.C. § 552(a)(6)(A)(i), please respond within twenty (20) business days. You can reach me at the contact below.",
      "",
      "Sincerely,",
      name || "[Your name]",
      contact || "[Your email / phone / mailing address]",
    ].join("\n");
  }, [jur, agency, agencyAddr, subject, date, location, caseNo, facility, picked, name, contact]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `records-request-${(subject || "letter").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none";
  const lbl = "text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Form */}
      <div className="space-y-5">
        <div>
          <p className={lbl}>Who are you requesting from?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setJur("tx")}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                jur === "tx"
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
              }`}
            >
              Texas / local agency
            </button>
            <button
              type="button"
              onClick={() => setJur("federal")}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                jur === "federal"
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
              }`}
            >
              Federal (BOP / USMS / DOJ)
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            {jur === "tx"
              ? "Texas Public Information Act — 10 business days to respond."
              : "Federal FOIA — 20 business days to respond."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={lbl}>Agency name</span>
            <input className={field} value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Harrison County Sheriff's Office" />
          </label>
          <label className="block">
            <span className={lbl}>Agency address</span>
            <input className={field} value={agencyAddr} onChange={(e) => setAgencyAddr(e.target.value)} placeholder="Marshall, TX" />
          </label>
        </div>

        <div>
          <p className={lbl}>What records do you want?</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {RECORDS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => toggle(r.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  picked.has(r.key)
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-black ${
                    picked.has(r.key) ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--color-line)]"
                  }`}
                >
                  {picked.has(r.key) ? "✓" : ""}
                </span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={lbl}>Person the records concern</span>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Full name" />
          </label>
          <label className="block">
            <span className={lbl}>Date of incident</span>
            <input className={field} value={date} onChange={(e) => setDate(e.target.value)} placeholder="July 13, 2025" />
          </label>
          <label className="block">
            <span className={lbl}>Location</span>
            <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or place" />
          </label>
          <label className="block">
            <span className={lbl}>Case / report # (optional)</span>
            <input className={field} value={caseNo} onChange={(e) => setCaseNo(e.target.value)} placeholder="If you have one" />
          </label>
          <label className="block sm:col-span-2">
            <span className={lbl}>Facility (for medical / grievances)</span>
            <input className={field} value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Jail or prison name" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={lbl}>Your name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label className="block">
            <span className={lbl}>Your contact</span>
            <input className={field} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email / phone / address" />
          </label>
        </div>
      </div>

      {/* Output */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 flex items-center justify-between">
          <p className={lbl}>Your letter — ready to send</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-bold text-white transition hover:brightness-105"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-bold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 font-mono text-[12.5px] leading-relaxed text-[var(--color-ink)]">
{letter}
        </pre>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
          This tool generates a request letter from public statutes. It is not legal advice and does not
          create an attorney-client relationship. Send it yourself, keep a copy, and note the date.
        </p>
      </div>
    </div>
  );
}
