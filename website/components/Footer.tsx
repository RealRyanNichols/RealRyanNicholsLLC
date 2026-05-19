import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[var(--color-muted)]">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
          <Link className="hover:text-[var(--color-accent)]" href="/jan-6">Jan 6</Link>
          <Link className="hover:text-[var(--color-accent)]" href="/about">About</Link>
          <Link className="hover:text-[var(--color-accent)]" href="/support">Support</Link>
          <Link className="hover:text-[var(--color-accent)]" href="/privacy">Privacy</Link>
          <Link className="hover:text-[var(--color-accent)]" href="/community-rules">Community rules</Link>
          <Link className="hover:text-[var(--color-accent)]" href="/rss.xml">RSS</Link>
        </nav>
        <p>
          © {SITE.year} {SITE.author}. {SITE.footerLine}
        </p>
      </div>
    </footer>
  );
}
