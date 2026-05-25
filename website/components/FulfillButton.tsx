"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FulfillButton({
  orderId,
  fulfilled,
}: {
  orderId: string;
  fulfilled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/orders/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, fulfilled: !fulfilled }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className="rounded-lg border-2 border-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition disabled:opacity-60"
    >
      {busy ? "…" : fulfilled ? "Mark unfulfilled" : "Mark fulfilled"}
    </button>
  );
}
