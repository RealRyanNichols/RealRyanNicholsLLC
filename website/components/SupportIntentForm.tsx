"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Purpose = "site" | "video" | "children" | "officials" | "community" | "needed";
type DisplayAs = "name" | "anonymous";
type Status = "idle" | "submitting" | "error";

const PURPOSES: { value: Purpose; label: string; blurb: string }[] = [
  {
    value: "site",
    label: "Keep the site alive",
    blurb: "Hosting, tools, archives, publishing, and the independent feed.",
  },
  {
    value: "video",
    label: "Own the video archive",
    blurb: "Storage, streaming, transcripts, clips, and channels hosted here.",
  },
  {
    value: "children",
    label: "Crimes against children",
    blurb: "Records work, document review, timelines, and public pressure.",
  },
  {
    value: "officials",
    label: "Corrupt officials",
    blurb: "Public-records work, agency tracking, and accountability files.",
  },
  {
    value: "community",
    label: "Help the community",
    blurb: "Apply excess support to someone local who needs real help.",
  },
  {
    value: "needed",
    label: "Use where needed most",
    blurb: "Let Ryan apply it to the most urgent need and document the work.",
  },
];

const AMOUNTS = [25, 50, 100, 250, 500, 1000];

export function SupportIntentForm({ donateUrl }: { donateUrl: string }) {
  const [purpose, setPurpose] = useState<Purpose>("needed");
  const [amount, setAmount] = useState<string>("100");
  const [customAmount, setCustomAmount] = useState("");
  const [displayAs, setDisplayAs] = useState<DisplayAs>("anonymous");
  const [publishMessage, setPublishMessage] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function stripeUrl(intentId: string | null, email: string): string {
    try {
      const url = new URL(donateUrl);
      if (intentId) url.searchParams.set("client_reference_id", intentId);
      if (email) url.searchParams.set("prefilled_email", email);
      return url.toString();
    } catch {
      return donateUrl;
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const intendedAmount = amount === "custom" ? customAmount.trim() : amount;
    const email = String(fd.get("email") ?? "").trim();
    const payload = {
      purpose,
      intended_amount: intendedAmount,
      display_name: String(fd.get("display_name") ?? "").trim(),
      email,
      message: String(fd.get("message") ?? "").trim(),
      publish_message: publishMessage,
      display_as: displayAs,
      show_amount: showAmount,
    };

    try {
      const res = await fetch("/api/support-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        intent_id?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Could not save your note. Try again.");
        return;
      }
      trackEvent("support_intent_saved", {
        purpose,
        amount: intendedAmount || "other",
        anonymous: displayAs === "anonymous",
        publish_message: publishMessage,
        show_amount: showAmount,
      });
      window.location.assign(stripeUrl(json.intent_id ?? null, email));
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative mt-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2">
          What should this support fund?
        </label>
        <div className="grid gap-2">
          {PURPOSES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPurpose(p.value)}
              aria-pressed={purpose === p.value}
              className={[
                "rounded-lg border-2 px-4 py-3 text-left transition",
                purpose === p.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                  : "border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              <span className="block text-sm font-bold text-[var(--color-ink)]">
                {p.label}
              </span>
              <span className="mt-1 block text-xs text-[var(--color-muted)] leading-relaxed">
                {p.blurb}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Intended amount
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              aria-pressed={amount === String(a)}
              className={[
                "rounded-lg border-2 px-3 py-2 text-sm font-bold transition",
                amount === String(a)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              ${a.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount("custom")}
            aria-pressed={amount === "custom"}
            className={[
              "rounded-lg border-2 px-3 py-2 text-sm font-bold transition",
              amount === "custom"
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            Any
          </button>
        </div>
        {amount === "custom" ? (
          <input
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Type the amount you plan to give"
            inputMode="decimal"
          />
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name" name="display_name" placeholder="Optional" />
        <Field label="Email" name="email" type="email" placeholder="Optional" />
      </div>

      <div>
        <label htmlFor="support-message" className="block text-sm font-semibold mb-1.5">
          Message to Ryan
        </label>
        <textarea
          id="support-message"
          name="message"
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base font-sans resize-y focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="Say what you want him to know. You can keep it private or allow it to be published later."
        />
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          Public visibility
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDisplayAs("anonymous")}
            aria-pressed={displayAs === "anonymous"}
            className={[
              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition",
              displayAs === "anonymous"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            Keep me anonymous
          </button>
          <button
            type="button"
            onClick={() => setDisplayAs("name")}
            aria-pressed={displayAs === "name"}
            className={[
              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition",
              displayAs === "name"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            Use my name
          </button>
        </div>
        <label className="flex gap-3 text-sm text-[var(--color-ink-soft)]">
          <input
            type="checkbox"
            checked={publishMessage}
            onChange={(e) => setPublishMessage(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
          />
          Ryan may publish my message as a public supporter note.
        </label>
        <label className="flex gap-3 text-sm text-[var(--color-ink-soft)]">
          <input
            type="checkbox"
            checked={showAmount}
            onChange={(e) => setShowAmount(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
          />
          If published, Ryan may show the amount.
        </label>
      </div>

      {errorMsg ? (
        <p className="text-sm text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-accent w-full rounded-full px-6 py-4 text-base font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Saving note..." : "Save my note and open Stripe →"}
      </button>

      <p className="text-xs text-[var(--color-muted)] text-center">
        Your note saves first. Stripe handles the payment securely. Ryan can
        review the note later and publish only what you allowed.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  const id = `support-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type ?? "text"}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );
}
