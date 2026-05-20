import Link from "next/link";
import Image from "next/image";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export async function Header() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  let isAdmin = false;
  if (user) {
    const { data: adminCheck } = await supabase.rpc("is_admin", { uid: user.id });
    isAdmin = adminCheck === true;
  }

  return (
    <header className="border-b border-[var(--color-line)] bg-[#0a0a0c]/85 backdrop-blur-xl sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Ryan Nichols — Home">
          {SITE.avatarPath ? (
            <Image
              src={SITE.avatarPath}
              alt=""
              aria-hidden
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--color-accent-glow)]"
              priority
            />
          ) : (
            <span
              className="inline-flex h-9 w-9 rounded-full bg-[var(--color-accent)] text-[#0a0a0c] items-center justify-center text-sm font-bold ring-2 ring-[var(--color-accent-glow)]"
              aria-hidden
            >
              RN
            </span>
          )}
          <span className="font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition">
            Ryan Nichols
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-2 text-sm">
          <NavLink href="/">Feed</NavLink>
          <NavLink href="/jan-6">Jan 6</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/support">Support</NavLink>
          {isAdmin ? (
            <Link
              href="/admin/new"
              className="btn-accent ml-2 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs transition"
              aria-label="New post"
            >
              + New
            </Link>
          ) : null}
          {user ? (
            <Link
              href="/account"
              className="ml-1 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
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
      className="px-2.5 py-1.5 rounded-md text-[var(--color-ink-soft)] font-medium hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition"
    >
      {children}
    </Link>
  );
}
