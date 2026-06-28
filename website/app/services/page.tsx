import type { Metadata } from "next";
import Link from "next/link";
import { ServicesHub } from "@/components/ServicesHub";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services — turn attention into action",
  description:
    "Hire Ryan Nichols to audit, sharpen, or build an owned website that turns attention into proof, services, support, and checkout.",
  alternates: { canonical: `${SITE.url}/services` },
  openGraph: {
    title: "Services — turn attention into action",
    description:
      "Business services for owned websites, attention systems, site audits, service ladders, and domain-first builds.",
    images: ["/social-cards/map-room.jpg"],
  },
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHub />

      {/* More from Ryan — the book + the store, so /services is a true offers
          hub, not only website services. No donations, just offers. */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            More from Ryan
          </p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight">
            Not ready for a build? Start here.
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/book"
              className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition hover:border-[var(--color-accent)]"
            >
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-blue)]">
                The book
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-ink)]">
                They tried to bury me. I wrote it down.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                The story in my own words — prison, the pardon, faith, and the
                rebuild. Get on the list and claim your copy.
              </p>
              <span className="mt-4 inline-flex text-sm font-bold text-[var(--color-accent)]">
                Reserve the book →
              </span>
            </Link>

            <Link
              href="/store"
              className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition hover:border-[var(--color-accent)]"
            >
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-blue)]">
                The store
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-ink)]">
                Every offer in one place.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Calls, audits, builds, and bundles — pick the smallest smart move
                and check out clean. No subscriptions you can&apos;t cancel, no
                trapped customers.
              </p>
              <span className="mt-4 inline-flex text-sm font-bold text-[var(--color-accent)]">
                Browse the store →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
