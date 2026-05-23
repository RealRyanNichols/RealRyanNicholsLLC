"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

type Props = {
  avatarUrl: string | null;
  signedIn: boolean;
  isAdmin: boolean;
};

const NAV = [
  { href: "/", label: "Feed" },
  { href: "/the-map-room", label: "Map Room" },
  { href: "/case", label: "J6 Case" },
  { href: "/about", label: "About" },
];

export function HeaderClient({ avatarUrl, signedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close menu on escape, lock body scroll when open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
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
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group min-w-0"
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
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} active={pathname === n.href}>
                {n.label}
              </NavLink>
            ))}
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
              className="btn-accent inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              Donate
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-menu"
            role="menu"
            className="md:hidden fixed top-16 inset-x-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/98 backdrop-blur-xl px-4 py-3 shadow-2xl"
          >
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
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
              ))}
              <div className="my-2 border-t border-[var(--color-line)]" />
              {isAdmin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="block rounded-lg px-4 py-3 text-base font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition"
                >
                  ★ Admin dashboard
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
        </>
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
