"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped admin sections. Kept short + scannable so the bar reads at a
// glance and works as a horizontal scroller on mobile.
const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Money",
    items: [{ href: "/admin/donations", label: "Donations" }],
  },
  {
    label: "Audience",
    items: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/admin/posts", label: "Posts" },
      { href: "/admin/new", label: "+ New" },
    ],
  },
  {
    label: "Inbox",
    items: [
      { href: "/admin/tips", label: "Tips" },
      { href: "/admin/submissions", label: "Submissions" },
      { href: "/admin/claims", label: "J6 claims" },
    ],
  },
  {
    label: "Case + people",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/case", label: "Case docs" },
      { href: "/admin/imports", label: "Imports" },
    ],
  },
  {
    label: "Media",
    items: [
      { href: "/admin/og-images", label: "OG images" },
      { href: "/admin/profile", label: "Profile photos" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Admin sections"
      className="sticky top-16 z-20 -mx-4 mb-6 border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-xl px-4"
    >
      <div className="mx-auto max-w-6xl flex items-stretch gap-1 overflow-x-auto py-2 no-scrollbar">
        {GROUPS.map((g, gi) => (
          <div key={g.label} className="flex items-center gap-1">
            {gi > 0 ? (
              <span className="mx-1 h-5 w-px bg-[var(--color-line)] flex-shrink-0" aria-hidden />
            ) : null}
            <span className="text-[9px] uppercase tracking-wider text-[var(--color-muted)] font-bold px-1 hidden sm:inline whitespace-nowrap">
              {g.label}
            </span>
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition",
                    active
                      ? "bg-[var(--color-accent)] text-[var(--color-paper)]"
                      : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
