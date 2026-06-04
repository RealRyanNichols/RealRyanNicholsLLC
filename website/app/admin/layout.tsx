import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";

// Shared chrome for every /admin page: one persistent, grouped nav bar so
// the dashboard is actually navigable, plus a single admin gate. Pages
// keep their own is_admin check too (defense in depth).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          This area is admin-only.
        </p>
      </article>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
