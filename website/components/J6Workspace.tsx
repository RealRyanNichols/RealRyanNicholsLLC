"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

type J6Profile = {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  description: string | null;
  photo_url: string | null;
  claim_status: string;
  views_count: number;
  shares_count: number;
  case_number: string | null;
  court: string | null;
  judge_name: string | null;
  prosecutor_name: string | null;
  defense_attorney: string | null;
  arrest_date: string | null;
  plea_date: string | null;
  sentence_date: string | null;
  sentence_summary: string | null;
  disposition: string | null;
  charges: string[] | null;
  news_links: string[] | null;
  support_url: string | null;
};

type Submission = {
  id: string;
  title: string;
  doc_type: string;
  media_kind: string;
  file_url: string | null;
  embed_url: string | null;
  submission_status: string;
  created_at: string;
};

type Tab = "overview" | "testimony" | "case" | "photo" | "embed" | "avatar";

export function J6Workspace({
  j6Profile,
  submissions,
  firstName,
}: {
  j6Profile: J6Profile;
  submissions: Submission[];
  firstName: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <section className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Your J6 Anti-Weaponization Case Builder
      </p>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
        This is your workspace, {firstName}.
      </h2>
      <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-snug">
        Your profile is verified. The site is yours. Build your case in your own
        words — every piece of evidence you upload waits for one quick review
        before going public, then it's live on{" "}
        <Link
          href={`/case/people/${j6Profile.slug}`}
          target="_blank"
          className="text-[var(--color-accent)] font-bold hover:underline"
        >
          your profile page →
        </Link>
      </p>

      {/* Top stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Profile views" value={j6Profile.views_count} />
        <Stat label="Shares" value={j6Profile.shares_count} />
        <Stat label="Things you've posted" value={submissions.length} />
      </div>

      {/* Action tabs */}
      <nav className="mt-5 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabBtn>
        <TabBtn active={tab === "testimony"} onClick={() => setTab("testimony")}>
          ✍️ Tell your story
        </TabBtn>
        <TabBtn active={tab === "case"} onClick={() => setTab("case")}>
          ⚖️ My case
        </TabBtn>
        <TabBtn active={tab === "photo"} onClick={() => setTab("photo")}>
          📸 Add photo
        </TabBtn>
        <TabBtn active={tab === "embed"} onClick={() => setTab("embed")}>
          🎬 Embed video
        </TabBtn>
        <TabBtn active={tab === "avatar"} onClick={() => setTab("avatar")}>
          🖼️ Profile photo
        </TabBtn>
      </nav>

      <div className="mt-5">
        {tab === "overview" ? (
          <OverviewView submissions={submissions} j6Slug={j6Profile.slug} />
        ) : null}
        {tab === "testimony" ? (
          <TestimonyForm
            personId={j6Profile.id}
            currentDescription={j6Profile.description}
          />
        ) : null}
        {tab === "case" ? <CaseDetailsForm profile={j6Profile} /> : null}
        {tab === "photo" ? <PhotoUploadForm personId={j6Profile.id} /> : null}
        {tab === "embed" ? <EmbedForm personId={j6Profile.id} /> : null}
        {tab === "avatar" ? (
          <AvatarUploadForm
            personId={j6Profile.id}
            currentUrl={j6Profile.photo_url}
          />
        ) : null}
      </div>
    </section>
  );
}

