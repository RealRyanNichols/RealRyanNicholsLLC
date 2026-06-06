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
    <section className="mt-6 overflow-hidden rounded-2xl border-2 border-[#203a64] bg-[#071126] text-[#fdf8ea] shadow-xl">
      <div className="border-b border-white/10 p-5 sm:flex sm:items-center sm:gap-5">
        <div className="hidden w-[88px] shrink-0 sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOOK.cover}
            alt={`${BOOK.title} — cover`}
            width={1000}
            height={1333}
            className="w-full rounded-md border border-white/15 shadow-lg shadow-black/40"
          />
        </div>
        <div className="mt-3 sm:mt-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
            Your library
          </p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-[#fdf8ea]">
            {BOOK.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#cfd9ea]">
            by {BOOK.author} — your pre-order is on the record.
          </p>
          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[#e1bd5b]/40 bg-[#e1bd5b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#e1bd5b]"
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
          <div className="rounded-xl border border-white/12 bg-white/[0.05] p-5">
            <h3 className="font-display text-xl font-black text-[#fdf8ea]">
              Your digital edition is ready.
            </h3>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              It is tied to your account. Download your copy below — please keep
              it to yourself.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={`/book/download/${token}/file`}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#e1bd5b] px-6 py-3 text-sm font-black text-[#071126] transition hover:bg-[#a7efc4]"
              >
                Download the book
              </a>
              <Link
                href={`/book/download/${token}`}
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-black text-[#fdf8ea] transition hover:bg-white/10"
              >
                Open your download page
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/12 bg-white/[0.05] p-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7fe3a9]" />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
                Reserved for you
              </p>
            </div>
            <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">
              Your copy is locked in.
            </h3>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              The digital edition lands right here the moment it is ready — you
              will be among the first to read it, before it ever reaches Amazon.
              You will get an email too; nothing for you to do.
            </p>
            <Link
              href="/book/updates"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-[#fdf8ea] transition hover:bg-white/10"
            >
              See book updates
            </Link>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm"
            >
              <span className="font-bold text-[#fdf8ea]">
                {o.product_name ?? "Fighting Shadows pre-order"}
              </span>
              <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#cfd9ea]">
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
