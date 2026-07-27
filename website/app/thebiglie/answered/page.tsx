import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank you — The BIG Lie",
  robots: { index: false, follow: false },
};

const DARK = "bg-[#071126] text-[#fdf8ea]";

export default async function AnsweredPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const stopped = status === "stopped";
  const invalid = status === "invalid";

  return (
    <article className={`rrn-page ${DARK}`}>
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        {stopped ? (
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9fb2d0]">
              Done
            </p>
            <h1 className="mt-3 font-display text-4xl font-black text-[#fdf8ea]">
              You are off the daily series.
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-[#cfd9ea]">
              No more daily emails. The report is still yours to read and share
              any time.
            </p>
          </>
        ) : invalid ? (
          <>
            <h1 className="font-display text-4xl font-black text-[#fdf8ea]">
              That link expired.
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-[#cfd9ea]">
              No harm done. Open the report and keep going.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4cc38a]">
              Got it
            </p>
            <h1 className="mt-3 font-display text-4xl font-black text-[#fdf8ea]">
              Thank you. That helps me build what comes next.
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-[#cfd9ea]">
              Your answer is on the record. Watch your inbox tomorrow for the
              next one.
            </p>
          </>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/thebiglie/report/index.html"
            className="rounded-lg bg-[#e1bd5b] px-7 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-[#071126] transition hover:brightness-110"
          >
            Open The Report
          </a>
          <Link
            href="/book"
            className="rounded-lg border-2 border-[#2b4a7a] px-7 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-[#cfd9ea] transition hover:border-[#e1bd5b]"
          >
            See Fighting Shadows
          </Link>
        </div>
      </section>
    </article>
  );
}
