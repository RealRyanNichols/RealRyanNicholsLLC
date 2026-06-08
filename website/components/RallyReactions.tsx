"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Reaction = { emoji: string; label: string; count: number };

// Tap-to-react: floating emoji bursts + a live shared counter per emoji.
// Low-stakes morale meter (FB-live / TikTok style).
export function RallyReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const lastTap = useRef(0);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const { data } = await supabase.rpc("get_rally_reactions");
      if (mounted && Array.isArray(data)) setReactions(data as Reaction[]);
    }
    void pull();
    const id = window.setInterval(pull, 25_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  function floatEmoji(emoji: string, el: HTMLElement) {
    if (typeof document === "undefined") return;
    const rect = el.getBoundingClientRect();
    const span = document.createElement("span");
    span.textContent = emoji;
    span.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top}px;font-size:22px;pointer-events:none;z-index:80;will-change:transform,opacity;`;
    document.body.appendChild(span);
    const drift = (Math.random() - 0.5) * 70;
    const start = performance.now();
    function f(now: number) {
      const t = (now - start) / 900;
      span.style.transform = `translate(${drift * t}px, ${-95 * t}px) scale(${1 + 0.5 * t})`;
      span.style.opacity = String(Math.max(0, 1 - t));
      if (t < 1) requestAnimationFrame(f);
      else span.remove();
    }
    requestAnimationFrame(f);
  }

  async function react(emoji: string, e: React.MouseEvent<HTMLButtonElement>) {
    const now = Date.now();
    if (now - lastTap.current < 120) return; // light debounce
    lastTap.current = now;
    floatEmoji(emoji, e.currentTarget);
    setReactions((rs) => rs.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)));
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.rpc("bump_rally_reaction", { p_emoji: emoji });
    if (Array.isArray(data)) setReactions(data as Reaction[]);
  }

  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={(e) => react(r.emoji, e)}
          aria-label={r.label}
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 transition hover:border-[#e1bd5b]/50 hover:bg-white/[0.08] active:scale-95"
        >
          <span className="text-base transition group-active:scale-125">{r.emoji}</span>
          <span className="text-xs font-black tabular-nums text-[#cfd9ea]">
            {r.count.toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
}
