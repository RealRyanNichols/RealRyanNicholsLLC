import type { ReactNode } from "react";
import { SignupForm } from "@/components/SignupForm";
import { SITE } from "@/lib/site";

// The in-story capture band on /case: a cream pause in the record with one
// line, the sitewide follow form (email or phone, one button, the same
// /api/subscribe wiring and subscribe_* events the footer uses), and, for
// the book slot, the book band above the form. Exactly two of these render
// on the page — after the case timeline and after the evidence — and
// nothing else above the footer asks for an address. Full-bleed on a phone,
// a rounded card from `sm` up.
export function CaseCaptureBand({
  line,
  label = "Follow the case",
  children,
  className = "",
}: {
  line: string;
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      aria-label={label}
      className={`-mx-4 border-y border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-8 sm:mx-0 sm:rounded-2xl sm:border sm:px-8 ${className}`}
    >
      <p className="mx-auto max-w-2xl text-center font-display text-xl font-bold leading-snug tracking-tight text-[var(--color-ink)] sm:text-2xl">
        {line}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
      <SignupForm
        emailEnabled={SITE.emailCaptureEnabled}
        kicker="Follow the case"
        blurb="No algorithm. No platform. The next filing, straight to your inbox or phone."
        className="mx-auto mt-6 max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      />
    </aside>
  );
}
