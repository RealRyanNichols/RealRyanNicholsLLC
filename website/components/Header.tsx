import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Ryan Nichols — Home">
          <span
            className="inline-flex h-8 w-8 rounded-full bg-[var(--color-accent)] text-white items-center justify-center text-sm font-semibold"
            aria-hidden
          >
            RN
          </span>
          <span className="font-semibold text-[var(--color-ink)] group-hover:underline underline-offset-4">
            Ryan Nichols
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <NavLink href="/">Feed</NavLink>
          <NavLink href="/jan-6">Jan 6</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/support">Support</NavLink>
          {user ? (
            <Link
              href="/account"
              className="ml-2 inline-flex items-center rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-white text-xs font-medium hover:bg-[var(--color-accent)] transition"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-white text-xs font-medium hover:bg-[var(--color-accent)] transition"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2 py-1 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition"
    >
      {children}
    </Link>
  );
}
