"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function BuyButton({
  slug,
  label = "Buy now",
  className,
}: {
  slug: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    trackEvent("checkout_start", { slug });
    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ slug, qty: 1 }] }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = j.url;
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={
          className ??
          "btn-accent w-full rounded-full px-6 py-3 text-base font-bold transition disabled:opacity-60"
        }
      >
        {busy ? "Starting…" : label}
      </button>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
