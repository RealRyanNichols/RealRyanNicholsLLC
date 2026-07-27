"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const REPORT_URL = "/thebiglie/report/index.html";

const inputClass =
  "w-full rounded-md border border-[#2b4a7a] bg-[#0b1830] px-3.5 py-3 text-base text-[#fdf8ea] outline-none transition placeholder:text-[#7b8db0] focus:border-[#e1bd5b]";
const labelClass =
  "block text-[11px] font-black uppercase tracking-[0.16em] text-[#9fb2d0]";

/**
 * Free-report gate for The BIG Lie.
 *
 * Posts to the existing /api/book-signup route (email + name + consent,
 * deduped in `book_email_signups`). If the reader also gives a phone number
 * and ticks SMS consent, that leg is sent separately to /api/subscribe, which
 * accepts a phone on its own. Nothing about the report is withheld: on success
 * we reveal the link, and the report is reachable directly regardless.
 */
export function BigLieGate({ source = "thebiglie" }: { source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!consent) {
      setError("Please check the box so I can email you the report.");
      return;
    }
    setBusy(true);
    setError(null);
    trackEvent("biglie_signup_attempt", { source });
    try {
      const res = await fetch("/api/book-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source_page: source, consent }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        trackEvent("biglie_signup_failed", { source, status: res.status });
        setError(json.error ?? "Could not save your signup. Try again.");
        return;
      }

      // Phone is optional and only sent when SMS consent is ticked.
      if (phone.trim() && smsConsent) {
        try {
          await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phone.trim() }),
          });
          trackEvent("biglie_phone_captured", { source });
        } catch {
          // Never block the report on the phone leg.
        }
      }

      // Fire day 1 of the 30-day series immediately. Fire-and-forget.
      try {
        void fetch("/api/biglie/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch {
        // The daily cron enrolls anyone this misses.
      }
      trackEvent("biglie_signup_success", { source });
      setDone(true);
    } catch {
      trackEvent("biglie_signup_failed", { source, reason: "network" });
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-[#4cc38a] bg-[#0b1f1a] p-6 text-center sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4cc38a]">
          You are on the list
        </p>
        <h3 className="mt-2 font-display text-3xl font-black text-[#fdf8ea]">
          Here it is. Read it now.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-[#cfd9ea]">
          26,102 words, 166 images and 12 charts. It is free, it stays free, and
          you can send it to anybody.
        </p>
        <a
          href={REPORT_URL}
          className="mt-6 inline-block rounded-lg bg-[#e1bd5b] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#071126] transition hover:brightness-110"
          onClick={() => trackEvent("biglie_report_opened", { source })}
        >
          Open The Report
        </a>
        <p className="mt-5 text-xs font-semibold text-[#9fb2d0]">
          Then read what happened next in{" "}
          <Link href="/book" className="text-[#e1bd5b] underline">
            Fighting Shadows
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border-2 border-[#e1bd5b] bg-[#0b1830] p-6 text-left shadow-2xl sm:p-8"
    >
      <h3 className="font-display text-2xl font-black text-[#fdf8ea]">
        Read it free. Right now.
      </h3>
      <p className="mt-1 text-sm font-semibold text-[#cfd9ea]">
        No paywall, no trial, no card. Tell me where to send it and the whole
        report opens on the next screen.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className={labelClass} htmlFor="bl-name">
            First name
          </label>
          <input
            id="bl-name"
            className={`mt-1.5 ${inputClass}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            placeholder="First name"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bl-email">
            Email
          </label>
          <input
            id="bl-email"
            type="email"
            className={`mt-1.5 ${inputClass}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bl-phone">
            Phone{" "}
            <span className="font-semibold normal-case tracking-normal text-[#7b8db0]">
              (optional, for breaking filings)
            </span>
          </label>
          <input
            id="bl-phone"
            type="tel"
            className={`mt-1.5 ${inputClass}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="(optional)"
          />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2b4a7a] bg-[#071126] p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#e1bd5b]"
        />
        <span className="text-xs font-semibold leading-relaxed text-[#cfd9ea]">
          Email me the report and tell me when new filings and evidence drop. I
          can unsubscribe any time.
        </span>
      </label>

      {phone.trim().length > 0 && (
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2b4a7a] bg-[#071126] p-3.5">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#e1bd5b]"
          />
          <span className="text-xs font-semibold leading-relaxed text-[#cfd9ea]">
            <strong className="text-[#fdf8ea]">Text me when it matters.</strong>{" "}
            By checking this box you give Real Ryan Nichols LLC your express
            written consent to send you text messages about new filings,
            evidence and articles. Consent is not a condition of getting the
            report. Message and data rates may apply. Message frequency varies.
            Reply STOP to cancel, HELP for help.
          </span>
        </label>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-[#e0533f] bg-[#2a1116] px-3 py-2.5 text-sm font-semibold text-[#f0a396]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-[#e1bd5b] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#071126] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send Me The Report"}
      </button>

      <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-[#7b8db0]">
        No spam. I never sell your information.
        <br />
        This list is how the record reaches you when the platforms will not show
        it.
      </p>
    </form>
  );
}