function CaseDetailsForm({ profile }: { profile: J6Profile }) {
  const router = useRouter();
  const [caseNumber, setCaseNumber] = useState(profile.case_number ?? "");
  const [court, setCourt] = useState(profile.court ?? "");
  const [judge, setJudge] = useState(profile.judge_name ?? "");
  const [prosecutor, setProsecutor] = useState(profile.prosecutor_name ?? "");
  const [attorney, setAttorney] = useState(profile.defense_attorney ?? "");
  const [arrestDate, setArrestDate] = useState(profile.arrest_date ?? "");
  const [pleaDate, setPleaDate] = useState(profile.plea_date ?? "");
  const [sentenceDate, setSentenceDate] = useState(profile.sentence_date ?? "");
  const [sentenceSummary, setSentenceSummary] = useState(
    profile.sentence_summary ?? "",
  );
  const [disposition, setDisposition] = useState(profile.disposition ?? "");
  const [chargesRaw, setChargesRaw] = useState(
    (profile.charges ?? []).join("\n"),
  );
  const [newsLinksRaw, setNewsLinksRaw] = useState(
    (profile.news_links ?? []).join("\n"),
  );
  const [supportUrl, setSupportUrl] = useState(profile.support_url ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/j6/case-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: profile.id,
          case_number: caseNumber,
          court,
          judge_name: judge,
          prosecutor_name: prosecutor,
          defense_attorney: attorney,
          arrest_date: arrestDate,
          plea_date: pleaDate,
          sentence_date: sentenceDate,
          sentence_summary: sentenceSummary,
          disposition,
          charges_raw: chargesRaw,
          news_links_raw: newsLinksRaw,
          support_url: supportUrl,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not save.");
        return;
      }
      setMsg("Saved. Live on your public profile.");
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-ink-soft)]">
        The facts of your case. Every field is optional — fill in what you
        want public. Saves go live on your profile immediately.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CaseField
          label="Case number"
          value={caseNumber}
          onChange={setCaseNumber}
          placeholder="e.g. 1:21-cr-00117"
        />
        <CaseField
          label="Court"
          value={court}
          onChange={setCourt}
          placeholder="e.g. U.S. District Court for the District of Columbia"
        />
        <CaseField
          label="Judge"
          value={judge}
          onChange={setJudge}
          placeholder="e.g. Hon. Royce Lamberth"
        />
        <CaseField
          label="Prosecutor (AUSA)"
          value={prosecutor}
          onChange={setProsecutor}
          placeholder="e.g. AUSA Douglas Brasher"
        />
        <CaseField
          label="Defense attorney"
          value={attorney}
          onChange={setAttorney}
          placeholder="Your lawyer's name"
        />
        <CaseField
          label="Disposition"
          value={disposition}
          onChange={setDisposition}
          placeholder="pardoned / dismissed / sentenced / awaiting trial"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CaseDate label="Arrest date" value={arrestDate} onChange={setArrestDate} />
        <CaseDate label="Plea date" value={pleaDate} onChange={setPleaDate} />
        <CaseDate
          label="Sentence date"
          value={sentenceDate}
          onChange={setSentenceDate}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5">
          Sentence summary
        </label>
        <textarea
          value={sentenceSummary}
          onChange={(e) => setSentenceSummary(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="e.g. 41 months federal prison, 3 years supervised release, $2,000 restitution"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5">
          Charges (one per line)
        </label>
        <textarea
          value={chargesRaw}
          onChange={(e) => setChargesRaw(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={
            "18 U.S.C. § 1512(c)(2) — Obstruction of an official proceeding\n18 U.S.C. § 231(a)(3) — Civil disorder"
          }
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5">
          News links about your case (one per line)
        </label>
        <textarea
          value={newsLinksRaw}
          onChange={(e) => setNewsLinksRaw(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder={
            "https://example.com/news-story\nhttps://example.com/another-piece"
          }
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5">
          Support link (GiveSendGo, GoFundMe, etc.)
        </label>
        <input
          type="url"
          value={supportUrl}
          onChange={(e) => setSupportUrl(e.target.value)}
          maxLength={500}
          placeholder="https://givesendgo.com/your-page"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {msg ? <p className="text-sm text-[var(--color-accent)]">{msg}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save case details →"}
      </button>
    </div>
  );
}

function CaseField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );
}

function CaseDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-2.5">
      <div className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-[var(--color-accent)]">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
        {label}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-2 -mb-px border-b-2 text-xs sm:text-sm font-bold tracking-tight transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OverviewView({
  submissions,
  j6Slug,
}: {
  submissions: Submission[];
  j6Slug: string;
}) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--color-paper)] border border-[var(--color-line-soft)] p-5 text-center">
        <p className="text-base font-bold">Nothing posted yet.</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Start with{" "}
          <strong>Tell your story</strong> — your testimony in your own words —
          or drop a <strong>photo</strong> of evidence. Anything you submit
          waits for one review by Ryan before going public on your profile.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
        Your submissions
      </p>
      {submissions.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-paper)] border border-[var(--color-line-soft)] p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{s.title}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              <span className="font-mono">{s.media_kind}</span> ·{" "}
              {formatDistanceToNowStrict(new Date(s.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
          <SubmissionStatusBadge status={s.submission_status} />
        </div>
      ))}
      <Link
        href={`/case/people/${j6Slug}`}
        target="_blank"
        className="block mt-3 text-xs text-[var(--color-accent)] font-bold hover:underline text-center"
      >
        View your public profile →
      </Link>
    </div>
  );
}

function SubmissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    approved: { bg: "var(--color-success)", label: "PUBLIC" },
    pending: { bg: "var(--color-tag-procedural)", label: "PENDING" },
    rejected: { bg: "var(--color-accent)", label: "REJECTED" },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span
      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-paper)]"
      style={{ background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function TestimonyForm({
  personId,
  currentDescription,
}: {
  personId: string;
  currentDescription: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState(currentDescription ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/j6/testimony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId, description: body }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not save.");
        return;
      }
      setMsg("Saved. Your testimony is now on your public profile.");
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-ink-soft)]">
        Your case in your own words. What happened to you. What the government
        did. What you want the public to know. As long or short as you want —
        this lands at the top of your profile.
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={14}
        placeholder="Start typing your story…"
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 text-base leading-relaxed focus:outline-none focus:border-[var(--color-accent)] font-sans resize-y"
      />
      <p className="text-xs text-[var(--color-muted)]">
        {body.length.toLocaleString()} characters. Saves directly — no review
        needed for your own story.
      </p>
      {msg ? (
        <p className="text-sm text-[var(--color-accent)]">{msg}</p>
      ) : null}
      <button
        type="button"
        disabled={busy || body.trim().length === 0}
        onClick={save}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save my story →"}
      </button>
    </div>
  );
}

function PhotoUploadForm({ personId }: { personId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!file) {
      setMsg("Pick a photo first.");
      return;
    }
    if (!title.trim()) {
      setMsg("Give it a title so people know what they're looking at.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("person_id", personId);
    fd.append("file", file);
    fd.append("title", title.trim());
    if (caption.trim()) fd.append("caption", caption.trim());
    try {
      const res = await fetch("/api/account/j6/photo", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Upload failed.");
        return;
      }
      setMsg("Uploaded. Waiting on Ryan to approve before it goes public.");
      setFile(null);
      setTitle("");
      setCaption("");
      const input = document.getElementById("j6-photo-file") as HTMLInputElement | null;
      if (input) input.value = "";
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-[var(--color-ink-soft)]">
        Add a photo to your profile — a mugshot, a courthouse selfie, evidence
        of conditions, anything that helps tell your story. PNG / JPEG / WEBP,
        up to 10MB.
      </p>
      <div>
        <label htmlFor="j6-photo-title" className="text-xs font-bold block mb-1.5">
          Title <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="j6-photo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="e.g. 'Day I was released from CTF' or 'Hospital photo, Jan 18 2021'"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label htmlFor="j6-photo-caption" className="text-xs font-bold block mb-1.5">
          Caption (optional)
        </label>
        <textarea
          id="j6-photo-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Anything you want people to know about this photo."
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>
      <div>
        <label htmlFor="j6-photo-file" className="text-xs font-bold block mb-1.5">
          Photo <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id="j6-photo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:text-[var(--color-paper)] file:font-bold file:px-3 file:py-1.5 file:hover:bg-[var(--color-accent-strong)]"
        />
      </div>
      {msg ? <p className="text-sm text-[var(--color-accent)]">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Submit photo →"}
      </button>
    </form>
  );
}

function EmbedForm({ personId }: { personId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      setMsg("Paste the full URL starting with https://");
      return;
    }
    if (!title.trim()) {
      setMsg("Give it a title.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/j6/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          url: url.trim(),
          title: title.trim(),
          caption: caption.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not save.");
        return;
      }
      setMsg("Submitted. Waiting on Ryan to approve.");
      setUrl("");
      setTitle("");
      setCaption("");
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-[var(--color-ink-soft)]">
        Paste a TikTok, YouTube, X (Twitter), Rumble, or other public video URL
        and it'll embed on your profile.
      </p>
      <div>
        <label className="text-xs font-bold block mb-1.5">
          Video URL <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1.5">
          Title <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="What's in the video"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label className="text-xs font-bold block mb-1.5">
          Caption (optional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>
      {msg ? <p className="text-sm text-[var(--color-accent)]">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit video →"}
      </button>
    </form>
  );
}

function AvatarUploadForm({
  personId,
  currentUrl,
}: {
  personId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!file) {
      setMsg("Pick an image.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("person_id", personId);
    fd.append("file", file);
    try {
      const res = await fetch("/api/account/j6/avatar", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Upload failed.");
        return;
      }
      setMsg("Profile photo updated. Live on your public profile.");
      setFile(null);
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-[var(--color-ink-soft)]">
        The photo that appears on your profile header. Square works best. PNG /
        JPEG / WEBP, up to 5MB. No review — goes live immediately.
      </p>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="Current profile photo"
            className="h-20 w-20 rounded-full object-cover border-2 border-[var(--color-line)]"
          />
          <span className="text-xs text-[var(--color-muted)]">Current photo</span>
        </div>
      ) : null}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:text-[var(--color-paper)] file:font-bold file:px-3 file:py-1.5 file:hover:bg-[var(--color-accent-strong)]"
      />
      {msg ? <p className="text-sm text-[var(--color-accent)]">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Set profile photo →"}
      </button>
    </form>
  );
}
