"use client";

import { useState } from "react";

type CreatedInvoice = {
  id: string;
  status: string;
  stripe_hosted_invoice_url: string | null;
};

type InvoiceResponse =
  | { ok: true; invoice: CreatedInvoice }
  | { error: string };

const quickDraft = {
  clientName: "Chase Simmons",
  amount: "1100",
  title: "Remaining balance for investigative work",
  description:
    "Remaining balance for investigative work agreement. Original agreement: $1,500. Amount still owed: $1,100.",
};

export function AdminInvoiceForm() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [title, setTitle] = useState("Real Ryan Nichols LLC service invoice");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState("14");
  const [memo, setMemo] = useState("");
  const [delivery, setDelivery] = useState<"local_draft" | "stripe_link" | "stripe_send">(
    "stripe_link",
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CreatedInvoice | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          title,
          description,
          amount_dollars: Number(amount),
          due_days: Number(dueDays),
          memo,
          delivery,
        }),
      });
      const json = (await res.json()) as InvoiceResponse;
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : "Could not create invoice.");
        return;
      }
      setResult(json.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invoice.");
    } finally {
      setBusy(false);
    }
  }

  function loadChaseDraft() {
    setClientName(quickDraft.clientName);
    setAmount(quickDraft.amount);
    setTitle(quickDraft.title);
    setDescription(quickDraft.description);
    setDelivery("local_draft");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Create invoice
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Send a payable service invoice
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Save a private receivable, create a Stripe payment link, or have
            Stripe email it after you confirm the client email. Stripe can show
            card, Link, Affirm, Klarna, and other eligible financing options on
            the hosted payment page.
          </p>
        </div>
        <button
          type="button"
          onClick={loadChaseDraft}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Load Chase $1,100 draft
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Client name
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="Full name or company"
          />
        </label>
        <label className="block text-sm font-semibold">
          Client email
          <input
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="needed if Stripe emails it"
          />
        </label>
        <label className="block text-sm font-semibold">
          Phone or note
          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="optional"
          />
        </label>
        <label className="block text-sm font-semibold">
          Amount due
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="1100"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold">
        Invoice title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Work performed / invoice description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          placeholder="Plain-English description of the work, agreement, remaining balance, and what this invoice covers."
        />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-[10rem_1fr]">
        <label className="block text-sm font-semibold">
          Due in days
          <input
            value={dueDays}
            onChange={(e) => setDueDays(e.target.value)}
            type="number"
            min="0"
            max="365"
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="block text-sm font-semibold">
          Internal memo
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="private admin note"
          />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Invoice action</legend>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {[
            ["local_draft", "Save draft", "Private record only."],
            ["stripe_link", "Create pay link", "Stripe invoice URL, no email sent."],
            ["stripe_send", "Email through Stripe", "Requires client email."],
          ].map(([value, label, sub]) => (
            <label
              key={value}
              className={[
                "rounded-xl border px-3 py-3 text-sm transition",
                delivery === value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-line)] bg-[var(--color-paper)]",
              ].join(" ")}
            >
              <input
                type="radio"
                name="delivery"
                checked={delivery === value}
                onChange={() => setDelivery(value as typeof delivery)}
                className="mr-2"
              />
              <span className="font-bold">{label}</span>
              <span className="mt-1 block text-xs text-[var(--color-muted)]">
                {sub}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-3 text-sm">
          <p className="font-bold">Invoice saved: {result.status}</p>
          {result.stripe_hosted_invoice_url ? (
            <a
              href={result.stripe_hosted_invoice_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-bold text-[var(--color-accent)] underline"
            >
              Open Stripe payment page
            </a>
          ) : (
            <p className="mt-1 text-[var(--color-muted)]">
              Add an email and create a Stripe link when you are ready to send.
            </p>
          )}
          {result.stripe_hosted_invoice_url ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">
              Financing displays only when Stripe approves the account, amount,
              customer location, and payment method.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-[var(--color-paper)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Creating invoice..." : "Create invoice"}
      </button>
    </form>
  );
}
