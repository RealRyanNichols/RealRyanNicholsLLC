"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "submitting" | "ok" | "error";
type Category = "j6" | "national" | "local" | "other";
type TipReceiptRoute = {
  kind: string;
  label: string;
  urgency: "hot" | "next" | "watch";
  score: number;
  reason: string;
  next_action: string;
  tags: string[];
};

const CATEGORIES: { value: Category; label: string; blurb: string }[] = [
  { value: "j6", label: "J6 case", blurb: "A January 6 defendant, case, or detention story." },
  { value: "national", label: "National / world news", blurb: "A national or global story, official, or pattern worth exposing." },
  { value: "local", label: "Local news", blurb: "Something happening in your town or state." },
  { value: "other", label: "Other", blurb: "Anything else you think we should see." },
];

export function TipForm({
  defaultCategory = "national",
  subjectDefault,
  profileSlug,
  submitterEmailDefault,
}: {
  defaultCategory?: Category;
  subjectDefault?: string;
  profileSlug?: string;
  submitterEmailDefault?: string;
} = {}) {
  const isProfileSuggestion = Boolean(profileSlug);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>(
    isProfileSuggestion ? "j6" : defaultCategory,
  );
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [receipt, setReceipt] = useState<{
    publicRef: string | null;
    ledgerUrl: string;
    route: TipReceiptRoute | null;
  } | null>(null);

  async function shareTipLine() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/submit`
        : "/submit";
    trackEvent("tip_line_share_click", { surface: "tip_success" });

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Send a tip to Real Ryan Nichols LLC",
          text: "If you have records, screenshots, links, names, dates, or evidence leads, send them here.",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2400);
    } catch {
      setShareStatus("idle");
    }
  }

  async function shareReceipt() {
    if (!receipt) return;
    const url =
      typeof window !== "undefined"
        ? new URL(receipt.ledgerUrl, window.location.origin).toString()
        : receipt.ledgerUrl;
    trackEvent("tip_receipt_share_click", {
      route: receipt.route?.kind ?? "unknown",
      urgency: receipt.route?.urgency ?? "unknown",
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: receipt.publicRef
            ? `Public intake receipt ${receipt.publicRef}`
            : "Public intake receipt",
          text: "This tip was logged into the Real Ryan Nichols public-safe intake ledger.",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2400);
    } catch {
      setShareStatus("idle");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const urls = String(fd.get("urls") ?? "")
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));

    const payload = {
      category: isProfileSuggestion ? "j6" : category,
      profile_slug: profileSlug ?? null,
      location: String(fd.get("location") ?? "").trim() || null,
      submitter_name: String(fd.get("submitter_name") ?? "").trim() || null,
      submitter_email: String(fd.get("submitter_email") ?? "").trim() || "",
      defendant_name: String(fd.get("defendant_name") ?? "").trim(),
      narrative: String(fd.get("narrative") ?? "").trim(),
      urls,
    };
    trackEvent("tip_submit_attempt", {
      category,
      has_email: payload.submitter_email.length > 0,
      has_name: Boolean(payload.submitter_name),
      url_count: urls.length,
    });

    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        public_ref?: string | null;
        ledger_url?: string;
        route?: TipReceiptRoute;
      };
      if (!res.ok) {
        trackEvent("tip_submit_failed", { category, reason: "api" });
        setStatus("error");
        setErrorMsg(json.error ?? "Something went wrong. Try again.");
        return;
      }
      trackEvent("tip_submit_success", {
        category,
        has_email: payload.submitter_email.length > 0,
        url_count: urls.length,
        route: json.route?.kind ?? "unknown",
        urgency: json.route?.urgency ?? "unknown",
      });
      setReceipt({
        publicRef: json.public_ref ?? null,
        ledgerUrl: json.ledger_url ?? "/case/intake",
        route: json.route ?? null,
      });
      setStatus("ok");
      form.reset();
    } catch {
      trackEvent("tip_submit_failed", { category, reason: "network" });
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-2xl font-bold tracking-normal">
          {isProfileSuggestion
            ? "Profile update received for review."
            : "Tip received and logged."}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          It is now in Ryan&apos;s review queue and on the public-safe intake
          ledger. Private details stay private, but the record shows that the
          lead came in and can be verified, disputed, or connected to another
          case.
        </p>
        {receipt?.publicRef ? (
          <div className="mt-4 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-muted)]">
              Public receipt
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-[var(--color-ink)]">
              {receipt.publicRef}
            </p>
          </div>
        ) : null}
        {receipt?.route ? (
          <div className="mt-4 border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-success)]">
                  Instant route
                </p>
                <h3 className="mt-1 font-sans text-xl font-black text-[var(--color-ink)]">
                  {receipt.route.label}
                </h3>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-black uppercase tracking-normal",
                  receipt.route.urgency === "hot"
                    ? "bg-[var(--color-accent)] text-white"
                    : receipt.route.urgency === "next"
                      ? "bg-[var(--color-support)] text-[#17120e]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
                ].join(" ")}
              >
                {receipt.route.urgency} · {receipt.route.score}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
              {receipt.route.reason}
            </p>
            <p className="mt-3 border-l-4 border-[var(--color-support)] pl-3 text-sm font-bold leading-6 text-[var(--color-ink)]">
              Next: {receipt.route.next_action}
            </p>
            {receipt.route.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {receipt.route.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm text-[var(--color-ink-soft)]">
          <p className="font-bold text-[var(--color-ink)]">What happens now:</p>
          <p>The tip gets sorted into the intake ledger immediately.</p>
          <p>Other people can help verify, connect, dispute, or add related context.</p>
          <p>Useful public information can support timelines, records requests, case files, or the nexus map.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setStatus("idle");
            }}
            className="rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Send another
          </button>
          <a
            href={receipt?.ledgerUrl ?? "/case/intake"}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            See my receipt
          </a>
          <button
            type="button"
            onClick={shareReceipt}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
          >
            {shareStatus === "copied" ? "Link copied" : "Share receipt"}
          </button>
          <button
            type="button"
            onClick={shareTipLine}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
          >
            {shareStatus === "copied" ? "Link copied" : "Share the tip line"}
          </button>
        </div>
      </div>
    );
  }

  const isJ6 = category === "j6";
  const subjectLabel = isJ6 ? "Whose case is this?" : "Subject — who or what (optional)";
  const subjectHint = isJ6
    ? "The January 6 defendant this tip is about. If it's you, put your own name."
    : "The person, agency, company, or topic this is about, if you know.";
  const subjectPlaceholder = isJ6
    ? "e.g. Ryan Nichols (or 'myself')"
    : "e.g. a name, an agency, a company, a headline";

  return (
    <form action="/api/tips" method="post" onSubmit={onSubmit} className="space-y-4">
      {/* What kind of tip — turns the J6 line into a full newsroom intake. */}
      {isProfileSuggestion ? (
        <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-success)]">
            Signed-in profile suggestion
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            This submission is tied to your account and will be reviewed before
            anything changes on the public profile.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            What kind of tip is this?
            <span className="text-[var(--color-accent)] ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  trackEvent("tip_category_select", { category: c.value });
                }}
                aria-pressed={category === c.value}
                className={[
                  "min-h-12 rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition",
                  category === c.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            {CATEGORIES.find((c) => c.value === category)?.blurb}
          </p>
        </div>
      )}

      <Field
        key={isJ6 ? "subj-j6" : "subj-news"}
        label={isProfileSuggestion ? "Profile" : subjectLabel}
        name="defendant_name"
        required={isJ6}
        placeholder={subjectPlaceholder}
        hint={
          isProfileSuggestion
            ? "The suggestion will be attached to this exact public profile."
            : subjectHint
        }
        defaultValue={subjectDefault}
        readOnly={isProfileSuggestion}
      />

      {category === "local" ? (
        <Field
          label="Where? (city & state)"
          name="location"
          placeholder="e.g. Longview, TX"
          hint="So we can route and verify local tips."
        />
      ) : null}

      <Field
        label={
          isProfileSuggestion
            ? "What should be corrected or added?"
            : "The story / evidence"
        }
        name="narrative"
        required
        textarea
        rows={8}
        placeholder="What happened. What's the evidence. Dates if you have them. Where the records live if you know."
      />

      <Field
        label="Links (optional)"
        name="urls"
        textarea
        rows={3}
        placeholder="https://example.com/court-doc.pdf&#10;https://twitter.com/post"
        hint="One per line. Court documents, news stories, social posts, video URLs."
      />

      <div className="border-t border-[var(--color-line)] pt-4 space-y-4">
        <p className="text-xs uppercase tracking-normal text-[var(--color-muted)] font-bold">
          So we can follow up (optional)
        </p>
        <Field
          label="Your name"
          name="submitter_name"
          placeholder="Optional"
        />
        <Field
          label="Your email"
          name="submitter_email"
          type="email"
          placeholder="Optional"
          hint="Only used to follow up. Not added to any list. Not made public."
          defaultValue={submitterEmailDefault}
          readOnly={isProfileSuggestion && Boolean(submitterEmailDefault)}
        />
      </div>

      {errorMsg ? (
        <p className="text-sm text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      ) : null}

      <label className="flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
        <span>
          I understand this is not emergency services, legal advice, or a
          guaranteed investigation. I am not submitting sealed material,
          minors&apos; private information, Social Security numbers, bank data,
          medical records, or anything I do not have permission to share.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-5 py-4 font-bold text-lg hover:bg-[var(--color-accent-strong)] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting"
          ? "Sending..."
          : isProfileSuggestion
            ? "Submit profile update for review"
            : "Send tip"}
      </button>

      <p className="text-xs text-[var(--color-muted)] text-center">
        {isProfileSuggestion
          ? "Profile suggestions are reviewed by hand and never change the public record automatically."
          : "Tips are reviewed by hand. We do not store your IP — only a one-way hash for rate limiting."}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  textarea,
  rows,
  placeholder,
  hint,
  defaultValue,
  readOnly,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  readOnly?: boolean;
}) {
  const id = `tip-${name}`;
  const baseCls =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">
        {label}
        {required ? <span className="text-[var(--color-accent)] ml-1">*</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          required={required}
          rows={rows ?? 4}
          placeholder={placeholder}
          defaultValue={defaultValue}
          readOnly={readOnly}
          className={`${baseCls} font-sans resize-y`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type ?? "text"}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          readOnly={readOnly}
          className={baseCls}
        />
      )}
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
