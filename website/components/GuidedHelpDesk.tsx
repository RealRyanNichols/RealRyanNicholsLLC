"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { getSessionId, getVisitorId } from "@/lib/client-ids";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; message: string }
  | { kind: "error"; message: string };

const SITUATIONS = [
  "Public corruption or misconduct",
  "Court, family court, or pro se case chaos",
  "Threats, harassment, or online attacks",
  "Public-records or missing-document problem",
  "Story, article, or media lead",
  "Website, audience, or business-service question",
] as const;

const PRIVACY = [
  "Keep my name and identifying details private",
  "You can use my role, but not my name",
  "You can contact me, but keep me out of public work",
  "I am willing to be on the record",
] as const;

function nextSteps(situation: string, privacy: string): string[] {
  const steps = [
    "Write a clean timeline with dates, names, locations, and what happened in order.",
    "Separate proof from claims: screenshots, filings, videos, report numbers, links, and witnesses go in one list.",
  ];

  if (/records|missing-document/i.test(situation)) {
    steps.push("Name the exact record that is missing so Ryan can see whether a public-records request makes sense.");
  } else if (/court|family|pro se/i.test(situation)) {
    steps.push("List the next court date, case number, order, motion, or deadline before sending more background.");
  } else if (/threats|harassment/i.test(situation)) {
    steps.push("Preserve screenshots with dates and links, but do not post private addresses, minors, SSNs, or medical details.");
  } else if (/website|audience|business/i.test(situation)) {
    steps.push("Start with the audience, offer, proof, and the action you want visitors to take.");
  } else {
    steps.push("Send the strongest source first, then the missing piece Ryan should look for.");
  }

  if (/private|role|contact/i.test(privacy)) {
    steps.push("Keep identifying details in the private lane until the public version can be redacted.");
  }

  return steps.slice(0, 4);
}

