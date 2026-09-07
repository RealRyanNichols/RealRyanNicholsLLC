"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  FUEL_FLOOR_CENTS,
  FUEL_MAX_CENTS,
  fuelDuration,
  tierForAmount,
  usdWhole,
  type ResolvedFuelTier,
} from "@/lib/fuel";
import { FUEL_PICK_EVENT } from "@/components/FuelQuickPick";

// The Token Fund form. Three steps on one screen: pick the fuel, say who you
// are, say what you want, then Stripe. Every control is at least 44px tall.
export function FuelCheckout({
  tiers,
  paymentsConfigured,
  billCents,
  initialTier = null,
}: {
  tiers: ResolvedFuelTier[];
  paymentsConfigured: boolean;
  billCents: number;
  initialTier?: string | null;
}) {
  const featured = tiers.find((t) => t.featured) ?? tiers[0] ?? null;
  const startSlug = tiers.some((t) => t.slug === initialTier) ? initialTier : (featured?.slug ?? null);
  const [tierSlug, setTierSlug] = useState<string | null>(startSlug);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ask, setAsk] = useState("");
  const [displayAs, setDisplayAs] = useState<"name" | "anonymous">("name");
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The hero's quick-pick buttons select a tier here without a reload.
  useEffect(() => {
    function onPick(e: Event) {
      const slug = (e as CustomEvent<string | null>).detail;
      setTierSlug(slug && tiers.some((t) => t.slug === slug) ? slug : null);
      setCustom("");
      if (!slug) {
        window.setTimeout(() => {
          document.querySelector<HTMLInputElement>("[data-fuel-custom]")?.focus();
        }, 450);
      }
    }
    window.addEventListener(FUEL_PICK_EVENT, onPick);
    return () => window.removeEventListener(FUEL_PICK_EVENT, onPick);
  }, [tiers]);

  const customCents = custom.trim() ? Math.round(Number(custom) * 100) : NaN;
  const selected: ResolvedFuelTier | null = tierSlug
    ? (tiers.find((t) => t.slug === tierSlug) ?? null)
    : Number.isFinite(customCents)
      ? tierForAmount(tiers, customCents)
      : null;
  const amountCents = tierSlug ? (selected?.amountCents ?? 0) : customCents;
  const askRequired = !!selected?.askRequired;
  const haveAmount = Number.isFinite(amountCents) && amountCents > 0;
  const duration = haveAmount ? fuelDuration(amountCents, billCents) : null;
  const earned = selected ? tiers.filter((t) => t.amountCents <= selected.amountCents).flatMap((t) => t.gets) : [];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!tierSlug && !Number.isFinite(customCents)) {
      setError("Pick a tier or enter an amount.");
      return;
    }
    if (!tierSlug && customCents < FUEL_FLOOR_CENTS) {
      setError(`The floor is ${usdWhole(FUEL_FLOOR_CENTS)}. Below that, card fees eat the gift.`);
      return;
    }
    if (askRequired && !ask.trim()) {
      setError(`${selected?.title} needs the topic first.`);
      return;
    }
    setBusy(true);
    trackEvent("support_intent_attempt", { source: "fuel", tier: tierSlug ?? "custom", amount: amountCents / 100 });
    try {
      const res = await fetch("/api/checkout/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierSlug,
          amount_cents: tierSlug ? null : customCents,
          display_name: name,
          email,
          ask,
          display_as: displayAs,
          publish_message: publish,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        trackEvent("support_intent_failed", { source: "fuel", reason: res.status });
        setError(json.error ?? "Could not start checkout. Try again in a moment.");
        setBusy(false);
        return;
      }
      trackEvent("support_checkout_open", { source: "fuel", tier: tierSlug ?? "custom", amount: amountCents / 100 });
      window.location.href = json.url;
    } catch {
      trackEvent("support_intent_failed", { source: "fuel", reason: "network" });
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-3 text-base text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none min-h-11";

  return (
    <form onSubmit={submit} data-fuel-form className="space-y-8">
      {/* Step 1: the fuel */}
      <div>
        <StepLabel n={1}>Pick your fuel</StepLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Pick an amount">
          {tiers.map((t) => {
            const on = tierSlug === t.slug;
            const time = fuelDuration(t.amountCents, billCents);
            return (
              <button
                key={t.slug}
                type="button"
                role="radio"
                aria-checked={on}
                data-fuel-tier={t.slug}
                onClick={() => {
                  setTierSlug(t.slug);
                  setCustom("");
                }}
                className={`relative min-h-11 rounded-2xl border-2 p-4 text-left transition ${
                  on
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-md"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-3xl font-black tabular-nums tracking-tight text-[var(--color-ink)]">
                    {usdWhole(t.amountCents)}
                  </span>
                  {t.featured ? (
                    <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-paper)]">
                      Most asked for
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-base font-bold text-[var(--color-ink)]">{t.title}</p>
                {time ? (
                  <p className="mt-0.5 text-xs font-black uppercase tracking-wider text-[var(--color-accent)]">
                    {time}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{t.blurb}</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-soft)]">
                  {t.gets.map((g) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-[var(--color-accent)]" aria-hidden>
                        ✓
                      </span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                {on ? (
                  <span className="absolute right-4 top-4 hidden text-xs font-black uppercase tracking-wider text-[var(--color-accent)] sm:block">
                    {t.featured ? "" : "Selected"}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Custom amount */}
          <label
            className={`flex min-h-11 flex-col justify-center rounded-2xl border-2 p-4 transition ${
              !tierSlug
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-md"
                : "border-[var(--color-line)] bg-[var(--color-surface)]"
            }`}
          >
            <span className="text-base font-bold text-[var(--color-ink)]">Your own amount</span>
            <span className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
              {usdWhole(FUEL_FLOOR_CENTS)} floor, {usdWhole(FUEL_MAX_CENTS)} ceiling. You get the highest tier your amount reaches.
            </span>
            <span className="mt-3 flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--color-ink)]">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={FUEL_FLOOR_CENTS / 100}
                max={FUEL_MAX_CENTS / 100}
                step={1}
                value={custom}
                onFocus={() => setTierSlug(null)}
                onChange={(e) => {
                  setTierSlug(null);
                  setCustom(e.target.value);
                }}
                placeholder="0"
                aria-label="Custom amount in dollars"
                data-fuel-custom
                className={field}
              />
            </span>
            {!tierSlug && Number.isFinite(customCents) && customCents >= FUEL_FLOOR_CENTS ? (
              <span className="mt-2 text-xs font-black uppercase tracking-wider text-[var(--color-accent)]">
                {fuelDuration(customCents, billCents) ?? ""}
                {selected ? ` · ${selected.title} tier` : ""}
              </span>
            ) : null}
          </label>
        </div>
      </div>

      {/* Step 2: who you are */}
      <div>
        <StepLabel n={2}>Who I should thank</StepLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
              className={`mt-1 ${field}`}
              placeholder="First name is fine"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={`mt-1 ${field}`}
              placeholder="So I can follow up on what you asked for"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-ink-soft)]">
          <label className="inline-flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="display_as"
              checked={displayAs === "name"}
              onChange={() => setDisplayAs("name")}
              className="h-5 w-5"
            />
            Show my name on the Fuel wall
          </label>
          <label className="inline-flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="display_as"
              checked={displayAs === "anonymous"}
              onChange={() => setDisplayAs("anonymous")}
              className="h-5 w-5"
            />
            Keep me anonymous
          </label>
        </div>
      </div>

      {/* Step 3: what you want */}
      <div>
        <StepLabel n={3}>
          {selected?.askLabel ?? "Anything you want me to know"}
          {askRequired ? <span className="text-[var(--color-accent)]"> · required</span> : <span className="font-normal normal-case tracking-normal text-[var(--color-muted)]"> (optional)</span>}
        </StepLabel>
        <textarea
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          maxLength={1800}
          rows={4}
          data-fuel-ask
          className={`mt-3 ${field}`}
          placeholder={
            askRequired
              ? "Be specific. Names of public actors, dates, records, links."
              : "A question, a topic, a note. Or nothing."
          }
        />
        <label className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-ink-soft)]">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="h-5 w-5" />
          Ryan may publish my note on the wall
        </label>
      </div>

      {/* The deal, restated right above the button */}
      {haveAmount ? (
        <div className="rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60 p-4 sm:p-5" data-fuel-summary>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-navy)]">The deal</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
            {usdWhole(amountCents)}
            {duration ? <span className="text-[var(--color-ink-soft)]"> buys {duration}.</span> : null}
          </p>
          {earned.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink)]">
              {earned.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="text-[var(--color-accent)]" aria-hidden>
                    ✓
                  </span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Below the first tier: my thanks, in writing, and every tank counts.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={busy || !paymentsConfigured}
          data-fuel-submit
          className="btn-accent min-h-14 w-full rounded-lg px-6 py-3 text-lg font-black disabled:opacity-60 sm:w-auto sm:min-w-[20rem]"
        >
          {busy
            ? "Opening Stripe…"
            : paymentsConfigured
              ? `Fuel ${haveAmount ? usdWhole(amountCents) : "the machine"} →`
              : "Payments open soon"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          Secure checkout by Stripe. No account to make. Receipt by email. The money goes to Ryan Nichols directly.
        </p>
      </div>
    </form>
  );
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-navy)] text-[11px] font-black text-[var(--color-paper)]">
        {n}
      </span>
      <span>{children}</span>
    </p>
  );
}
