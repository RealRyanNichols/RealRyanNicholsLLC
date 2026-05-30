"use client";

import { useRef, useState } from "react";
import { buildShareIntents, recordShare, type CaseKind } from "@/lib/share";
import { ShareReward } from "@/components/ShareReward";

// Universal share-rail. One-click intents into the platforms a J6 audience
// actually mobilises on — X, Truth, Facebook, SMS, Telegram, email, copy-link
// — each opening the platform's official share intent. No third-party JS, no
// tracking pixels. Every completed share IS recorded to our own analytics
// (and, when a slug is supplied, to the durable shares_count counter); prior
// to this the rail recorded nothing, so its shares were invisible.

export function ShareRail({
  url,
  title,
  variant = "rail",
  slug,
  caseKind,
}: {
  url: string;
  title: string;
  variant?: "rail" | "compact";
  slug?: string;
  caseKind?: CaseKind;
}) {
  const [copied, setCopied] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const rewardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fireReward() {
    setRewarded(true);
    if (rewardTimer.current) clearTimeout(rewardTimer.current);
    rewardTimer.current = setTimeout(() => setRewarded(false), 1600);
  }

  const intents = buildShareIntents(url, title).filter((i) =>
    ["X", "Truth", "Facebook", "Text", "Telegram", "Email"].includes(i.name)
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      recordShare({ action: "share_copy", platform: "copy", title, slug, caseKind });
      fireReward();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — older browsers without async clipboard
    }
  }

  return (
    <div
      className={[
        "relative rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] flex flex-wrap items-center gap-2",
        variant === "rail" ? "p-3" : "p-2",
      ].join(" ")}
      role="group"
      aria-label="Share this page"
    >
      <ShareReward show={rewarded} />
      <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] pl-1 pr-2">
        Share this →
      </span>
      {intents.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target={l.scheme ? undefined : "_blank"}
          rel={l.scheme ? undefined : "noopener noreferrer"}
          onClick={() => {
            recordShare({ action: "share_platform", platform: l.name, title, slug, caseKind });
            fireReward();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] px-3 py-1.5 text-xs font-bold transition"
        >
          <span aria-hidden className="text-base leading-none">
            {l.icon}
          </span>
          <span>{l.name === "Text" ? "Text" : l.name}</span>
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
          copied
            ? "border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-paper)]"
            : "border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        ].join(" ")}
      >
        {copied ? "✓ Copied" : "🔗 Copy link"}
      </button>
    </div>
  );
}