export function GuidedHelpDesk({ source = "guided-help-desk" }: { source?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [situation, setSituation] = useState<(typeof SITUATIONS)[number]>(SITUATIONS[0]);
  const [privacy, setPrivacy] = useState<(typeof PRIVACY)[number]>(PRIVACY[0]);
  const [question, setQuestion] = useState("");
  const [facts, setFacts] = useState("");
  const [proof, setProof] = useState("");
  const [need, setNeed] = useState("I need help understanding what to do next.");
  const [ack, setAck] = useState(false);

  const steps = useMemo(() => nextSteps(situation, privacy), [situation, privacy]);
  const response = useMemo(() => {
    if (/website|audience|business/i.test(situation)) {
      return "This looks like an attention and conversion problem. Ryan can help turn the message, proof, service offer, and contact path into something people can act on.";
    }
    if (/court|family|pro se/i.test(situation)) {
      return "This looks like a record-organization problem. The next move is not a vague call. The next move is a timeline, issue list, evidence list, and the missing records.";
    }
    if (/threats|harassment/i.test(situation)) {
      return "This looks sensitive. Preserve proof, avoid public escalation with private details, and send only the facts Ryan needs to understand the pattern.";
    }
    if (/records|missing-document/i.test(situation)) {
      return "This looks like a missing-record problem. The useful answer starts with the exact record, who controls it, when it should exist, and why it matters.";
    }
    return "This looks like a tip or story lead. The useful version separates what happened, what proves it, what is still missing, and what must stay private.";
  }, [situation]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !facts.trim()) {
      setState({ kind: "error", message: "Answer the question and facts fields first." });
      return;
    }
    if (!ack) {
      setState({ kind: "error", message: "Check the privacy and legal acknowledgement first." });
      return;
    }

    const compiled = [
      "Guided private assistant intake",
      "",
      "Audience profile",
      `Name: ${name.trim() || "(not provided)"}`,
      `Contact: ${contact.trim() || "(not provided)"}`,
      `Situation: ${situation}`,
      `Privacy boundary: ${privacy}`,
      `Primary need: ${need.trim() || "(not provided)"}`,
      "",
      "Question they need answered",
      question.trim(),
      "",
      "Facts provided",
      facts.trim(),
      "",
      "Evidence or proof mentioned",
      proof.trim() || "(not provided)",
      "",
      "Tailored response shown on site",
      response,
      ...steps.map((step, index) => `${index + 1}. ${step}`),
    ].join("\n");

    if (compiled.length > 4000) {
      setState({ kind: "error", message: "Shorten the facts or proof section and send the strongest details first." });
      return;
    }

    setState({ kind: "saving" });
    trackEvent("guided_help_submit_attempt", { source, situation });

    try {
      const res = await fetch("/api/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name || undefined,
          email: contact.includes("@") ? contact : undefined,
          phone: contact && !contact.includes("@") ? contact.slice(0, 40) : undefined,
          subject: `Guided help: ${situation}`,
          message: compiled,
          source_path: window.location.pathname,
          session_id: getSessionId() || undefined,
          visitor_id: getVisitorId() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Could not save this intake." });
        trackEvent("guided_help_submit_failed", { source, reason: "api" });
        return;
      }
      setState({ kind: "saved", message: "Saved. Ryan can review this privately if follow-up is needed." });
      trackEvent("guided_help_submit_success", { source, situation });
    } catch {
      setState({ kind: "error", message: "Network error. Try again." });
      trackEvent("guided_help_submit_failed", { source, reason: "network" });
    }
  }

  return (
    <section
      id="guided-assistant"
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xl sm:p-5"
    >
      <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
        Private help desk
      </p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-normal sm:text-3xl">
        Answer the first questions here.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        This guided assistant gives you an immediate next-step answer and saves
        the private context for Ryan&apos;s review. It is not a 24/7 demand line.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 120))}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
              placeholder="Optional"
              autoComplete="name"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Email or phone
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value.slice(0, 120))}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
              placeholder="Optional, only if follow-up is okay"
              autoComplete="email"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-bold">
          What kind of help do you need?
          <select
            value={situation}
            onChange={(event) => setSituation(event.target.value as typeof situation)}
            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
          >
            {SITUATIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-bold">
          Source protection
          <select
            value={privacy}
            onChange={(event) => setPrivacy(event.target.value as typeof privacy)}
            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
          >
            {PRIVACY.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-bold">
          What question do you need answered?
          <textarea
            required
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, 700))}
            rows={3}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            placeholder="Example: I need to know if these records show misconduct, what is missing, and how to explain it without exposing myself."
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          What happened?
          <textarea
            required
            value={facts}
            onChange={(event) => setFacts(event.target.value.slice(0, 1400))}
            rows={5}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            placeholder="Dates, people, agencies, court names, locations, and the short version in plain English."
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          What proof exists?
          <textarea
            value={proof}
            onChange={(event) => setProof(event.target.value.slice(0, 900))}
            rows={3}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            placeholder="Screenshots, videos, filings, links, report numbers, docket entries, witnesses, public posts."
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          What do you want resolved?
          <input
            value={need}
            onChange={(event) => setNeed(event.target.value.slice(0, 220))}
            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
          />
        </label>

        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
          <p className="text-sm font-black text-[var(--color-ink)]">
            Your tailored answer
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {response}
          </p>
          <ol className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {steps.map((step) => (
              <li key={step} className="rounded-lg bg-white px-3 py-2">
                {step}
              </li>
            ))}
          </ol>
        </div>

        <label className="flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          <input
            type="checkbox"
            checked={ack}
            onChange={(event) => setAck(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>
            I understand this is not emergency services, legal advice, or legal
            representation. I will not send sealed records, minors&apos; private
            information, SSNs, bank data, or medical records here.
          </span>
        </label>

        <button
          type="submit"
          disabled={state.kind === "saving"}
          className="min-h-11 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-black text-[var(--color-paper)] disabled:opacity-60"
        >
          {state.kind === "saving" ? "Saving..." : "Save this private profile"}
        </button>
      </form>

      {state.kind === "saved" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
          <p className="font-bold">{state.message}</p>
          <p className="mt-1">
            Need paid help organizing the whole record?{" "}
            <Link href="/store/strategy-call-30" className="font-black underline">
              Book the strategy call
            </Link>
            .
          </p>
        </div>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-4 text-sm font-bold text-red-700">{state.message}</p>
      ) : null}
    </section>
  );
}
