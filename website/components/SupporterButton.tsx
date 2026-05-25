"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Behind the native-checkout flag: starts a Stripe subscription Checkout
// Session via /api/checkout/supporter. With the flag off, opens the existing
// hosted Payment Link so production stays unbroken.
export function SupporterButton({ supporterUrl }: { supporterUrl?: string }) {
  const native = process.env.NEXT_PUBLIC_STRIPE_NATIVE_CHECKOUT === "1";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    trackEvent("supporter_click", { native });
    if (!native) {
      if (supporterUrl) window.open(supporterUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout/supporter", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Could not start membership.");
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
    <div className="relative mt-5">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        data-track="supporter-checkout"
        className="inline-flex items-center rounded-full bg-amber-600 hover:bg-amber-500 px-6 py-2.5 text-sm font-bold text-[#1a1308] transition disabled:opacity-60"
      >
        {busy ? "Starting…" : "Start Supporter Membership →"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
