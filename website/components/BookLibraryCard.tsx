import Link from "next/link";
import { BOOK, formatUsd } from "@/lib/book";
import type { BookOrder, BookEntitlements } from "@/lib/book-orders";

/**
 * The "Your Library" panel shown on a signed-in buyer's account. It confirms
 * their pre-order now and becomes the place the digital edition is delivered
 * the moment the file is attached (fileReady). Only render this for buyers
 * whose email is confirmed — see app/account/page.tsx.
 */
export function BookLibraryCard({
  orders,
  entitlements,
  fileReady,
}: {
  orders: BookOrder[];
  entitlements: BookEntitlements;
  fileReady: boolean;
}) {
  if (orders.length === 0) return null;

  // Any order's token unlocks the file — they all point at the same edition.
  const token = orders.find((o) => o.download_token)?.download_token ?? null;

  const chips = [
    entitlements.digital && "Digital edition",
    entitlements.signedCopy && "Signed copy",
    entitlements.evidenceAppendix && "Evidence appendix",
    entitlements.founding && "Founding supporter",
  ].filter((c): c is string => Boolean(c));

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-cream)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="border-b border-[var(--color-line-soft)] p-5 sm:flex sm:items-center sm:gap-5">
        <div className="hidden w-[88px] shrink-0 sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOOK.cover}
            alt={`${BOOK.title} — cover`}
            width={1000}
            height={1333}
            className="w-full rounded-md border border-[var(--color-line)] shadow-lg shadow-black/40"
          />
        </div>
        <div className="mt-3 sm:mt-0">
          <p className="eyebrow">Your library</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-[var(--color-cream)]">
            {BOOK.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
            by {BOOK.author} — your pre-order is on the record.
          </p>
          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[var(--color-gold-bright)]/40 bg-[var(--color-gold-bright)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-gold-bright)]"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        {fileReady && token ? (
          <div className="rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-2)] p-5">
            <h3 className="font-display text-xl font-black text-[var(--color-cream)]">
              Your digital edition is ready.
            </h3>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
              It is tied to your account. Download your copy below — please keep
              it to yourself.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={`/book/download/${token}/file`}
                className="btn-accent inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-sm font-black"
              >
                Download the book
              </a>
              <Link
                href={`/book/download/${token}`}
                className="btn-blue inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-sm font-black"
              >
                Open your download page
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-2)] p-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-live)] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-live)]" />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-live)]">
                Reserved for you
              </p>
            </div>
            <h3 className="mt-2 font-display text-xl font-black text-[var(--color-cream)]">
              Your copy is locked in.
            </h3>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
              The digital edition lands right here the moment it is ready — you
              will be among the first to read it, before it ever reaches Amazon.
              You will get an email too; nothing for you to do.
            </p>
            <Link
              href="/book/updates"
              className="btn-ghost mt-4 inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-black"
            >
              See book updates
            </Link>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm"
            >
              <span className="font-bold text-[var(--color-cream)]">
                {o.product_name ?? "Fighting Shadows pre-order"}
              </span>
              <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[var(--color-ink-soft)]">
                {new Date(o.created_at).toLocaleDateString()}
                {o.amount_paid ? ` · ${formatUsd(o.amount_paid / 100)}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
