import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { QuickEvidenceForm } from "@/components/QuickEvidenceForm";

export const metadata: Metadata = {
  title: "Quick add evidence",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewEvidencePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/evidence/new");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · quick add
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Lock in evidence
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-2xl leading-relaxed">
        For tweets, news articles, congressional clips, podcast quotes — anywhere
        you read or hear something that belongs in the case log. Paste the
        verbatim quote so it&apos;s indexable. Attach to a person / event /
        grievance by slug.
      </p>

      <div className="mt-8">
        <QuickEvidenceForm />
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}
