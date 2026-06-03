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

type NavItem = {
  href: string;
  label: string;
  desc?: string;
  badge?: string;
  tone?: "red" | "blue" | "green" | "ink";
};
type NavGroup = {
  label: string;
  deck: string;
  items: NavItem[];
};
type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
  return (e as NavGroup).items !== undefined;
}

// The path portion of an href (drops any query string) for active-state checks.
function hrefPath(href: string): string {
  return href.split("?")[0];
}

const DASHBOARD_LINKS: NavItem[] = [
  {
    href: "/tell-your-story",
    label: "Story",
    desc: "Build the pattern",
    badge: "Tell",
    tone: "green",
  },
  {
    href: "/case-review",
    label: "Help Desk",
    desc: "Ask, organize, route",
    badge: "Start",
    tone: "red",
  },
  {
    href: "/submit",
    label: "Tip Line",
    desc: "Send records or leads",
    badge: "Private",
    tone: "blue",
  },
  {
    href: "/the-map-room",
    label: "Map Room",
    desc: "Live case dashboard",
    badge: "Data",
    tone: "green",
  },
  {
    href: "/store",
    label: "Services",
    desc: "Calls, audits, builds",
    badge: "Hire",
    tone: "ink",
  },
];
const MOBILE_PRIMARY_LINKS: NavItem[] = [
  {
    href: "/tell-your-story",
    label: "Tell Your Story",
    desc: "Build the pattern",
    badge: "Start",
    tone: "green",
  },
  {
    href: "/case-review",
    label: "Help Desk",
    desc: "Ask, organize, route",
    badge: "Help",
    tone: "red",
  },
  {
    href: "/submit",
    label: "Tip Line",
    desc: "Send records privately",
    badge: "Private",
    tone: "blue",
  },
  {
    href: "/the-map-room",
    label: "Map Room",
    desc: "Live public record",
    badge: "Live",
    tone: "green",
  },
];

const MOBILE_BROWSE_LINKS: NavItem[] = [
  { href: "/", label: "Feed", desc: "Latest posts and receipts" },
  { href: "/case", label: "Case Hub", desc: "Timeline, documents, people" },
  { href: "/case?view=people&filter=unclaimed", label: "J6 Profiles", desc: "Find and claim profiles" },
  { href: "/fights", label: "The Fights", desc: "Active accountability lanes" },
  { href: "/live", label: "Live", desc: "Streams and discussion" },
  { href: "/videos", label: "Videos", desc: "Public updates" },
  { href: "/store", label: "Services", desc: "Calls, audits, builds" },
  { href: "/contact", label: "Private Contact", desc: "Send a message" },
];

const MOBILE_ADMIN_LINKS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/new", label: "New Post" },
  { href: "/admin/live", label: "Live Room" },
];

