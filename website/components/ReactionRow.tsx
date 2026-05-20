"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Kind = "amen" | "pray" | "support";

const KINDS: { kind: Kind; label: string; icon: string }[] = [
  { kind: "amen", label: "Amen", icon: "🙏" },
  { kind: "pray", label: "Pray", icon: "🕊️" },
  { kind: "support", label: "Support", icon: "🤝" },
];

export function ReactionRow({
  postId,
  initialCounts,
  initialUserReactions,
  signedIn,
  size = "md",
}: {
  postId: string;
  initialCounts: Record<Kind, number>;
  initialUserReactions: Kind[];
  signedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [counts, setCounts] = useState(initialCounts);
  const [mine, setMine] = useState<Set<Kind>>(new Set(initialUserReactions));
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    setCounts(initialCounts);
    setMine(new Set(initialUserReactions));
  }, [initialCounts, initialUserReactions]);

  async function toggle(kind: Kind) {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const isOn = mine.has(kind);
    // Optimistic UI
    setMine((prev) => {
      const next = new Set(prev);
      if (isOn) next.delete(kind);
      else next.add(kind);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [kind]: Math.max(0, (prev[kind] ?? 0) + (isOn ? -1 : 1)),
    }));

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      if (isOn) {
        await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", uid)
          .eq("kind", kind);
      } else {
        await supabase
          .from("reactions")
          .insert({ post_id: postId, user_id: uid, kind });
      }
    });
  }

  const btnBase =
    size === "sm"
      ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
      : "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition";

  return (
    <div className={size === "sm" ? "flex gap-1.5 flex-wrap" : "flex gap-2 flex-wrap"}>
      {KINDS.map(({ kind, label, icon }) => {
        const isOn = mine.has(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => toggle(kind)}
            disabled={busy}
            aria-pressed={isOn}
            className={[
              btnBase,
              isOn
                ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            ].join(" ")}
          >
            <span aria-hidden>{icon}</span>
            <span>{label}</span>
            {counts[kind] > 0 && (
              <span className="ml-1 tabular-nums text-xs">
                {counts[kind]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
