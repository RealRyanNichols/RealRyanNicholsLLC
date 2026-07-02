import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AttorneyBriefBody } from "@/components/AttorneyBriefBody";
import { COUNSEL_COOKIE, isCounselSessionValid } from "@/lib/counsel";
import { counselLogin } from "./actions";

export const metadata: Metadata = {
  title: "Confidential case brief",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CounselPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const jar = await cookies();
  const authed = await isCounselSessionValid(jar.get(COUNSEL_COOKIE)?.value);

  if (authed) {
    return <AttorneyBriefBody mode="counsel" />;
  }

  return <CounselGate error={e === "1"} />;
}

function CounselGate({ error }: { error: boolean }) {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Confidential
        </p>
        <h1 className="mt-2 font-sans text-2xl font-black leading-tight text-[var(--color-ink)]">
          Counsel access
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          This case brief is private. Enter the username and password Ryan
          Nichols provided to view it.
        </p>
        <form action={counselLogin} className="mt-5 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Username
            </span>
            <input
              name="username"
              autoComplete="username"
              required
              className="min-h-11 border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-11 border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          {error ? (
            <p className="text-xs font-bold text-[var(--color-accent)]">
              That username and password did not match. Try again.
            </p>
          ) : null}
          <button
            type="submit"
            className="min-h-11 border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-sm font-black uppercase tracking-normal text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            View the brief
          </button>
        </form>
        <p className="mt-4 text-[11px] font-semibold leading-5 text-[var(--color-muted)]">
          Authorized viewers only. Do not share these credentials with anyone
          else.
        </p>
      </div>
    </main>
  );
}
