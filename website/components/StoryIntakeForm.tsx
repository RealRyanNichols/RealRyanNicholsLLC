"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSessionId, getVisitorId } from "@/lib/client-ids";
import { VoiceStoryRecorder } from "@/components/VoiceStoryRecorder";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const STORY_TYPES = [
  "Public corruption or official misconduct",
  "Court, family court, or pro se case",
  "Police, jail, CPS, agency, or records problem",
  "Fraud, business harm, or financial documents",
  "Threats, harassment, or retaliation",
  "Other story people need to understand",
] as const;

const PATTERN_TAGS = [
  "Missing records",
  "Changed story",
  "Same official",
  "Same agency",
  "Witnesses ignored",
  "Money trail",
  "Retaliation",
  "Court pattern",
  "Media silence",
  "Public safety",
] as const;

const PRIVACY_OPTIONS = [
  "Keep my name and identifying details private",
  "You may describe my role, not my name",
  "You may contact me, but keep me out of public work",
  "I am willing to be on the record after Ryan verifies first",
] as const;

const FOLLOW_UP_OPTIONS = [
  "Email is best",
  "Text or phone is best",
  "Either email or phone is fine",
  "No follow-up unless Ryan needs verification",
] as const;

function toLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function buildSignalScore(input: {
  story: string;
  proof: string;
  witnesses: string;
  people: string;
  dates: string;
  tags: string[];
}) {
  let score = 0;
  if (input.story.length >= 120) score += 1;
  if (input.proof.length >= 40) score += 1;
  if (input.witnesses.length >= 20) score += 1;
  if (input.people.length >= 20) score += 1;
  if (input.dates.length >= 8) score += 1;
  if (input.tags.length >= 2) score += 1;
  return Math.min(score, 6);
}

