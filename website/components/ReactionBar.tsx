"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const SESSION_KEY = "rn_session_id";

// Shares the same anonymous session id the page tracker uses, so a
// visitor's reactions are tied to their session with zero signup.
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      ).replace(/-/g, "");
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

type Kind =
  | "amen" | "pray" | "support" | "fire"
  | "flag" | "salute" | "laugh" | "sad" | "mad";

const KINDS: { kind: Kind; icon: string; label: string }[] = [
  { kind: "fire", icon: "🔥", label: "Fire" },
  { kind: "salute", icon: "🫡", label: "Salute" },
  { kind: "flag", icon: "🇺🇸", label: "USA" },
  { kind: "pray", icon: "🕊️", label: "Pray" },
  { kind: "amen", icon: "🙏", label: "Amen" },
  { kind: "support", icon: "🤝", label: "Support" },
  { kind: "mad", icon: "😡", label: "Outraged" },
  { kind: "sad", icon: "😢", label: "Heartbroken" },
  { kind: "laugh", icon: "😂", label: "Laugh" },
];

type Payload = {
  counts: Partial<Record<Kind, number>>;
  mine: Kind[];
  total: number;
};

export type ReactionTargetType =
  | "post" | "person" | "grievance" | "event" | "document" | "evidence" | "page";

export function ReactionBar({
  targetType,
  targetId,
  seed,
  prompt = "Tap how this hits you — no signup, everyone sees the count",
}: {
  targetType: ReactionTargetType;
  targetId: string;
  seed?: Payload;
  prompt?: string;
}) {
  const [counts, setCounts] = useState<Partial<Record<Kind, number>>>(
    seed?.counts ?? {},
  );
  const [mine, setMine] = useState<Set<Kind>>(new Set(seed?.mine ?? []));
  const [total, setTotal] = useState<number>(seed?.total ?? 0);
  const sid = useRef<string>("");

  const apply = useCallback((p: Payload) => {
    setCounts(p.counts ?? {});
    setMine(new Set(p.mine ?? []));
    setTotal(p.total ?? 0);
  }, []);

  useEffect(() => {
    sid.current = getSessionId();
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("er_get", {
        p_target_type: targetType,
        p_target_id: targetId,
        p_session_id: sid.current,
      })
      .then(({ data }) => {
        if (data) apply(data as Payload);
      });
  }, [targetType, targetId, apply]);

  const toggle = useCallback(
    async (kind: Kind) => {
      const had = mine.has(kind);
      // Optimistic update.
      setMine((prev) => {
        const n = new Set(prev);
        if (had) n.delete(kind);
        else n.add(kind);
        return n;
      });
      setCounts((prev) => ({
        ...prev,
        [kind]: Math.max(0, (prev[kind] ?? 0) + (had ? -1 : 1)),
      }));
      setTotal((t) => Math.max(0, t + (had ? -1 : 1)));

      if (!sid.current) sid.current = getSessionId();
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("er_toggle", {
        p_target_type: targetType,
        p_target_id: targetId,
        p_kind: kind,
        p_session_id: sid.current,
      });
      if (data) apply(data as Payload);
    },
    [mine, targetType, targetId, apply],
  );

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
          {prompt}
        </p>
        {total > 0 ? (
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] tabular-nums whitespace-nowrap">
            {total.toLocaleString()} {total === 1 ? "reaction" : "reactions"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map(({ kind, icon, label }) => {
          const n = counts[kind] ?? 0;
          const active = mine.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => toggle(kind)}
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-sm transition select-none",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-bold"
                  : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              <span aria-hidden className="text-base leading-none">{icon}</span>
              {n > 0 ? (
                <span className="text-xs font-mono tabular-nums">{n}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
