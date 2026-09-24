"use client";

import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { trackEvent } from "@/lib/analytics";
import { BOOK } from "@/lib/book";
import { getImageSource } from "@/lib/image-source";

// The one next step at the foot of every article. It replaced three blocks
// that each asked for something (Read Next cards, the book band, and a
// second email box) with one hook line, three numbered choices, and three
// related reads. The case choice carries the only email field and the only
// solid gold button in the block; the book and the services choices are
// whole-row links. FuelAsk renders right after this on the page.
//
// Every click fires article_next_step_click {choice, slug, position, target};
// the kebab-case data-track labels ride on the automatic click log too.

export type NextStepRelated = {
  slug: string;
  title: string;
  category: string | null;
  thumb: string | null;
};

type Choice = "book" | "case" | "services" | "related";

export function ArticleNextStep({
  slug,
  related,
  caseRelated = false,
  emailEnabled,
  className = "",
}: {
  // The current article, carried on every click event.
  slug: string;
  related: NextStepRelated[];
  // Case stories also get the document archive link.
  caseRelated?: boolean;
  emailEnabled: boolean;
  className?: string;
}) {
  const track = (choice: Choice, position: number, target: string) => () =>
    trackEvent("article_next_step_click", { choice, slug, position, target });

  const numeral =
    "display text-[2.5rem] leading-none tabular-nums text-[var(--color-gold)] sm:row-span-3 sm:self-start sm:text-6xl";
  const title =
    "font-display text-xl font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-2xl";
  const body = "text-[15px] leading-relaxed text-[var(--color-ink-soft)]";
  const arrowLink =
    "inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-[var(--color-gold-bright)]";

  return (
    <section
      data-article-next-step
      aria-labelledby="next-step-title"
      className={`mt-12 border-t-2 border-[var(--color-gold)] pt-8 ${className}`}
    >
      <p className="eyebrow">You made it to the end</p>
      <h2
        id="next-step-title"
        className="mt-2 font-display text-[1.75rem] font-black leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-4xl"
      >
        Most people quit at the headline. You didn&rsquo;t.
      </h2>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-ink-soft)]">
        So don&rsquo;t stop here. Pick one.
      </p>

      <ol className="mt-6">
        {/* 01: the book. A whole-row link with the real cover. */}
        <li className="border-t border-[var(--color-line-soft)]">
          <Link
            href="/book"
            data-track="next-step-book"
            onClick={track("book", 1, "/book")}
            className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 py-5 sm:grid-cols-[4.5rem_1fr] sm:gap-x-5 sm:px-6"
          >
            <span aria-hidden className={numeral}>
              01
            </span>
            <h3 className={`${title} transition group-hover:text-[var(--color-gold)]`}>Read the book</h3>
            <span className="col-span-2 mt-2 flex items-start gap-4 sm:col-span-1 sm:col-start-2">
              <span className="min-w-0 flex-1">
                <span className={`block ${body}`}>
                  <em className="not-italic font-bold text-[var(--color-ink)]">{BOOK.title}</em> is
                  the whole story in my own words: the road into January 6, the D.C. jail, and the
                  fight to get the record out.
                </span>
                <span className={`${arrowLink} mt-1`}>
                  See the book
                  <span aria-hidden className="transition group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
              </span>
              <Image
                src={BOOK.cover}
                alt=""
                width={64}
                height={85}
                sizes="64px"
                className="mt-1 w-14 shrink-0 -rotate-2 rounded-sm border border-[var(--color-line)] shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition group-hover:rotate-0 sm:w-16"
              />
            </span>
          </Link>
        </li>

        {/* 02: the case. The raised band holds the one form and the one
            solid gold button. Full-bleed on a phone, a card from sm up. */}
        <li className="-mx-4 border-y border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-6 sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
          <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 sm:grid-cols-[4.5rem_1fr] sm:gap-x-5">
            <span aria-hidden className={numeral}>
              02
            </span>
            <h3 className={title}>Follow the case</h3>
            <div className="col-span-2 mt-2 min-w-0 sm:col-span-1 sm:col-start-2">
              <p className={body}>
                The record is still being written. Get one email when something new drops on it.
              </p>
              <SignupForm
                variant="inline"
                emailEnabled={emailEnabled}
                placement="article-next-step"
                buttonLabel="Follow"
                fineprint="Unsubscribe in one click."
                className="mt-4"
              />
              <div className="mt-1 flex flex-wrap gap-x-5">
                <Link
                  href="/case"
                  data-track="next-step-case"
                  onClick={track("case", 2, "/case")}
                  className={`group ${arrowLink}`}
                >
                  Open the case file
                  <span aria-hidden className="transition group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
                {caseRelated ? (
                  <Link
                    href="/case?view=documents"
                    data-track="next-step-case-documents"
                    onClick={track("case", 2, "/case?view=documents")}
                    className={`group ${arrowLink}`}
                  >
                    The document archive
                    <span aria-hidden className="transition group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </li>

        {/* 03: the work. Plain type, a whole-row link. */}
        <li>
          <Link
            href="/services"
            data-track="next-step-services"
            onClick={track("services", 3, "/services")}
            className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 py-5 sm:grid-cols-[4.5rem_1fr] sm:gap-x-5 sm:px-6"
          >
            <span aria-hidden className={numeral}>
              03
            </span>
            <h3 className={`${title} transition group-hover:text-[var(--color-gold)]`}>Hire Ryan</h3>
            <span className="col-span-2 mt-2 block sm:col-span-1 sm:col-start-2">
              <span className={`block ${body}`}>
                I built this site. Want one that brings your business real leads? Start with a free
                30-minute call.
              </span>
              <span className={`${arrowLink} mt-1`}>
                See the services
                <span aria-hidden className="transition group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </span>
          </Link>
        </li>
      </ol>

      {related.length > 0 ? (
        <div className="mt-4 border-t border-[var(--color-line-soft)] pt-6">
          <p className="eyebrow">Keep reading</p>
          <ul className="mt-2 divide-y divide-[var(--color-line-soft)]">
            {related.map((r, i) => {
              const href = `/posts/${r.slug}`;
              const img = r.thumb ? getImageSource(r.thumb) : null;
              return (
                <li key={r.slug}>
                  <Link
                    href={href}
                    data-track={`next-step-related-${i + 1}`}
                    onClick={track("related", i + 1, href)}
                    className="group flex min-h-11 items-center gap-3 py-3"
                  >
                    {img ? (
                      <Image
                        {...img}
                        alt=""
                        width={96}
                        height={50}
                        sizes="96px"
                        className="aspect-[1200/630] w-20 shrink-0 rounded-md border border-[var(--color-line)] object-cover sm:w-24"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="aspect-[1200/630] w-20 shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] sm:w-24"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--color-ink)] transition group-hover:text-[var(--color-gold)]">
                        {r.title}
                      </span>
                      {r.category ? (
                        <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                          {r.category}
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-lg font-black text-[var(--color-gold)] transition group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
