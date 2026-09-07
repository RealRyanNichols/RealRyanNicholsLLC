import Link from "next/link";
import { SITE } from "@/lib/site";
import { SignupForm } from "@/components/SignupForm";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Explore",
    links: [
      { href: "/start-here", label: "Start Here" },
      { href: "/", label: "Feed" },
      { href: "/case", label: "Case" },
      { href: "/videos", label: "Watch" },
      { href: "/live", label: "Live" },
      { href: "/the-map-room", label: "Map Room" },
      { href: "/fights", label: "The Fights" },
    ],
  },
  {
    heading: "Take action",
    links: [
      { href: "/tell-your-story", label: "Tell Your Story" },
      { href: "/tools", label: "Free Tools" },
      { href: "/submit", label: "Tip Line" },
      { href: "/case/intake", label: "Public Ledger" },
      { href: "/contact", label: "Private Contact" },
    ],
  },
  {
    heading: "Work with Ryan",
    links: [
      { href: "/services", label: "Services" },
      { href: "/store", label: "Store" },
      { href: "/own-your-feed", label: "Own Your Feed" },
      { href: "/impact", label: "Impact" },
      { href: "/about", label: "About" },
      { href: "/about/numbers", label: "How the numbers work" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)]">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[var(--color-muted)]">
        {/* Last-chance capture: every page ends with a way onto the list. */}
        <div className="mb-10 grid items-center gap-4 sm:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              No algorithm
            </p>
            <p className="mt-1 font-semibold text-[var(--color-ink-soft)]">
              Get the next post by email or text — straight from Ryan.
            </p>
          </div>
          <SignupForm emailEnabled={SITE.emailCaptureEnabled} />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                {col.heading}
              </p>
              <ul className="mt-2 grid gap-0 sm:mt-3 sm:gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center font-semibold text-[var(--color-ink-soft)] transition hover:text-[var(--color-accent)] sm:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--color-line)] pt-5 text-xs">
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[var(--color-accent)] sm:min-h-0 sm:min-w-0" href="/privacy">
            Privacy
          </Link>
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[var(--color-accent)] sm:min-h-0 sm:min-w-0" href="/community-rules">
            Community rules
          </Link>
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[var(--color-accent)] sm:min-h-0 sm:min-w-0" href="/editorial-standards">
            Editorial standards
          </Link>
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[var(--color-accent)] sm:min-h-0 sm:min-w-0" href="/rss.xml">
            RSS
          </Link>
          <span className="ml-auto">
            © {SITE.year} {SITE.author}. {SITE.footerLine}
          </span>
        </div>
      </div>
    </footer>
  );
}
