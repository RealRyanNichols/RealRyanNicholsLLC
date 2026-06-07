"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminItem = {
  href: string;
  label: string;
  short?: string;
  sub?: string;
};

type AdminGroup = {
  label: string;
  items: AdminItem[];
};

// The 5 things touched every day — the always-visible quick bar.
const PRIMARY: AdminItem[] = [
  { href: "/admin", label: "Home", short: "Home", sub: "Needs you now" },
  { href: "/admin/tips?filter=pending", label: "Tips", short: "Tips", sub: "Public leads" },
  { href: "/admin/messages?filter=new", label: "Mail", short: "Mail", sub: "Private inbox" },
  { href: "/admin/orders", label: "Money", short: "Money", sub: "Sales & pay" },
  { href: "/admin/analytics", label: "Stats", short: "Stats", sub: "Traffic" },
];

// Everything else, top-to-bottom by how often you need it. No duplicates.
const GROUPS: AdminGroup[] = [
  {
    label: "Needs you now",
    items: [
      { href: "/admin/tips?filter=pending", label: "Tip queue", sub: "Public leads to review" },
      { href: "/admin/messages?filter=new", label: "Private mail", sub: "Contact inbox" },
      { href: "/admin/submissions?filter=pending", label: "Submissions", sub: "Claimant uploads" },
      { href: "/admin/claims?filter=pending", label: "J6 claims", sub: "Profile claims" },
      { href: "/admin/review", label: "Review queue", sub: "Classify & approve" },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/admin/new", label: "New post", sub: "Write now" },
      { href: "/admin/posts", label: "Posts", sub: "Articles & updates" },
      { href: "/admin/live", label: "Live", sub: "Streams & comments" },
      { href: "/admin/words", label: "Words", sub: "Saved copy & drafts" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/orders", label: "Orders", sub: "Service & store checkout" },
      { href: "/admin/invoices", label: "Invoices", sub: "Send & track payment" },
      { href: "/admin/donations", label: "Donations", sub: "Supporter money" },
      { href: "/admin/book", label: "Book", sub: "Pre-orders & list" },
      { href: "/admin/blueprint", label: "Blueprint", sub: "Legal-tech leads" },
      { href: "/admin/store", label: "Store", sub: "Products & offers" },
    ],
  },
  {
    label: "Audience & insight",
    items: [
      { href: "/admin/analytics", label: "Analytics", sub: "Traffic & behavior" },
      { href: "/admin/audience", label: "Audience", sub: "Profiles & signals" },
      { href: "/admin/tools", label: "Free tools", sub: "Tool runs & needs" },
    ],
  },
  {
    label: "The case",
    items: [
      { href: "/admin/attorney-brief", label: "Attorney brief", sub: "Defense prep" },
      { href: "/admin/case", label: "Case docs", sub: "Documents on file" },
      { href: "/admin/evidence", label: "Evidence", sub: "Exhibits on file" },
      { href: "/admin/continuity", label: "Continuity", sub: "Keep it all running" },
      { href: "/admin/deadman", label: "Deadman switch", sub: "Emergency release" },
    ],
  },
  {
    label: "Settings & system",
    items: [
      { href: "/admin/users", label: "Users", sub: "Accounts & approvals" },
      { href: "/admin/og-images", label: "Share images", sub: "OG thumbnails" },
      { href: "/admin/profile", label: "Profile photos", sub: "People images" },
      { href: "/admin/imports", label: "Imports", sub: "Staged data" },
      { href: "/admin/health", label: "System health", sub: "Connections" },
    ],
  },
];

export function AdminNav({
  collapsed = false,
  onCollapsedChange,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const activePrimary = PRIMARY.find((item) => isActivePath(pathname, item.href));

  return (
    <>
      <div className="lg:hidden sticky top-16 z-20 -mx-4 mb-5 border-b border-[#203a64] bg-[#071126]/96 px-4 py-3 text-[#fdf8ea] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
              Admin
            </p>
            <p className="truncate text-sm font-black">
              {activePrimary?.label ?? "Command center"}
            </p>
          </div>
          <Link
            href="/admin/new"
            className="shrink-0 rounded-full border border-[#e1bd5b]/50 bg-[#e1bd5b]/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-normal text-[#e1bd5b] transition hover:bg-[#e1bd5b]/25"
          >
            New post
          </Link>
        </div>

        <nav aria-label="Admin priority tools" className="mt-3 grid grid-cols-5 gap-1.5">
          {PRIMARY.map((item) => (
            <MobilePrimaryLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </nav>

        <details className="group mt-2 rounded-lg border border-white/10 bg-white/5">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black uppercase tracking-normal text-[#cfd9ea] marker:hidden">
            More admin tools
            <span className="text-base text-[#e1bd5b] transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="border-t border-white/10 p-3">
            <GroupedToolGrid pathname={pathname} compact />
          </div>
        </details>
      </div>

      <nav
        className={[
          "hidden text-sm lg:sticky lg:top-20 lg:block",
          collapsed ? "lg:w-[4.25rem]" : "lg:w-full",
        ].join(" ")}
        aria-label="Admin desktop navigation"
      >
        <div
          className={[
            "rounded-md border border-[#203a64] bg-[#071126] text-[#fdf8ea] shadow-sm shadow-[#071126]/15",
            collapsed ? "p-1.5" : "p-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center gap-2",
              collapsed ? "justify-center" : "justify-between",
            ].join(" ")}
          >
            {collapsed ? null : (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
                  Command
                </p>
                <p className="mt-1 text-xs font-bold text-[#a9b7d0]">
                  Fast actions
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => onCollapsedChange?.(!collapsed)}
              className={[
                "grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-[#fdf8ea] transition hover:border-[#e1bd5b] hover:bg-[#e1bd5b]/15 hover:text-[#e1bd5b]",
                collapsed ? "mx-auto" : "",
              ].join(" ")}
              aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
              title={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>

          <div className={collapsed ? "mt-3 space-y-2" : "mt-4 grid gap-2"}>
            {PRIMARY.map((item) => (
              <DesktopPrimaryLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
          <Link
            href="/admin/new"
            className={[
              "mt-3 flex min-h-10 items-center justify-center rounded-md border border-[#e1bd5b]/50 bg-[#e1bd5b]/15 text-xs font-black uppercase tracking-normal text-[#e1bd5b] transition hover:bg-[#e1bd5b]/25",
              collapsed ? "px-1" : "px-3",
            ].join(" ")}
            title="New post"
          >
            {collapsed ? "+" : "New post"}
          </Link>
        </div>

        {collapsed ? (
          <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 text-center">
            <button
              type="button"
              onClick={() => onCollapsedChange?.(false)}
              className="mx-auto grid h-9 w-9 place-items-center rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] text-[10px] font-black text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Open full admin menu"
              title="Open full admin menu"
            >
              All
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Full admin map
              </p>
              <button
                type="button"
                onClick={() => onCollapsedChange?.(true)}
                className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Close rail
              </button>
            </div>
            <div className="max-h-[42vh] overflow-y-auto pr-1">
              <GroupedToolGrid pathname={pathname} />
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function GroupedToolGrid({
  pathname,
  compact = false,
}: {
  pathname: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {GROUPS.map((group, index) => {
        // Open the top tier by default, plus whichever tier holds the page
        // you're on — so the map stays a short, scannable list, not a wall.
        const hasActive = group.items.some((item) =>
          isActivePath(pathname, item.href),
        );
        return (
          <details
            key={group.label}
            open={index === 0 || hasActive}
            className="group/sect rounded-md border border-white/10 bg-white/[0.03]"
          >
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 marker:hidden">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d8c89e]">
                <span className="text-[#e1bd5b]/70">{index + 1}.</span>{" "}
                {group.label}
              </span>
              <span
                className="text-sm leading-none text-[#e1bd5b] transition group-open/sect:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="space-y-1 border-t border-white/10 p-2">
              {group.items.map((item) => (
                <ToolLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  compact={compact}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function MobilePrimaryLink({
  item,
  active,
}: {
  item: AdminItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "flex min-h-12 items-center justify-center rounded-lg border px-1 text-center text-[11px] font-black leading-tight transition",
        active
          ? "border-[#e1bd5b] bg-[#e1bd5b] text-[#071126]"
          : "border-white/10 bg-white/5 text-[#fdf8ea] hover:border-[#d8c89e] hover:bg-white/10",
      ].join(" ")}
    >
      {item.short ?? item.label}
    </Link>
  );
}

function DesktopPrimaryLink({
  item,
  active,
  collapsed,
}: {
  item: AdminItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "group relative overflow-hidden rounded-md border transition",
        collapsed
          ? "grid min-h-11 place-items-center px-1 py-2 text-center"
          : "grid min-h-[3.6rem] grid-cols-[1fr_auto] items-center gap-2 px-3 py-2.5",
        active
          ? "border-[#e1bd5b]/80 bg-[#102826] text-[#fdf8ea]"
          : "border-white/10 bg-white/5 text-[#fdf8ea] hover:border-[#d8c89e] hover:bg-white/10",
      ].join(" ")}
      title={item.label}
    >
      <span className="min-w-0">
        <span
          className={[
            "block font-black leading-tight",
            collapsed ? "text-[10px]" : "text-[0.95rem]",
          ].join(" ")}
        >
          {collapsed ? item.short ?? item.label.slice(0, 3) : item.label}
        </span>
        {!collapsed && item.sub ? (
          <span
            className={[
              "mt-1 block text-xs font-semibold leading-snug",
              active ? "text-[#bdeccd]" : "text-[#cfd9ea]",
            ].join(" ")}
          >
            {item.sub}
          </span>
        ) : null}
      </span>
      {!collapsed ? (
        <span
          className={[
            "grid h-7 min-w-9 place-items-center whitespace-nowrap rounded-sm border px-2 text-[10px] font-black uppercase tracking-normal",
            active
              ? "border-[#e1bd5b]/25 bg-[#e1bd5b]/10 text-[#e1bd5b]"
              : "border-white/10 bg-white/5 text-[#e1bd5b] group-hover:border-[#e1bd5b]/50",
          ].join(" ")}
          aria-hidden
        >
          {item.short ?? item.label.slice(0, 1)}
        </span>
      ) : null}
    </Link>
  );
}

function ToolLink({
  item,
  active,
  compact,
}: {
  item: AdminItem;
  active: boolean;
  compact: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "grid min-h-9 grid-cols-[1fr_auto] items-center gap-2 rounded-sm border px-2.5 py-1.5 transition",
        compact
          ? active
            ? "border-[#e1bd5b] bg-[#e1bd5b]/15 text-[#fdf8ea]"
            : "border-white/10 bg-white/5 text-[#fdf8ea] hover:border-[#d8c89e] hover:bg-white/10"
          : active
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
            : "border-transparent text-[var(--color-ink-soft)] hover:border-[var(--color-line)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block truncate text-xs font-black leading-tight">
          {item.label}
        </span>
        {item.sub ? (
          <span
            className={[
              "mt-0.5 block truncate text-[10px] font-semibold leading-snug",
              compact ? "text-[#a9b7d0]" : "text-[var(--color-muted)]",
            ].join(" ")}
          >
            {item.sub}
          </span>
        ) : null}
      </span>
      <span className={compact ? "text-[#e1bd5b]" : "text-[var(--color-muted)]"} aria-hidden>
        →
      </span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  const hrefPath = href.split("?")[0] || href;
  return hrefPath === "/admin" ? pathname === "/admin" : pathname.startsWith(hrefPath);
}
