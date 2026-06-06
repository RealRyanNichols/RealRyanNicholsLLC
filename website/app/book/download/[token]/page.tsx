import type { Metadata } from "next";
import Link from "next/link";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { BOOK } from "@/lib/book";

export const dynamic = "force-dynamic";

// Token-gated and private — keep it out of search.
export const metadata: Metadata = {
  title: `Your download — ${BOOK.title}`,
  robots: { index: false, follow: false },
};

type Order = {
  product_name: string | null;
  payment_status: string | null;
  customer_name: string | null;
};

async function lookup(token: string): Promise<Order | null> {
  if (!isSupabaseServiceConfigured() || token.length < 8) return null;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("book_orders")
    .select("product_name, payment_status, customer_name")
    .eq("download_token", token)
    .maybeSingle();
  return (data as Order) ?? null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <article className="rrn-page">
      <section className="bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-20">{children}</div>
      </section>
    </article>
  );
}

export default async function BookDownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await lookup(token);

  // Reject invalid / unknown tokens.
  if (!order) {
    return (
      <Shell>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight tracking-tight text-[#fdf8ea] sm:text-5xl">
            This download link is not valid.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#cfd9ea]">
            The link may be mistyped or expired. If you pre-ordered and think
            this is a mistake, reach out and I will sort it out.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/book"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Go to the book
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-base font-black text-[#fdf8ea] transition hover:bg-white/10"
            >
              Contact Ryan
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (order.payment_status === "refunded") {
    return (
      <Shell>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight tracking-tight text-[#fdf8ea] sm:text-5xl">
            This order was refunded.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#cfd9ea]">
            The download for this order is no longer active. If you believe this
            is an error, reach out and I will look into it.
          </p>
          <div className="mt-7">
            <Link
              href="/book"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Back to the book
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const fileReady = Boolean(process.env.BOOK_DOWNLOAD_URL);
  const firstName = order.customer_name?.trim().split(/\s+/)[0];

  return (
    <Shell>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
        {BOOK.title} · Your download
      </p>
      <h1 className="mt-3 font-display text-4xl font-black leading-tight tracking-tight text-[#fdf8ea] sm:text-5xl">
        {firstName ? `Thank you, ${firstName}.` : "Thank you."}
      </h1>
      <p className="mt-3 text-base font-semibold leading-7 text-[#cfd9ea]">
        Your order:{" "}
        <span className="font-black text-[#fdf8ea]">
          {order.product_name ?? "Fighting Shadows pre-order"}
        </span>
        .
      </p>

      <div className="mt-7 rounded-xl border border-white/12 bg-white/[0.05] p-6">
        {fileReady ? (
          <>
            <h2 className="font-display text-2xl font-black tracking-normal text-[#fdf8ea]">
              Your digital edition is ready.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              This link is tied to your order. Please do not share it.
            </p>
            <a
              href={`/book/download/${token}/file`}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Download the book
            </a>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-black tracking-normal text-[#fdf8ea]">
              Digital file coming soon.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              Your pre-order is confirmed and saved to this link. The moment the
              digital edition is ready, it will appear here and you will get an
              email — no need to do anything.
            </p>
            <Link
              href="/book/updates"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-base font-black text-[#fdf8ea] transition hover:bg-white/10"
            >
              See book updates
            </Link>
          </>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.04] p-5 text-center">
        <p className="font-display text-base font-black text-[#fdf8ea]">
          Keep this in your account
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
          Sign in with the email on this order and your copy lives in your
          account — no link to keep track of.
        </p>
        <Link
          href="/login?mode=magic&next=/account"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-[#fdf8ea] transition hover:bg-white/10"
        >
          Go to my account
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-[#cfd9ea]">
        <Link href="/book" className="font-semibold underline hover:text-[#e1bd5b]">
          ← Back to the book
        </Link>
      </p>
    </Shell>
  );
}
