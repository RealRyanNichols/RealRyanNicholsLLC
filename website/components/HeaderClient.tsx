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

type Door = { href: string; label: string; desc: string };
type MoreLink = { href: string; label: string; desc: string };

// Four clear doors — the whole primary navigation. No mega-menus, no slider.
const DOORS: Door[] = [
  { href: "/", label: "Feed", desc: "Posts, video, and receipts" },
  { href: "/case", label: "Case", desc: "Timeline, people, documents" },
  { href: "/videos", label: "Watch", desc: "Video drops and live" },
  {
    href: "/tell-your-story",
    label: "Tell Your Story",
    desc: "Get it off your chest — anonymous ok",
  },
];

// Everything secondary lives behind one compact "More" menu (and the footer).
const MORE: MoreLink[] = [
  { href: "/start-here", label: "Start Here", desc: "New here? Get oriented in 60 seconds" },
  { href: "/tools", label: "Free Tools", desc: "Records request, timeline, next moves" },
  { href: "/submit", label: "Tip Line", desc: "Send records, names, or links" },
  { href: "/the-map-room", label: "Map Room", desc: "Live public-record dashboard" },
  { href: "/live", label: "Live", desc: "Streams and real-time discussion" },
  { href: "/services", label: "Services", desc: "Find the right paid help" },
  { href: "/store", label: "Store", desc: "Flat-fee calls, audits, builds" },
  { href: "/case/intake", label: "Public Ledger", desc: "See and verify incoming leads" },
  { href: "/contact", label: "Private Contact", desc: "Send sensitive details privately" },
];

const MOBILE_ADMIN_LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/new", label: "New Post" },
  { href: "/admin/live", label: "Live Room" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderClient({ avatarUrl, signedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");
  const officeHref = isAdmin ? "/admin" : "/account";
  const officeLabel = isAdmin ? "Admin Office" : "My Office";

  // Close menus on route change.
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close the desktop "More" menu on an outside click.
  useEffect(() => {
    if (!moreOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest?.("[data-more-menu]")) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [moreOpen]);

  // Escape closes everything; lock body scroll while the mobile drawer is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMoreOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.dataset.mobileMenuOpen = "true";
    } else {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
    };
  }, [open]);

  return (
    <>
      {!isAdminPath ? <HeaderStatusStrip /> : null}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
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
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-[var(--color-accent-glow)]"
                priority
                unoptimized={avatarUrl.startsWith("http")}
              />
            ) : (
              <span
                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-[var(--color-paper)] ring-2 ring-[var(--color-accent-glow)]"
                aria-hidden
              >
                RN
              </span>
            )}
            <span className="truncate text-sm font-bold tracking-tight text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)] min-[360px]:text-base">
              Ryan Nichols
            </span>
          </Link>

          {/* Desktop: the four doors + one compact More + Donate. */}
          <nav data-desktop-nav className="hidden items-center gap-1 text-sm lg:flex">
            {DOORS.map((d) => (
              <NavLink key={d.href} href={d.href} active={isActive(pathname, d.href)}>
                {d.label}
              </NavLink>
            ))}

            <div className="relative" data-more-menu>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={[
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium transition",
                  moreOpen
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
                ].join(" ")}
              >
                More
                <Chevron open={moreOpen} />
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-[min(34rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-line)] bg-[#101a31]/98 p-3 text-[var(--color-paper)] shadow-2xl backdrop-blur-xl"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MORE.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        role="menuitem"
                        className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-[#d8c89e] hover:bg-white/10"
                      >
                        <span className="block font-black text-[#fdf8ea]">{m.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-[#cfd9ea]">
                          {m.desc}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/support"
              className="btn-support ml-1 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold"
            >
              Donate
            </Link>
            {signedIn ? (
              <Link
                href={officeHref}
                className={[
                  "ml-1 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-black transition",
                  isAdmin
                    ? "border-2 border-[#e1bd5b] bg-[#071126] text-[#e1bd5b] hover:bg-[#e1bd5b] hover:text-[#071126]"
                    : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                ].join(" ")}
                aria-label={officeLabel}
              >
                {officeLabel}
              </Link>
            ) : null}
            {!signedIn ? (
              <Link
                href="/login?mode=signup"
                className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Join
              </Link>
            ) : null}
          </nav>

          {/* Touch/tablet — Donate (always visible) + hamburger. */}
          <div className="flex shrink-0 items-center gap-1.5 min-[360px]:gap-2 lg:hidden">
            <Link
              href="/support"
              className="btn-support inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-semibold min-[360px]:px-4"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile drawer — four doors, Donate, then a short More list. */}
        {open ? (
          <div
            id="mobile-menu"
            role="dialog"
            aria-label="Site menu"
            className="absolute left-0 right-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--color-line)] bg-[#101a31]/98 px-4 py-4 text-[var(--color-paper)] shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                  Four doors. No maze.
                </p>
                <Link
                  href={signedIn ? officeHref : "/login?mode=signup"}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-normal text-[#fdf8ea] transition hover:bg-white/10"
                >
                  {signedIn ? officeLabel : "Join"}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DOORS.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    className={[
                      "min-h-[5rem] rounded-lg border px-3 py-3 transition",
                      isActive(pathname, d.href)
                        ? "border-[#e1bd5b] bg-[#e1bd5b]/12"
                        : "border-white/10 bg-white/5 hover:border-[#d8c89e] hover:bg-white/10",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-black leading-tight text-[#fdf8ea]">
                      {d.label}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold leading-snug text-[#cfd9ea]">
                      {d.desc}
                    </span>
                  </Link>
                ))}
              </div>

              <Link
                href="/support"
                className="btn-support flex min-h-12 items-center justify-center rounded-lg px-4 py-3 text-sm font-black"
              >
                Donate / Support the Work
              </Link>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                  More
                </p>
                <div className="grid gap-1.5">
                  {MORE.map((m) => (
                    <Link
                      key={m.href}
                      href={m.href}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[#fdf8ea] transition hover:border-[#d8c89e] hover:bg-white/10"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black leading-tight">
                          {m.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] font-semibold leading-snug text-[#cfd9ea]">
                          {m.desc}
                        </span>
                      </span>
                      <span className="text-lg leading-none text-[#d8c89e]" aria-hidden>
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {isAdmin ? (
                <details className="rounded-lg border border-[#e1bd5b]/30 bg-[#e1bd5b]/10">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-black text-[#fdf8ea] [&::-webkit-details-marker]:hidden">
                    Admin shortcuts
                    <span className="text-[#e1bd5b]" aria-hidden>
                      +
                    </span>
                  </summary>
                  <div className="grid grid-cols-2 gap-1.5 border-t border-[#e1bd5b]/20 p-2">
                    {MOBILE_ADMIN_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-xs font-black text-[#fdf8ea] transition hover:border-[#d8c89e] hover:bg-white/10"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      {/* Mobile menu backdrop — tap to close. */}
      {open ? (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
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
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-md px-2.5 py-1.5 font-medium transition",
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
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
