"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminItem = {
  href: string;
  label: string;
};

// ONE rail, one flat list. The seven doors Ryan opens every day stay visible;
// everything else lives behind a single collapsed "More tools" — no stacked
// panels, no numbered accordions, no duplicate chips. If a page matters
// daily, it earns a spot in DAILY; otherwise it goes in MORE. That's the rule.
const DAILY: AdminItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/social", label: "Social Studio" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/orders", label: "Money" },
  { href: "/admin/analytics", label: "Stats" },
  { href: "/admin/case", label: "Case files" },
  { href: "/admin/users", label: "Users" },
];

const MORE: AdminItem[] = [
  { href: "/admin/audience", label: "Audience" },
  { href: "/admin/blueprint", label: "Blueprint leads" },
  { href: "/admin/book", label: "Book orders" },
  { href: "/admin/chats", label: "Chats" },
  { href: "/admin/claims", label: "J6 claims" },
  { href: "/admin/deadman", label: "Deadman switch" },
  { href: "/admin/donations", label: "Donations ledger" },
  { href: "/admin/evidence/new", label: "Evidence locker" },
  { href: "/admin/health", label: "System health" },
  { href: "/admin/imports", label: "Imports" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/links", label: "Link graph" },
  { href: "/admin/live", label: "Live streams" },
  { href: "/admin/messages", label: "Private mail" },
  { href: "/admin/og-images", label: "Share images" },
  { href: "/admin/polls", label: "Polls" },
  { href: "/admin/profile", label: "Profile photos" },
  { href: "/admin/queue", label: "Publish queue" },
  { href: "/admin/store", label: "Store" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/tools", label: "Free tools" },
  { href: "/admin/words", label: "Words" },
];

export function AdminNav() {
  const pathname = usePathname();
  const moreActive = MORE.some((item) => isActivePath(pathname, item.href));
  const activeLabel =
    [...DAILY, ...MORE].find((item) => isActivePath(pathname, item.href))
      ?.label ?? "Dashboard";

  return (
    <>
      {/* Mobile: one slim sticky bar — where you are, the one gold action,
          and a single menu. Nothing else. */}
      <div className="lg:hidden sticky top-16 z-20 -mx-4 mb-5 border-b border-[#203a64] bg-[#071126]/96 px-4 py-2.5 text-[#fdf8ea] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <details className="group relative min-w-0 flex-1">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 marker:hidden">
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
                  Admin
                </span>
                <span className="block truncate text-sm font-black">
                  {activeLabel}
                </span>
              </span>
              <span
                className="text-xs text-[#e1bd5b] transition group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </summary>
            <nav
              aria-label="Admin navigation"
              className="absolute left-0 top-full z-30 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-md border border-[#203a64] bg-[#071126] p-2 shadow-xl"
            >
              {DAILY.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
              <p className="mt-2 border-t border-white/10 px-2 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8194b4]">
                More tools
              </p>
              {MORE.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
            </nav>
          </details>
          <Link
            href="/admin/new"
            className="shrink-0 rounded-md bg-[#e1bd5b] px-3.5 py-2 text-xs font-black uppercase tracking-normal text-[#071126] transition hover:bg-[#f0d48a]"
          >
            New post
          </Link>
        </div>
      </div>

      {/* Desktop: one quiet panel. Seven links, one button, one collapsed
          "More tools". */}
      <nav
        className="hidden text-sm lg:sticky lg:top-20 lg:block"
        aria-label="Admin navigation"
      >
        <div className="rounded-md border border-[#203a64] bg-[#071126] p-3 text-[#fdf8ea]">
          <p className="px-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
            Admin
          </p>
          <Link
            href="/admin/new"
            className="mt-3 flex min-h-10 items-center justify-center rounded-md bg-[#e1bd5b] px-3 text-xs font-black uppercase tracking-normal text-[#071126] transition hover:bg-[#f0d48a]"
          >
            New post
          </Link>
          <div className="mt-3 grid gap-0.5">
            {DAILY.map((item) => (
              <RailLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </div>
          <details className="group mt-2 border-t border-white/10 pt-2" open={moreActive}>
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between rounded-md px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8194b4] transition hover:text-[#e1bd5b] marker:hidden">
              More tools
              <span className="text-sm text-[#e1bd5b] transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <div className="mt-1 grid gap-0.5">
              {MORE.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
            </div>
          </details>
        </div>
      </nav>
    </>
  );
}

function RailLink({ item, active }: { item: AdminItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "flex min-h-9 items-center rounded-md border-l-2 px-2.5 text-[0.85rem] font-bold transition",
        active
          ? "border-[#e1bd5b] bg-white/[0.07] text-[#e1bd5b]"
          : "border-transparent text-[#cfd9ea] hover:bg-white/5 hover:text-[#fdf8ea]",
      ].join(" ")}
    >
      {item.label}
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  const hrefPath = href.split("?")[0] || href;
  return hrefPath === "/admin" ? pathname === "/admin" : pathname.startsWith(hrefPath);
}
