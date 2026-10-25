"use client";

import { useId, useRef, useState } from "react";

export function WaterIncidentReportForm({
  sourcePostSlug = "",
}: {
  sourcePostSlug?: string;
}) {
  const id = useId();
  const sending = useRef(false);
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [basis, setBasis] = useState("firsthand");
  const field = (name: string) => `${id}-${name}`;
  const input =
    "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-ink)]";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "");
    try {
      const result = await fetch("/api/water-incident-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          town: text("town"),
          county: text("county"),
          incident_date: text("incident_date"),
          utility: text("utility"),
          general_location: text("general_location"),
          knowledge_basis: text("knowledge_basis"),
          observed_details: text("observed_details"),
          heard_details: text("heard_details"),
          notice_context: text("notice_context"),
          notice_url: text("notice_url"),
          contact_email: text("contact_email"),
          contact_permission: data.get("contact_permission") === "on",
          private_review_consent: data.get("private_review_consent") === "on",
          source_post_slug: sourcePostSlug,
          website: text("website"),
        }),
      });
      const body = (await result.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!result.ok || body.ok !== true)
        throw new Error(
          body.error || "Could not save the report. Please try again later.",
        );
      form.reset();
      setStatus("saved");
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Could not save the report. Please try again later.",
      );
      setStatus("error");
    } finally {
      sending.current = false;
    }
  }

  if (status === "saved")
    return (
      <section
        className="not-prose my-8 rounded-xl border border-[var(--color-line)] p-6"
        role="status"
      >
        <h3 className="text-xl font-bold text-[var(--color-ink)]">
          Private report received
        </h3>
        <p className="mt-2">
          Your report is awaiting review. It has not been published, verified or
          sent to a utility or public agency.
        </p>
      </section>
    );

  return (
    <section
      className="not-prose my-8 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      aria-labelledby={field("title")}
    >
      <h3
        id={field("title")}
        className="text-2xl font-bold text-[var(--color-ink)]"
      >
        Share a private fiber or water incident report
      </h3>
      <p className="mt-3">
        Tell us what you personally observed and separate anything you heard
        from others. Reports are private leads for review, not verified findings
        or permission to publish.
      </p>
      <p id={field("privacy")} className="mt-2 text-sm">
        Do not include home addresses, children&apos;s details, medical records,
        account numbers or private documents. Use a general area only. No
        uploads are accepted. This is not an emergency service or a utility
        repair request.{" "}
        <a href="/privacy" className="underline">
          Privacy policy
        </a>
      </p>
      <form
        onSubmit={submit}
        className="mt-5 space-y-4"
        aria-describedby={field("privacy")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor={field("town")}>
            Town or nearest community
            <input
              id={field("town")}
              name="town"
              required
              minLength={2}
              maxLength={100}
              className={input}
            />
          </label>
          <label htmlFor={field("county")}>
            County, if known
            <input
              id={field("county")}
              name="county"
              maxLength={100}
              className={input}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor={field("date")}>
            Incident date
            <input
              id={field("date")}
              name="incident_date"
              type="date"
              required
              className={input}
            />
          </label>
          <label htmlFor={field("utility")}>
            Utility or contractor, if known
            <input
              id={field("utility")}
              name="utility"
              maxLength={120}
              className={input}
            />
          </label>
        </div>
        <label className="block" htmlFor={field("location")}>
          General area or public landmark, optional
          <input
            id={field("location")}
            name="general_location"
            maxLength={160}
            placeholder="General area only, no home address"
            className={input}
          />
        </label>
        <label className="block" htmlFor={field("basis")}>
          How do you know about this?
          <select
            id={field("basis")}
            name="knowledge_basis"
            value={basis}
            onChange={(event) => setBasis(event.target.value)}
            className={input}
          >
            <option value="firsthand">I personally observed it</option>
            <option value="secondhand">Someone else reported it to me</option>
            <option value="mixed">Both, separated below</option>
          </select>
        </label>
        <label className="block" htmlFor={field("observed")}>
          What you personally observed
          <textarea
            id={field("observed")}
            name="observed_details"
            required={basis !== "secondhand"}
            minLength={20}
            maxLength={4000}
            rows={4}
            className={input}
          />
        </label>
        <label className="block" htmlFor={field("heard")}>
          What someone else reported, optional unless selected above
          <textarea
            id={field("heard")}
            name="heard_details"
            required={basis !== "firsthand"}
            minLength={20}
            maxLength={4000}
            rows={3}
            className={input}
          />
        </label>
        <label className="block" htmlFor={field("notice")}>
          Public notice or repair reference, optional
          <textarea
            id={field("notice")}
            name="notice_context"
            maxLength={2000}
            rows={2}
            placeholder="Describe the notice; leave out private account details"
            className={input}
          />
        </label>
        <label className="block" htmlFor={field("url")}>
          Public notice URL, optional
          <input
            id={field("url")}
            name="notice_url"
            type="url"
            maxLength={2048}
            className={input}
          />
        </label>
        <label className="block" htmlFor={field("email")}>
          Email for private follow-up, optional
          <input
            id={field("email")}
            name="contact_email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className={input}
          />
        </label>
        <label className="flex items-start gap-3">
          <input name="contact_permission" type="checkbox" className="mt-1" />
          <span>You may contact me privately by email about this report.</span>
        </label>
        <label className="flex items-start gap-3">
          <input
            name="private_review_consent"
            type="checkbox"
            required
            className="mt-1"
          />
          <span>
            I consent to private review of this report. I understand this does
            not give permission to publish my report or contact details.
          </span>
        </label>
        <div hidden aria-hidden="true">
          <label htmlFor={field("website")}>
            Leave this blank
            <input
              id={field("website")}
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="font-semibold text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-accent w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending"
            ? "Saving private report…"
            : "Send for private review"}
        </button>
      </form>
    </section>
  );
}
