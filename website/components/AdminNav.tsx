"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped admin sections. On desktop this is a readable vertical sidebar
// (every section visible at once); on mobile it's a compact wrapping bar
// (no horizontal scrolling, nothing hidden off-screen).
const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  { label: "Money", items: [{ href: "/admin/donations", label: "Donations" }] },
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
      { href: "/admin/new", label: "New post" },
      { href: "/admin/live", label: "Live" },
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
    label: "Case & people",
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
    <>
      {/* Mobile: compact wrapping bar — everything visible, no slider */}
      <div className="lg:hidden sticky top-16 z-20 -mx-4 mb-5 border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-xl px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] font-bold mb-2">
          Admin
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.flatMap((g) => g.items).map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                isActive(it.href)
                  ? "bg-[var(--color-accent)] text-[var(--color-paper)]"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
              ].join(" ")}
            >
              {it.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: readable vertical sidebar — all sections at a glance */}
      <nav className="hidden lg:block lg:sticky lg:top-20 text-sm">
        <p className="px-3 mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Admin
        </p>
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={[
                      "block rounded-lg px-3 py-2 font-semibold transition",
                      isActive(it.href)
                        ? "bg-[var(--color-accent)] text-[var(--color-paper)]"
                        : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