const NAV: NavEntry[] = [
  { href: "/", label: "Feed" },
  {
    label: "Case",
    deck: "Records, defendants, filings, and the public map.",
    items: [
      {
        href: "/case",
        label: "Case Hub",
        desc: "Timeline, grievances, documents, people.",
        badge: "Start",
        tone: "red",
      },
      {
        href: "/case?view=people&filter=unclaimed",
        label: "J6 Profiles",
        desc: "Find defendants and claim profiles.",
        badge: "1,500+",
        tone: "blue",
      },
      {
        href: "/the-map-room",
        label: "Map Room",
        desc: "Live dashboard for the public record.",
        badge: "Live",
        tone: "green",
      },
      {
        href: "/fights",
        label: "The Fights",
        desc: "Active public-accountability lanes.",
        badge: "Watch",
        tone: "ink",
      },
    ],
  },
  {
    label: "Help",
    deck: "Send information, get clarity, or contact Ryan privately.",
    items: [
      {
        href: "/tell-your-story",
        label: "Tell Your Story",
        desc: "Build a private story profile Ryan can compare.",
        badge: "Story",
        tone: "green",
      },
      {
        href: "/case-review",
        label: "Guided Help Desk",
        desc: "Answer the first questions and save context.",
        badge: "New",
        tone: "red",
      },
      {
        href: "/submit",
        label: "Submit a Tip",
        desc: "Send links, records, names, dates, proof.",
        badge: "Tip",
        tone: "blue",
      },
      {
        href: "/contact",
        label: "Private Contact",
        desc: "Send sensitive details without posting publicly.",
        badge: "Private",
        tone: "ink",
      },
      {
        href: "/store/strategy-call-30",
        label: "Book Ryan",
        desc: "Paid focused help when you need his time.",
        badge: "$197",
        tone: "green",
      },
    ],
  },
  {
    label: "Watch",
    deck: "Live video, posts, articles, and what is moving now.",
    items: [
      {
        href: "/live",
        label: "Live Now",
        desc: "Streams and real-time discussion.",
        badge: "On",
        tone: "green",
      },
      {
        href: "/videos",
        label: "Videos",
        desc: "Watch the latest public updates.",
        badge: "Watch",
        tone: "blue",
      },
      {
        href: "/",
        label: "Feed",
        desc: "Posts, receipts, and newest updates.",
        badge: "Read",
        tone: "ink",
      },
      {
        href: "/impact",
        label: "Impact",
        desc: "What the site is building and funding.",
        badge: "Proof",
        tone: "red",
      },
    ],
  },
  {
    label: "Work",
    deck: "Services, store, support, and owned-platform tools.",
    items: [
      {
        href: "/services",
        label: "Services Dashboard",
        desc: "Find the right paid help fast.",
        badge: "Pick",
        tone: "red",
      },
      {
        href: "/store",
        label: "Store",
        desc: "Flat-fee calls, audits, and builds.",
        badge: "Buy",
        tone: "blue",
      },
      {
        href: "/own-your-feed",
        label: "Own Your Feed",
        desc: "Bring the audience to your domain.",
        badge: "Build",
        tone: "green",
      },
      {
        href: "/support",
        label: "Support",
        desc: "Fund the record and the site.",
        badge: "Give",
        tone: "ink",
      },
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
      {/* Techy: monospace status strip above the nav showing live
          counters from the Map Room RPCs. Polls every 30s in the
          background so the chrome itself signals "this is a live
          system" before you even scroll. */}
      <HeaderStatusStrip />
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-xl sticky top-0 z-30">
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

          {/* Desktop nav — visible at lg+ so tablet stays touch-first. */}
          <nav data-desktop-nav className="hidden lg:flex items-center gap-1 text-sm">
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
                href="/login?mode=signup"
                className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
              >
                Join
              </Link>
            )}
          </nav>

          {/* Touch/tablet — Donate (always visible) + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
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
        <SiteDashboardRail pathname={pathname} menuOpen={open} />

        {/* Mobile dropdown drawer — anchored to the header's OWN bottom edge
            (absolute top-full) so it tracks the header at any scroll position.
            Hardcoding `top-16` overlapped the header at the top of the page,
            where the (scroll-away) status strip pushes the header below 64px.
            max-h + overflow keeps a long (admin) menu from running off-screen. */}
        {open && (
          <div
            id="mobile-menu"
            role="dialog"
            aria-label="Site menu"
            className="lg:hidden absolute top-full left-0 right-0 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--color-line)] bg-[#101a31]/98 px-4 py-4 text-[var(--color-paper)] shadow-2xl backdrop-blur-xl"
          >
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7fe3a9]">
                    Menu
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[#cfd9ea]">
                    Start fast, then browse the record.
                  </p>
                </div>
                <Link
                  href={signedIn ? "/account" : "/login?mode=signup"}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-normal text-[#fdf8ea] transition hover:bg-white/10"
                >
                  {signedIn ? "Account" : "Join"}
                </Link>
              </div>

              <section aria-label="Start here">
                <div className="grid grid-cols-2 gap-2">
                  {MOBILE_PRIMARY_LINKS.map((item) => (
                    <MobilePrimaryLink
                      key={item.href}
                      item={item}
                      active={pathname === hrefPath(item.href)}
                    />
                  ))}
                </div>
              </section>

              <section aria-label="Browse">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                  Browse
                </p>
                <div className="mt-2 grid gap-1.5">
                  {MOBILE_BROWSE_LINKS.map((item) => (
                    <MobileCompactLink
                      key={item.href}
                      item={item}
                      active={pathname === hrefPath(item.href)}
                    />
                  ))}
                </div>
              </section>

              {isAdmin && (
                <section aria-label="Admin">
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                    Admin
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {MOBILE_ADMIN_LINKS.map((item) => (
                      <MobileAdminLink
                        key={item.href}
                        item={item}
                        active={pathname === hrefPath(item.href)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <Link
                href="/support"
                className="flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-black text-[#fdf8ea] transition hover:bg-[var(--color-accent-strong)]"
              >
                Donate / Support the Work
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile menu backdrop — tap to close. Below the header/drawer (z-20),
          above the page and the support bar. */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
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
          className="absolute left-1/2 mt-2 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-[var(--color-line)] bg-[#101a31]/98 p-3 text-[var(--color-paper)] shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7fe3a9]">
                {group.label}
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-[#cfd9ea]">
                {group.deck}
              </p>
            </div>
            <span className="hidden rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#d8c89e] sm:inline-flex">
              Dashboard
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                role="menuitem"
                className={[
                  "block rounded-lg border px-3 py-3 transition",
                  pathname === hrefPath(it.href)
                    ? "border-[#7fe3a9] bg-[#7fe3a9]/12"
                    : "border-white/10 bg-white/5 hover:border-[#d8c89e] hover:bg-white/10",
                ].join(" ")}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-black text-[#fdf8ea]">{it.label}</span>
                  {it.badge ? (
                    <span className={badgeClass(it.tone)}>{it.badge}</span>
                  ) : null}
                </span>
                {it.desc ? (
                  <span className="mt-1 block text-xs leading-snug text-[#cfd9ea]">
                    {it.desc}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SiteDashboardRail({
  pathname,
  menuOpen,
}: {
  pathname: string;
  menuOpen: boolean;
}) {
  return (
    <div
      className={[
        "border-t border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-paper)] shadow-[0_10px_28px_rgba(26,20,16,0.08)]",
        menuOpen ? "hidden lg:block" : "",
      ].join(" ")}
    >
      <nav
        aria-label="Site dashboard"
        className="mx-auto flex max-w-5xl gap-2.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:grid md:grid-cols-5"
      >
        {DASHBOARD_LINKS.map((item) => (
          <DashboardTile
            key={item.href}
            item={item}
            active={pathname === hrefPath(item.href)}
          />
        ))}
      </nav>
    </div>
  );
}

function DashboardTile({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "min-w-[8.75rem] rounded-lg border px-3 py-3 transition sm:min-w-[10rem] md:min-w-0",
        active
          ? "border-[#7fe3a9] bg-[#142447]"
          : "border-[#243452] bg-[#101a31] hover:border-[#d8c89e] hover:bg-[#142447]",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-black leading-tight text-[#fdf8ea] sm:text-sm">
          {item.label}
        </span>
        {item.badge ? <span className={badgeClass(item.tone)}>{item.badge}</span> : null}
      </span>
      {item.desc ? (
        <span className="mt-1 hidden text-[11px] font-semibold leading-snug text-[#cfd9ea] sm:block">
          {item.desc}
        </span>
      ) : null}
    </Link>
  );
}

function MobilePrimaryLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "min-h-[5.25rem] rounded-lg border px-3 py-3 transition",
        active
          ? "border-[#7fe3a9] bg-[#7fe3a9]/12"
          : "border-white/10 bg-white/5 hover:border-[#d8c89e] hover:bg-white/10",
      ].join(" ")}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm font-black leading-tight text-[#fdf8ea]">
          {item.label}
        </span>
        {item.badge ? <span className={badgeClass(item.tone)}>{item.badge}</span> : null}
      </span>
      {item.desc ? (
        <span className="mt-1.5 block text-[11px] font-semibold leading-snug text-[#cfd9ea]">
          {item.desc}
        </span>
      ) : null}
    </Link>
  );
}

function MobileCompactLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-3 rounded-lg border px-3 py-2 transition",
        active
          ? "border-[#7fe3a9] bg-[#7fe3a9]/12 text-[#fdf8ea]"
          : "border-white/10 bg-white/5 text-[#fdf8ea] hover:border-[#d8c89e] hover:bg-white/10",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-black leading-tight">{item.label}</span>
        {item.desc ? (
          <span className="mt-0.5 block truncate text-[11px] font-semibold leading-snug text-[#cfd9ea]">
            {item.desc}
          </span>
        ) : null}
      </span>
      <span className="text-lg leading-none text-[#7fe3a9]" aria-hidden>
        →
      </span>
    </Link>
  );
}

function MobileAdminLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-black text-[#fdf8ea] transition",
        active
          ? "border-[#7fe3a9] bg-[#7fe3a9]/12"
          : "border-white/10 bg-white/5 hover:border-[#d8c89e] hover:bg-white/10",
      ].join(" ")}
    >
      {item.label}
    </Link>
  );
}

function badgeClass(tone: NavItem["tone"] = "ink") {
  const base =
    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-normal";
  if (tone === "red") return `${base} bg-[var(--color-accent)] text-[#fdf8ea]`;
  if (tone === "blue") return `${base} bg-[#d9e2f2] text-[#142a52]`;
  if (tone === "green") return `${base} bg-[#7fe3a9] text-[#0e1a36]`;
  return `${base} bg-[#d8c89e] text-[#1a1410]`;
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
