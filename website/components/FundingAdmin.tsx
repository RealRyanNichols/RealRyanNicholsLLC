"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  label: string;
  blurb: string | null;
  amount_cents: number;
  cadence: "monthly" | "one_time";
  sort_order: number;
  is_active: boolean;
};

type Settings = {
  campaign_title: string;
  campaign_blurb: string | null;
  manual_raised_cents: number;
  manual_note: string | null;
  show_amounts: boolean;
};

async function post(body: unknown): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/funding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      return j.error ?? "Failed.";
    }
    return null;
  } catch {
    return "Network error.";
  }
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";

export function FundingAdmin({
  initialItems,
  initialSettings,
  goalCents,
  raisedCents,
}: {
  initialItems: Item[];
  initialSettings: Settings;
  goalCents: number;
  raisedCents: number;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold tracking-tight mb-1">Funding goal</h2>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        The transparent monthly budget shown on /support. Goal{" "}
        <strong>${(goalCents / 100).toLocaleString()}</strong> · raised this month{" "}
        <strong>${(raisedCents / 100).toLocaleString()}</strong>.
      </p>

      <SettingsForm initial={initialSettings} />

      <ImportStripeButton />

      <div className="mt-6 rounded-2xl border border-[var(--color-line)]">
        <div className="px-4 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
          Line items
        </div>
        <div className="divide-y divide-[var(--color-line)]">
          {initialItems.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
          <ItemRow />
        </div>
      </div>
    </section>
  );
}

function ImportStripeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const money = (c: number) => "$" + (c / 100).toLocaleString();
    try {
      const res = await fetch("/api/admin/funding/import-stripe", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        recorded?: number;
        recorded_cents?: number;
        untracked_paid?: number;
        untracked_paid_cents?: number;
      };
      if (!res.ok) {
        setMsg(j.error ?? "Import failed.");
        setBusy(false);
        return;
      }
      let m = `Imported ${j.recorded ?? 0} donation${j.recorded === 1 ? "" : "s"} (${money(
        j.recorded_cents ?? 0,
      )}) this month.`;
      if ((j.untracked_paid ?? 0) > 0) {
        m += ` Heads up: ${j.untracked_paid} other paid charge${
          j.untracked_paid === 1 ? "" : "s"
        } (${money(
          j.untracked_paid_cents ?? 0,
        )}) had no donation tag — if those were gifts, add them to the offline field above.`;
      }
      setMsg(m);
      router.refresh();
    } catch {
      setMsg("Network error.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-line)] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Import this month&apos;s Stripe donations
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            Pulls completed card donations from Stripe onto the meter. Safe to run anytime —
            it never double-counts.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="whitespace-nowrap rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import from Stripe"}
        </button>
      </div>
      {msg ? (
        <p className="mt-2 text-xs font-semibold text-[var(--color-ink-soft)]">{msg}</p>
      ) : null}
    </div>
  );
}

function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.campaign_title);
  const [blurb, setBlurb] = useState(initial.campaign_blurb ?? "");
  const [manual, setManual] = useState(String((initial.manual_raised_cents ?? 0) / 100));
  const [note, setNote] = useState(initial.manual_note ?? "");
  const [showAmounts, setShowAmounts] = useState(initial.show_amounts);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const err = await post({
      action: "save_settings",
      campaign_title: title,
      campaign_blurb: blurb,
      manual_raised_cents: Math.max(0, Math.round(parseFloat(manual || "0") * 100)),
      manual_note: note,
      show_amounts: showAmounts,
    });
    setBusy(false);
    setMsg(err ?? "Saved.");
    if (!err) router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] p-4 space-y-3">
      <div>
        <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Campaign title</label>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Blurb</label>
        <textarea className={inputCls} rows={2} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">
            Offline / untracked raised this month ($)
          </label>
          <input
            className={inputCls}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Add cash, checks, and payment-link gifts here so the meter stays honest. Card
            donations through native checkout count automatically.
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Counting note (public)</label>
          <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <input
          type="checkbox"
          checked={showAmounts}
          onChange={(e) => setShowAmounts(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Show dollar amounts publicly (off = show only a progress bar + %)
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save campaign settings"}
        </button>
        {msg ? <span className="text-xs font-semibold text-[var(--color-ink-soft)]">{msg}</span> : null}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item?: Item }) {
  const router = useRouter();
  const isNew = !item;
  const [label, setLabel] = useState(item?.label ?? "");
  const [blurb, setBlurb] = useState(item?.blurb ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount_cents / 100) : "");
  const [cadence, setCadence] = useState<"monthly" | "one_time">(item?.cadence ?? "monthly");
  const [sort, setSort] = useState(String(item?.sort_order ?? 0));
  const [active, setActive] = useState(item?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!label.trim()) {
      setMsg("Label required.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const err = await post({
      action: "upsert_item",
      ...(item ? { id: item.id } : {}),
      label,
      blurb,
      amount_cents: Math.max(0, Math.round(parseFloat(amount || "0") * 100)),
      cadence,
      sort_order: Math.max(0, parseInt(sort || "0", 10) || 0),
      is_active: active,
    });
    setBusy(false);
    if (err) {
      setMsg(err);
      return;
    }
    if (isNew) {
      setLabel("");
      setBlurb("");
      setAmount("");
      setSort("0");
    }
    router.refresh();
  }

  async function remove() {
    if (!item) return;
    setBusy(true);
    const err = await post({ action: "delete_item", id: item.id });
    setBusy(false);
    if (err) {
      setMsg(err);
      return;
    }
    router.refresh();
  }

  return (
    <div className={["p-4 grid gap-2 sm:grid-cols-12 items-start", isNew ? "bg-[var(--color-surface)]" : ""].join(" ")}>
      <div className="sm:col-span-4">
        <input className={inputCls} placeholder={isNew ? "New line item label" : "Label"} value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className={`${inputCls} mt-1`} placeholder="Short blurb (optional)" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <input className={inputCls} placeholder="$ / mo" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <select className={inputCls} value={cadence} onChange={(e) => setCadence(e.target.value as "monthly" | "one_time")}>
          <option value="monthly">monthly</option>
          <option value="one_time">one-time</option>
        </select>
      </div>
      <div className="sm:col-span-1">
        <input className={inputCls} placeholder="#" inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value)} />
      </div>
      <div className="sm:col-span-3 flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
          active
        </label>
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {isNew ? "Add" : "Save"}
        </button>
        {!isNew ? (
          <button type="button" onClick={remove} disabled={busy} className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] disabled:opacity-50">
            Delete
          </button>
        ) : null}
        {msg ? <span className="text-[11px] font-semibold text-[var(--color-accent)]">{msg}</span> : null}
      </div>
    </div>
  );
}
