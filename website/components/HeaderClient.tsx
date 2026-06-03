"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { HeaderStatusStrip } from "@/components/HeaderStatusStrip";

type Props = {
  avatarUrl: string | null;
  signedIn: boolean;
  isAdmin: boolean;
};

// Public nav. Condensed into a few top-level slots so it doesn't smoosh:
// case-related views fold under "The Case", media folds under "Watch".
// Donate is a permanent CTA chip; admin/+new/account append.
type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
  return (e as NavGroup).items !== undefined;
}

// The path portion of an href (drops any query string) for active-state checks.
function hrefPath(href: string): string {
  return href.split("?")[0];
}

// Four lean top-level slots so the desktop bar never smooshes against the
// Donate / auth chips. Everything else folds into "The Case" and "More".
// Submit-a-Tip stays prominent (it's the newsroom tip line) but lives under
// More on desktop and gets its own row in the mobile drawer below.
const NAV: NavEntry[] = [
  { href: "/", label: "Feed" },
  {
    label: "The Case",
    items: [
      { href: "/case", label: "J6 Case overview" },
      { href: "/case?view=people&filter=unclaimed", label: "All J6 defendants" },
      { href: "/the-map-room", label: "The Map Room" },
      { href: "/fights", label: "The Fights" },
    ],
  },
  {
    label: "Watch",
    items: [
      { href: "/live", label: "Live now" },
      { href: "/videos", label: "Videos" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/submit", label: "Submit a Tip" },
      { href: "/contact", label: "Private Contact" },
      { href: "/services", label: "Services" },
      { href: "/own-your-feed", label: "Own your feed" },
      { href: "/store", label: "Services store" },
      { href: "/about", label: "About" },
    ],
  },
];

export function HeaderClient({ avatarUrl, signedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Close any open desktop dropdown on an outside click.
  useEffect(() => {
    if (!openDropdown) return;
    function onDocClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest?.("[data-nav-dropdown]")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openDropdown]);

  // Close menu on escape, lock body scroll when open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener("keydown", onKey);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Techy: monospace status strip above the nav showing live
          counters from the Map Room RPCs. Polls every 30s in the
          background so the chrome itself signals "this is a live
          system" before you even scroll. */}
      <HeaderStatusStrip />
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-h-11 min-w-0 items-center gap-2.5"
            aria-label={`${SITE.name} — Home`}
            onClick={() => setOpen(false)}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                aria-hidden
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--color-accent-glow)] flex-shrink-0"
                priority
                unoptimized={avatarUrl.startsWith("http")}
              />
            ) : (
              <span
                className="inline-flex h-9 w-9 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] items-center justify-center text-sm font-bold ring-2 ring-[var(--color-accent-glow)] flex-shrink-0"
                aria-hidden
              >
                RN
              </span>
            )}
            <span className="font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition truncate">
              Ryan Nichols
            </span>
          </Link>

          {/* Desktop nav — visible at md+ */}
          <nav data-desktop-nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((n) =>
              isGroup(n) ? (
                <NavDropdown
                  key={n.label}
                  group={n}
                  pathname={pathname}
                  open={openDropdown === n.label}
                  onToggle={() =>
                    setOpenDropdown((cur) => (cur === n.label ? null : n.label))
                  }
                />
              ) : (
                <NavLink key={n.href} href={n.href} active={pathname === n.href}>
                  {n.label}
                </NavLink>
              ),
            )}
            <Link
              href="/support"
              className="btn-accent ml-1 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold"
            >
              Donate
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 inline-flex items-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition"
                aria-label="Admin dashboard"
              >
                Admin
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/new"
                className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
                aria-label="New post"
              >
                + New
              </Link>
            )}
            {signedIn ? (
              <Link
                href="/account"
                className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
              >
                Sign in
              </Link>
            )}
          </nav>

          {/* Mobile — Donate (always visible) + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/support"
              className="btn-accent inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-semibold"
            >
              Donate
            </Link>
            <button
              type="button"
              data-mobile-menu-button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer — anchored to the header's OWN bottom edge
            (absolute top-full) so it tracks the header at any scroll position.
            Hardcoding `top-16` overlapped the header at the top of the page,
            where the (scroll-away) status strip pushes the header below 64px.
            max-h + overflow keeps a long (admin) menu from running off-screen. */}
        {open && (
          <div
            id="mobile-menu"
            role="menu"
            className="md:hidden absolute top-full left-0 right-0 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--color-line)] bg-[var(--color-paper)]/98 backdrop-blur-xl px-4 py-3 shadow-2xl"
          >
            <nav className="flex flex-col gap-1">
              {/* Submit a Tip — kept prominent on mobile (it's the newsroom
                  tip line) even though it folds under "More" on desktop. */}
              <Link
                href="/submit"
                role="menuitem"
                className="block min-h-12 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3 text-base font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
              >
                Submit a Tip
              </Link>
              <Link
                href="/contact"
                role="menuitem"
                className="mt-2 block min-h-12 rounded-lg border border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-4 py-3 text-base font-bold text-[var(--color-blue)] transition hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)]"
              >
                Private Contact
              </Link>
              {NAV.map((n) =>
                isGroup(n) ? (
                  <div key={n.label} className="mt-1">
                    <p className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] font-bold">
                      {n.label}
                    </p>
                    {n.items
                      // /submit and /contact already have prominent CTAs above on mobile.
                      .filter((it) => !["/submit", "/contact"].includes(hrefPath(it.href)))
                      .map((it) => (
                        <Link
                          key={it.href}
                          href={it.href}
                          role="menuitem"
                          className={[
                            "block rounded-lg px-4 py-3 text-base font-semibold transition",
                            pathname === hrefPath(it.href)
                              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                              : "text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]",
                          ].join(" ")}
                        >
                          {it.label}
                        </Link>
                      ))}
                  </div>
                ) : (
                  <Link
                    key={n.href}
                    href={n.href}
                    role="menuitem"
                    className={[
                      "block rounded-lg px-4 py-3 text-base font-semibold transition",
                      pathname === n.href
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]",
                    ].join(" ")}
                  >
                    {n.label}
                  </Link>
                ),
              )}
              <div className="my-2 border-t border-[var(--color-line)]" />
              {isAdmin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition"
                >
                  Admin dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/posts"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  All posts (pin, edit, delete)
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/new"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  + New post
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/live"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Live control room
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/users"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  User moderation
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/claims"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  J6 claims
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/tips"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Tips
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/case"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Upload case document
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/og-images"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  OG images
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/profile"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Profile photos
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/analytics"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Analytics
                </Link>
              )}
              {signedIn ? (
                <Link
                  href="/account"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile menu backdrop — tap to close. Below the header/drawer (z-20),
          above the page and the support bar. */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-2.5 py-1.5 rounded-md font-medium transition",
        active
          ? "text-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  group,
  pathname,
  open,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const active = group.items.some((it) => pathname === hrefPath(it.href));
  return (
    <div className="relative" data-nav-dropdown>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition",
          active || open
            ? "text-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : "text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
        ].join(" ")}
      >
        {group.label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={["h-3.5 w-3.5 transition-transform", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-1 min-w-52 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/98 backdrop-blur-xl p-1 shadow-2xl"
        >
          {group.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              className={[
                "block rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                pathname === hrefPath(it.href)
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]",
              ].join(" ")}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
