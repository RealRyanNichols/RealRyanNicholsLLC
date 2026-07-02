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
type Offer = { href: string; label: string };

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

// The two things we sell — surfaced as buttons, never buried in a maze.
const OFFERS: Offer[] = [
  { href: "/book", label: "The Book" },
  { href: "/services", label: "Work With Me" },
];

const MOBILE_ADMIN_LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/new", label: "New Post" },
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/live", label: "Live Room" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderClient({ avatarUrl, signedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");
  const officeHref = isAdmin ? "/admin" : "/account";
  const officeLabel = isAdmin ? "Admin Office" : "My Office";

  // Close the menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes everything; lock body scroll while the mobile drawer is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
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
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-[var(--color-line)]"
                priority
                unoptimized={avatarUrl.startsWith("http")}
              />
            ) : (
              <span
                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--color-navy)] bg-transparent font-display text-sm font-bold text-[var(--color-navy)]"
                aria-hidden
              >
                RN
              </span>
            )}
            <span className="truncate text-sm font-bold tracking-tight text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)] min-[360px]:text-base">
              Ryan Nichols
            </span>
          </Link>

          {/* Desktop: the four doors + the two offers + Talk/Join. */}
          <nav data-desktop-nav className="hidden items-center gap-1 text-sm xl:flex">
            {DOORS.map((d) => (
              <NavLink key={d.href} href={d.href} active={isActive(pathname, d.href)}>
                {d.label}
              </NavLink>
            ))}

            <Link
              href="/search"
              aria-label="Search"
              aria-current={isActive(pathname, "/search") ? "page" : undefined}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-soft)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            >
              <MagnifierIcon />
            </Link>

            {OFFERS.map((o) => (
              <NavLink key={o.href} href={o.href} active={isActive(pathname, o.href)}>
                {o.label}
              </NavLink>
            ))}

            <Link
              href="/#talk"
              className="btn-accent ml-2 inline-flex items-center px-4 py-1.5 text-xs"
            >
              Talk to Ryan
            </Link>
            <Link
              href="/#join"
              className="btn-support ml-2 inline-flex items-center py-1.5 text-xs"
            >
              Join
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/new"
                className="ml-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-navy)] hover:decoration-[var(--color-navy)]"
                aria-label="Write a new post"
              >
                <PencilIcon />
                New Post
              </Link>
            ) : null}
            {signedIn ? (
              <Link
                href={officeHref}
                className="ml-3 inline-flex items-center text-xs font-medium text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-navy)] hover:decoration-[var(--color-navy)]"
                aria-label={officeLabel}
              >
                {officeLabel}
              </Link>
            ) : null}
            {!signedIn ? (
              <Link
                href="/login"
                className="ml-3 inline-flex items-center text-xs font-medium text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-navy)] hover:decoration-[var(--color-navy)]"
              >
                Sign in
              </Link>
            ) : null}
          </nav>

          {/* Touch/tablet — Join (always visible) + hamburger. */}
          <div className="flex shrink-0 items-center gap-1.5 min-[360px]:gap-2 xl:hidden">
            <Link
              href="/search"
              aria-label="Search"
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] min-[360px]:inline-flex"
            >
              <MagnifierIcon />
            </Link>
            <Link
              href="/#join"
              className="btn-support inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-semibold min-[360px]:px-4"
            >
              Join
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

        {/* Mobile drawer — four doors, the offers, then a short More list. */}
        {open ? (
          <div
            id="mobile-menu"
            role="dialog"
            aria-label="Site menu"
            className="absolute left-0 right-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--color-line)] bg-[#101a31]/98 px-4 py-4 text-[var(--color-paper)] shadow-2xl backdrop-blur-xl xl:hidden"
          >
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                  Four doors. No maze.
                </p>
                <Link
                  href={signedIn ? officeHref : "/login"}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-normal text-[#fdf8ea] transition hover:bg-white/10"
                >
                  {signedIn ? officeLabel : "Sign in"}
                </Link>
              </div>

              <Link
                href="/#talk"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-lg bg-[#e1bd5b] px-4 py-3 text-sm font-bold text-[#071126] transition hover:brightness-105"
              >
                Talk to Ryan
              </Link>

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

              {isAdmin ? (
                <Link
                  href="/admin/new"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#e1bd5b]/60 px-4 py-3 text-sm font-bold text-[#e1bd5b] transition hover:bg-[#e1bd5b]/10"
                >
                  <PencilIcon />
                  New Post
                </Link>
              ) : null}

              <Link
                href="/#join"
                className="btn-support flex min-h-12 items-center justify-center rounded-lg px-4 py-3 text-sm font-black"
              >
                Join — get it in your inbox
              </Link>

              <div className="grid grid-cols-2 gap-2">
                {OFFERS.map((o) => (
                  <Link
                    key={o.href}
                    href={o.href}
                    className="flex min-h-12 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-3 text-center text-sm font-black text-[#fdf8ea] transition hover:border-[#d8c89e] hover:bg-white/10"
                  >
                    {o.label}
                  </Link>
                ))}
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
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm xl:hidden"
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
        "whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium transition",
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
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

function MagnifierIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
