import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { FulfillButton } from "@/components/FulfillButton";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Order = {
  id: string;
  email: string | null;
  name: string | null;
  amount_cents: number;
  status: string;
  shipping_json: { address?: Record<string, string | null> } | null;
  created_at: string;
  fulfilled_at: string | null;
};

function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function AdminOrdersPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/orders");
  const { data: isAdmin } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (isAdmin !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const { data } = await svc
    .from("orders")
    .select(
      "id, email, name, amount_cents, status, shipping_json, created_at, fulfilled_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data ?? []) as Order[];

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight font-display">Orders</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {orders.length} order{orders.length === 1 ? "" : "s"}. Paid orders come
        straight from Stripe; J6 free claims show as $0.
      </p>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-soft)] italic">
          No orders yet.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {orders.map((o) => {
            const addr = o.shipping_json?.address;
            const shipLine = addr
              ? [addr.line1, addr.city, addr.state, addr.postal_code]
                  .filter(Boolean)
                  .join(", ")
              : null;
            return (
              <div
                key={o.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 flex flex-wrap items-center gap-3"
              >
                <div className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                  {format(new Date(o.created_at), "MMM d, yyyy")}
                </div>
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm font-bold">
                    {o.name || o.email || "—"}
                  </p>
                  {o.email && o.name ? (
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {o.email}
                    </p>
                  ) : null}
                  {shipLine ? (
                    <p className="text-[11px] text-[var(--color-ink-soft)]">
                      📦 {shipLine}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm font-mono font-bold">
                  {o.amount_cents === 0 ? "FREE" : usd(o.amount_cents)}
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--color-line)] text-[var(--color-ink-soft)]">
                  {o.status}
                </span>
                <FulfillButton
                  orderId={o.id}
                  fulfilled={o.status === "fulfilled"}
                />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
