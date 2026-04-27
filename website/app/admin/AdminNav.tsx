"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "Mission Control" },
  { href: "/admin/console", label: "Operating Console" },
  { href: "/admin/looking-glass", label: "Looking Glass" },
  { href: "/admin/data-stream", label: "Data Stream" },
  { href: "/admin/members", label: "Members" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-white/10 bg-[#06090f] px-4 py-2 text-sm text-cyan-100">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 transition ${
              active
                ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/40"
                : "hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/account/security"
        className="ml-auto rounded-md px-3 py-1.5 text-cyan-200/80 hover:bg-white/5"
      >
        Account
      </Link>
    </nav>
  );
}
