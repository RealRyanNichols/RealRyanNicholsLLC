"use client";

import { useState } from "react";

// Universal share-rail component. Takes a URL + title and exposes
// one-click intents into the platforms a J6 audience actually uses:
// X, Truth Social, Telegram, Facebook, email, and copy-link. Each
// button opens the platform's official share intent in a new tab —
// no third-party JS, no tracking pixels, no cookies set by us.

export function ShareRail({
  url,
  title,
  variant = "rail",
}: {
  url: string;
  title: string;
  variant?: "rail" | "compact";
}) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links: Array<{ label: string; href: string; icon: string }> = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      icon: "𝕏",
    },
    {
      label: "Truth Social",
      href: `https://truthsocial.com/share?text=${enc(`${title}\n\n${url}`)}`,
      icon: "🇺🇸",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: "f",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
      icon: "✈",
    },
    {
      label: "Email",
      href: `mailto:?subject=${enc(title)}&body=${enc(`${title}\n\n${url}`)}`,
      icon: "✉",
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — older browsers without async clipboard
    }
  }

  return (
    <div
      className={[
        "rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] flex flex-wrap items-center gap-2",
        variant === "rail" ? "p-3" : "p-2",
      ].join(" ")}
      role="group"
      aria-label="Share this page"
    >
      <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] pl-1 pr-2">
        Share this →
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] px-3 py-1.5 text-xs font-bold transition"
        >
          <span aria-hidden className="text-base leading-none">
            {l.icon}
          </span>
          <span>{l.label}</span>
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
