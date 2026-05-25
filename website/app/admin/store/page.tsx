import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { StoreAdmin } from "@/components/StoreAdmin";

export const metadata: Metadata = {
  title: "Store admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminStorePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/store");
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

  // Service client so drafts (RLS-hidden) are visible to the admin.
  const svc = getSupabaseServiceClient();
  const { data } = await svc
    .from("products")
    .select("id, slug, name, type, price_cents, active, stripe_price_id")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight font-display">
        Store admin
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Create products, set prices, publish. Publishing mints the Stripe
        Product + Price if it doesn&apos;t have one yet. The public store shows
        only published items.
      </p>
      <div className="mt-6">
        <StoreAdmin products={data ?? []} />
      </div>
    </article>
  );
}
