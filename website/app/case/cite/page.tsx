import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Eyebrow } from "@/components/case/ChapterHeader";

// The researcher's on-ramp. This block used to sit inside the /case story as
// a paragraph card ("Study this case"); it lives at its own URL now so the
// citation has a permanent address and the story's last rung stays a link
// grid. The content is unchanged.

const TITLE = "How to cite the J6 case archive";
const DESCRIPTION =
  "How to cite the case archive of United States v. Nichols, No. 1:21-cr-00117 (D.D.C.): the citation, permanent document URLs, and the official docket sources behind each record.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/case/cite` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/case/cite`,
    images: [`${SITE.url}/og/case`],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE.url}/og/case`],
  },
};

export default function CitePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/case" className="inline-flex min-h-11 items-center hover:underline sm:min-h-0">
          ← J6 Case
        </Link>
      </nav>

      <Eyebrow>Study this case</Eyebrow>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Built to be checked, cited, and taught.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
        The case file and the archive behind it exist so journalists, lawyers,
        students, and historians can study United States v. Nichols from the
        primary record — court filings linked at their official source,
        grievance scans, transcripts, and sworn statements, each labeled for
        what it is (FACT / RYAN STATEMENT / NEEDS AUTHENTICATION).
      </p>

      <div className="mt-6 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          How to cite this archive
        </p>
        <p className="mt-2 break-words font-mono text-xs leading-relaxed text-[var(--color-ink)] sm:text-sm">
          Nichols, Ryan. <em>The J6 Case Archive: United States v. Nichols</em>,
          No. 1:21-cr-00117 (D.D.C.). RealRyanNichols.com.
          https://www.realryannichols.com/case
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          Cite individual documents by their own URL — every scan, filing, and
          grievance has a permanent page. Court records link to CourtListener/RECAP
          so you can verify against the official docket yourself. Related habeas
          matter: Nichols v. Garland, No. 1:22-cv-02356 (D.D.C.).
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold">
          <Link
            href="/case?view=documents"
            className="inline-flex min-h-11 min-w-11 items-center gap-1 text-[var(--color-navy)] hover:underline sm:min-h-0"
          >
            The full document archive <span aria-hidden>→</span>
          </Link>
          <Link
            href="/case?view=timeline"
            className="inline-flex min-h-11 min-w-11 items-center gap-1 text-[var(--color-navy)] hover:underline sm:min-h-0"
          >
            The dated timeline <span aria-hidden>→</span>
          </Link>
          <a
            href="/llms.txt"
            className="inline-flex min-h-11 min-w-11 items-center gap-1 text-[var(--color-navy)] hover:underline sm:min-h-0"
          >
            Machine-readable overview (llms.txt) <span aria-hidden>→</span>
          </a>
          <a
            href="/rss.xml"
            className="inline-flex min-h-11 min-w-11 items-center gap-1 text-[var(--color-navy)] hover:underline sm:min-h-0"
          >
            RSS <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </article>
  );
}