export function StoryIntakeForm({ source = "tell-your-story" }: { source?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [audioStatus, setAudioStatus] = useState<Status>({ kind: "idle" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [storyType, setStoryType] = useState<(typeof STORY_TYPES)[number]>(STORY_TYPES[0]);
  const [privacy, setPrivacy] = useState<(typeof PRIVACY_OPTIONS)[number]>(PRIVACY_OPTIONS[0]);
  const [followUp, setFollowUp] = useState<(typeof FOLLOW_UP_OPTIONS)[number]>(FOLLOW_UP_OPTIONS[0]);
  const [tags, setTags] = useState<string[]>(["Missing records"]);
  const [displayName, setDisplayName] = useState("");
  const [contact, setContact] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState("");
  const [people, setPeople] = useState("");
  const [story, setStory] = useState("");
  const [proof, setProof] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [missing, setMissing] = useState("");
  const [safeVersion, setSafeVersion] = useState("");
  const [ack, setAck] = useState(false);
  const [receipt, setReceipt] = useState<{ publicRef: string | null; ledgerUrl: string } | null>(null);

  const signalScore = useMemo(
    () => buildSignalScore({ story, proof, witnesses, people, dates, tags }),
    [story, proof, witnesses, people, dates, tags],
  );

  const preview = useMemo(() => {
    const title = headline.trim() || "Untitled story lead";
    const place = location.trim() || "Location not provided yet";
    const time = dates.trim() || "Date range not provided yet";
    const selectedTags = tags.length ? tags.join(" / ") : "No pattern tags selected";
    const proofLines = toLines(proof);
    const witnessLines = toLines(witnesses);
    return {
      title,
      place,
      time,
      selectedTags,
      proofLine: proofLines[0] ?? "Proof not listed yet",
      witnessLine: witnessLines[0] ?? "Witness links not listed yet",
      publicAngle:
        safeVersion.trim() ||
        "A safer public version can keep source identity out while showing the dates, records, officials, agencies, and proof that make the pattern understandable.",
    };
  }, [headline, location, dates, tags, proof, witnesses, safeVersion]);

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag].slice(0, 6),
    );
  }

  function appendStoryText(text: string) {
    setStory((current) => {
      const next = [current.trim(), text.trim()].filter(Boolean).join("\n\n");
      return next.slice(0, 1500);
    });
  }

  async function transcribeAudio() {
    if (!audioFile) {
      setAudioStatus({ kind: "error", message: "Choose an audio file first." });
      return;
    }
    setAudioStatus({ kind: "submitting" });
    trackEvent("story_audio_transcribe_attempt", {
      source,
      file_size: audioFile.size,
      file_type: audioFile.type || "unknown",
    });
    try {
      const body = new FormData();
      body.append("audio", audioFile);
      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body,
      });
      const json = (await response.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };
      if (!response.ok || !json.text) {
        setAudioStatus({
          kind: "error",
          message: json.error ?? "Could not transcribe that audio.",
        });
        trackEvent("story_audio_transcribe_failed", { source, reason: "api" });
        return;
      }
      appendStoryText(json.text);
      setAudioStatus({ kind: "success" });
      trackEvent("story_audio_transcribe_success", {
        source,
        chars: json.text.length,
      });
    } catch {
      setAudioStatus({ kind: "error", message: "Network error. Try again." });
      trackEvent("story_audio_transcribe_failed", { source, reason: "network" });
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;
    if (!story.trim() || story.trim().length < 80) {
      setStatus({ kind: "error", message: "Give Ryan at least one clear paragraph about what happened." });
      return;
    }
    if (!proof.trim()) {
      setStatus({ kind: "error", message: "List at least one record, screenshot, witness, link, or document that supports the story." });
      return;
    }
    if (!ack) {
      setStatus({ kind: "error", message: "Check the privacy and legal acknowledgement before sending." });
      return;
    }

    const compiled = [
      "Story web intake",
      "",
      "Story profile",
      `Headline: ${headline.trim() || "(not provided)"}`,
      `Story type: ${storyType}`,
      `Location: ${location.trim() || "(not provided)"}`,
      `Dates / timeline: ${dates.trim() || "(not provided)"}`,
      `People / agencies / courts: ${people.trim() || "(not provided)"}`,
      `Pattern tags: ${tags.length ? tags.join(", ") : "(none)"}`,
      `Signal score: ${signalScore}/6`,
      "",
      "Source profile",
      `Name: ${displayName.trim() || "(not provided)"}`,
      `Contact: ${contact.trim() || "(not provided)"}`,
      `Privacy boundary: ${privacy}`,
      `Follow-up preference: ${followUp}`,
      "",
      "What happened",
      story.trim(),
      "",
      "Proof / records / links",
      proof.trim(),
      "",
      "Witnesses or connected stories",
      witnesses.trim() || "(not provided)",
      "",
      "What is missing",
      missing.trim() || "(not provided)",
      "",
      "Safer public version requested",
      safeVersion.trim() || "(not provided)",
    ].join("\n");

    if (compiled.length > 4000) {
      setStatus({
        kind: "error",
        message: "This version is too long for the private intake. Cut it to the strongest facts and send the rest as follow-up.",
      });
      return;
    }

    setStatus({ kind: "submitting" });
    trackEvent("story_intake_submit_attempt", {
      source,
      story_type: storyType,
      tag_count: tags.length,
      signal_score: signalScore,
    });

    try {
      const response = await fetch("/api/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || undefined,
          email: contact.includes("@") ? contact : undefined,
          phone: contact && !contact.includes("@") ? contact.slice(0, 40) : undefined,
          subject: `Story web: ${headline.trim() || storyType}`,
          message: compiled,
          source_path: window.location.pathname,
          session_id: getSessionId() || undefined,
          visitor_id: getVisitorId() || undefined,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        public_ref?: string | null;
        ledger_url?: string | null;
      };
      if (!response.ok) {
        setStatus({ kind: "error", message: json.error ?? "Could not save your story yet." });
        trackEvent("story_intake_submit_failed", { source, reason: "api" });
        return;
      }
      setReceipt({
        publicRef: json.public_ref ?? null,
        ledgerUrl: json.ledger_url ?? "/case/intake",
      });
      setStatus({ kind: "success" });
      trackEvent("story_intake_submit_success", {
        source,
        story_type: storyType,
        tag_count: tags.length,
        signal_score: signalScore,
      });
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
      trackEvent("story_intake_submit_failed", { source, reason: "network" });
    }
  }

  if (status.kind === "success") {
    return (
      <section className="rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
          Story received
        </p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
          Your story is in the private review queue.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Ryan can compare it against other leads, pattern tags, people, agencies,
          dates, and records. Nothing is public just because you submitted it.
        </p>
        <div className="mt-4 border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-muted)]">
            Public-safe receipt
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-[var(--color-ink)]">
            {receipt?.publicRef ?? "Private queue"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            The receipt can show action happened. Your private story, contact
            details, and identifying facts stay in the admin review queue.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setStatus({ kind: "idle" });
              setReceipt(null);
              setHeadline("");
              setStory("");
              setProof("");
              setWitnesses("");
              setMissing("");
              setSafeVersion("");
              setAck(false);
            }}
            className="min-h-11 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-black text-white"
          >
            Send another story
          </button>
          <a
            href={receipt?.ledgerUrl ?? "/case/intake"}
            className="min-h-11 rounded-lg border border-[var(--color-line)] px-4 py-2 text-center text-sm font-black text-[var(--color-accent)]"
          >
            See the ledger
          </a>
          <a
            href="/submit"
            className="min-h-11 rounded-lg border border-[var(--color-line)] px-4 py-2 text-center text-sm font-black text-[var(--color-ink)]"
          >
            Send a hard tip
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
      <form onSubmit={submit} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xl sm:p-5">
        <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
          Tell the story
        </p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-normal">
          Build a witness-style story profile.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The stronger the structure, the easier it is to connect your story to
          another story without exposing what should stay private.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-bold">
            What kind of story is this?
            <select
              value={storyType}
              onChange={(event) => setStoryType(event.target.value as typeof storyType)}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
            >
              {STORY_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <Field
            label="Story headline"
            value={headline}
            onChange={setHeadline}
            placeholder="Example: Missing bodycam after a changed police report"
            maxLength={180}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Where did it happen?"
              value={location}
              onChange={setLocation}
              placeholder="City, county, state, court, jail, agency"
              maxLength={220}
            />
            <Field
              label="When?"
              value={dates}
              onChange={setDates}
              placeholder="Dates, date range, hearing date, deadline"
              maxLength={220}
            />
          </div>

          <TextField
            label="Who, what agency, court, company, or office was involved?"
            value={people}
            onChange={setPeople}
            rows={3}
            placeholder="Names, roles, agencies, courts, companies, case numbers, badge numbers, report numbers."
            maxLength={700}
          />

          <TextField
            label="What happened?"
            value={story}
            onChange={setStory}
            required
            rows={6}
            placeholder="Tell it in order. Start with the plain-English version, then add dates, actions, contradictions, and what made you realize the story did not add up."
            maxLength={1500}
          />

          <div className="rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-paper)] p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
                  Talk it out
                </p>
                <h3 className="font-display text-2xl font-black tracking-normal">
                  Say the story. Then clean it up.
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  Use the mic for live talk-to-text, or upload an audio note and
                  drop the transcript into the story box.
                </p>
              </div>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                {story.length.toLocaleString()} / 1,500
              </span>
            </div>

            <div className="mt-3">
              <VoiceStoryRecorder onAppendText={appendStoryText} />
            </div>

            <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-white p-3">
              <label className="grid gap-1 text-sm font-bold">
                Transcribe an audio file
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/mp4,audio/mpga,audio/m4a,audio/wav,audio/webm,video/mp4"
                  onChange={(event) => {
                    setAudioFile(event.target.files?.[0] ?? null);
                    setAudioStatus({ kind: "idle" });
                  }}
                  className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={transcribeAudio}
                  disabled={!audioFile || audioStatus.kind === "submitting"}
                  className="min-h-10 rounded-lg border-2 border-[var(--color-blue)] bg-[var(--color-blue)] px-4 py-2 text-sm font-black text-white transition hover:bg-[var(--color-blue-strong)] disabled:opacity-50"
                >
                  {audioStatus.kind === "submitting"
                    ? "Transcribing..."
                    : "Transcribe audio"}
                </button>
                {audioFile ? (
                  <span className="text-xs text-[var(--color-muted)]">
                    {audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                ) : null}
              </div>
              {audioStatus.kind === "success" ? (
                <p className="mt-2 text-xs font-bold text-[var(--color-blue)]">
                  Transcript added. Read it once, fix names and dates, then send.
                </p>
              ) : audioStatus.kind === "error" ? (
                <p className="mt-2 text-xs font-bold text-[var(--color-accent)]">
                  {audioStatus.message}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Audio is transcribed server-side and is not saved by this form.
                </p>
              )}
            </div>
          </div>

          <TextField
            label="What proof exists?"
            value={proof}
            onChange={setProof}
            required
            rows={4}
            placeholder="Screenshots, videos, links, court filings, police reports, dispatch logs, public records, texts, emails, receipts, witness names."
            maxLength={900}
          />

          <TextField
            label="Who else saw this, has records, or has a connected story?"
            value={witnesses}
            onChange={setWitnesses}
            rows={3}
            placeholder="Witnesses, other families, co-workers, neighbors, other defendants, public officials, reporters, attorneys, agencies."
            maxLength={700}
          />

          <TextField
            label="What record is missing?"
            value={missing}
            onChange={setMissing}
            rows={3}
            placeholder="Bodycam, dispatch logs, transcript, report, order, contract, bank record, email thread, CPS note, meeting minutes."
            maxLength={700}
          />

          <div>
            <p className="text-sm font-bold">Pattern tags</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PATTERN_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={[
                      "min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-black transition",
                      active
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
                    ].join(" ")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Pick up to six. These help Ryan compare stories without making public claims too early.
            </p>
          </div>

          <TextField
            label="What should the safer public version hide?"
            value={safeVersion}
            onChange={setSafeVersion}
            rows={3}
            placeholder="Example: Hide my name, employer, child details, address, phone number, and exact role. Public version can say former employee or family member."
            maxLength={700}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">
              Source protection
              <select
                value={privacy}
                onChange={(event) => setPrivacy(event.target.value as typeof privacy)}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
              >
                {PRIVACY_OPTIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Follow-up
              <select
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value as typeof followUp)}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
              >
                {FOLLOW_UP_OPTIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Optional"
              maxLength={120}
              autoComplete="name"
            />
            <Field
              label="Email or phone"
              value={contact}
              onChange={setContact}
              placeholder="Optional, only if follow-up is okay"
              maxLength={120}
              autoComplete="email"
            />
          </div>

          <label className="flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            <input
              type="checkbox"
              checked={ack}
              onChange={(event) => setAck(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span>
              I understand this is not emergency services, not legal advice,
              not legal representation, and not a guaranteed investigation. I
              will not submit sealed records, minors&apos; private information,
              SSNs, bank data, medical records, or anything I do not have
              permission to share.
            </span>
          </label>

          {status.kind === "error" ? (
            <p className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-2 text-sm font-bold text-[var(--color-accent)]">
              {status.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status.kind === "submitting"}
            className="min-h-12 rounded-lg bg-[var(--color-accent)] px-5 py-3 text-base font-black text-white transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
          >
            {status.kind === "submitting" ? "Saving story..." : "Send story profile"}
          </button>
        </div>
      </form>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-[var(--color-blue)] bg-[var(--color-blue-strong)] p-4 text-[var(--color-paper)] shadow-xl sm:p-5">
          <p className="text-xs font-black uppercase tracking-normal text-[#e1bd5b]">
            Live preview
          </p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-normal text-[var(--color-paper)]">
            {preview.title}
          </h2>
          <div className="mt-4 grid gap-2 text-sm text-white/80">
            <p>
              <strong className="text-white">Place:</strong> {preview.place}
            </p>
            <p>
              <strong className="text-white">Time:</strong> {preview.time}
            </p>
            <p>
              <strong className="text-white">Tags:</strong> {preview.selectedTags}
            </p>
            <p>
              <strong className="text-white">First proof:</strong> {preview.proofLine}
            </p>
            <p>
              <strong className="text-white">Connected story:</strong> {preview.witnessLine}
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-white/15 bg-white/[0.08] p-3">
            <p className="text-xs font-black uppercase tracking-normal text-white/60">
              Safer public angle
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {preview.publicAngle}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            Connection strength
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-5xl font-black tracking-normal">
              {signalScore}
            </span>
            <span className="pb-2 text-sm font-black text-[var(--color-muted)]">
              / 6
            </span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <span
                key={index}
                className={[
                  "h-2 rounded-full",
                  index < signalScore ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Strong story profiles include dates, proof, witnesses, people or
            agencies, and repeatable pattern tags. That is how one story starts
            connecting to another.
          </p>
        </section>

        <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
            What Ryan sees
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            <li>Story type, location, dates, people, agencies, and courts.</li>
            <li>Proof and missing records separated from claims.</li>
            <li>Witnesses and connected stories called out clearly.</li>
            <li>Privacy boundary before anything public is considered.</li>
          </ul>
        </section>
      </aside>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm font-normal"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
  maxLength: number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        rows={rows}
        placeholder={placeholder}
        className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
      />
    </label>
  );
}
